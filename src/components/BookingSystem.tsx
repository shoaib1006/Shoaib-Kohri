import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Calendar as CalendarIcon, Clock, Smartphone, Phone, CheckCircle2, QrCode, Loader2 } from 'lucide-react';
import { format, addMinutes, isAfter } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { Slot, Booking, UserLoyalty, LoyaltyTier } from '../types';

import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function BookingSystem() {
  const [user, setUser] = useState(auth.currentUser);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'freezing' | 'frozen' | 'paying' | 'confirmed'>('idle');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    const path = 'slots';
    const q = query(collection(db, path));
    const unsubscribeSlots = onSnapshot(q, (snapshot) => {
      const slotsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
      setSlots(slotsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSlots();
    };
  }, []);

  const updateLoyaltyPoints = async (amount: number) => {
    if (!user) return;
    const path = `loyalty/${user.uid}`;
    const loyaltyRef = doc(db, 'loyalty', user.uid);
    
    try {
      const snap = await getDoc(loyaltyRef);
      
      let currentLoyalty: UserLoyalty;
      if (snap.exists()) {
        currentLoyalty = snap.data() as UserLoyalty;
      } else {
        currentLoyalty = {
          userId: user.uid,
          points: 0,
          tier: 'Bronze',
          totalSpent: 0,
          updatedAt: new Date().toISOString()
        };
      }

      const newPoints = currentLoyalty.points + Math.floor(amount / 10);
      const newTotalSpent = currentLoyalty.totalSpent + amount;
      
      let newTier: LoyaltyTier = 'Bronze';
      if (newPoints > 1500) newTier = 'Gold';
      else if (newPoints > 500) newTier = 'Silver';

      await setDoc(loyaltyRef, {
        ...currentLoyalty,
        points: newPoints,
        totalSpent: newTotalSpent,
        tier: newTier,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const freezeSlot = async (slot: Slot) => {
    if (!user) return handleLogin();
    
    const path = `slots/${slot.id}`;
    setBookingStatus('freezing');
    try {
      const slotRef = doc(db, 'slots', slot.id);
      await updateDoc(slotRef, {
        status: 'frozen',
        frozenAt: new Date().toISOString(),
        userId: user.uid
      });
      setSelectedSlot({ ...slot, status: 'frozen', userId: user.uid });
      setBookingStatus('frozen');
      
      // Auto-release after 10 mins (simulated client-side for UI, server should handle real logic)
      setTimeout(() => {
        setBookingStatus(prev => prev === 'frozen' ? 'idle' : prev);
      }, 10 * 60 * 1000);

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      setBookingStatus('idle');
    }
  };

  const confirmPayment = async () => {
    if (!selectedSlot || !user) return;
    setBookingStatus('paying');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const slotPath = `slots/${selectedSlot.id}`;
      const slotRef = doc(db, 'slots', selectedSlot.id);
      await updateDoc(slotRef, {
        status: 'confirmed',
        userId: user.uid
      });

      const amount = 1500;
      const bookingPath = 'bookings';
      await addDoc(collection(db, bookingPath), {
        slotId: selectedSlot.id,
        userId: user.uid,
        source: 'whatsapp', // Default for web demo
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        amount: amount
      });

      await updateLoyaltyPoints(amount);

      setBookingStatus('confirmed');
    } catch (error) {
      console.error("Error confirming payment:", error);
      setBookingStatus('frozen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Available Slots</h3>
          <p className="text-2xl font-extrabold text-foreground">Select Your Session</p>
        </div>
        {!user && (
          <Button onClick={handleLogin} className="h-11 px-6 text-xs font-bold uppercase">Sign in to Book</Button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <div 
            key={slot.id} 
            onClick={() => slot.status === 'available' && freezeSlot(slot)}
            className={`
              relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-4 min-h-[120px]
              ${slot.status === 'available' ? 'bg-white border-border hover:border-primary' : ''}
              ${slot.status === 'frozen' ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]' : ''}
              ${slot.status === 'confirmed' ? 'bg-[#DCFCE7] border-[#10B981] text-[#166534]' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-wider">{slot.time}</span>
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-current">
                {slot.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl font-extrabold">₹1,500</span>
              {slot.status === 'available' && (
                <Button size="sm" className="h-11 px-6 text-xs font-bold uppercase">Book Now</Button>
              )}
              {slot.status === 'frozen' && (
                <span className="text-[10px] font-mono font-bold">LOCK: 09:59</span>
              )}
              {slot.status === 'confirmed' && (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
          </div>
        ))}
      </div>

      {bookingStatus !== 'idle' && selectedSlot && (
        <Card className="border-primary bg-primary/5 shadow-none rounded-2xl">
          <CardHeader className="border-b border-primary/10">
            <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
              {bookingStatus === 'confirmed' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {bookingStatus === 'confirmed' ? 'Booking Confirmed!' : 'Complete Your Payment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6 py-8">
            {bookingStatus === 'frozen' && (
              <>
                <div className="p-6 bg-white rounded-2xl shadow-sm border">
                  <QRCodeSVG value={`upi://pay?pa=royalacademy@upi&pn=TheRoyalAcademy&am=1500&tr=${selectedSlot.id}`} size={200} />
                </div>
                <div className="text-center space-y-3">
                  <p className="text-lg font-extrabold">Scan QR to pay via UPI</p>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Slot frozen for 10:00 minutes</p>
                  <Button onClick={confirmPayment} className="mt-4 w-full h-12 text-sm font-bold uppercase tracking-wider">I have paid</Button>
                </div>
              </>
            )}
            {bookingStatus === 'confirmed' && (
              <div className="text-center space-y-4 max-w-md">
                <p className="text-xl font-extrabold">Your booking is secured.</p>
                <p className="text-sm text-muted-foreground">A confirmation receipt has been sent to your registered WhatsApp number.</p>
                <Button variant="outline" onClick={() => setBookingStatus('idle')} className="mt-4 h-11 text-xs font-bold uppercase">Book Another Session</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
