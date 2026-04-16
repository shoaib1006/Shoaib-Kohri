import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Award, Star, Zap, Gift, ArrowUpCircle } from 'lucide-react';
import { UserLoyalty, LoyaltyTier } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const TIER_CONFIG = {
  Bronze: { min: 0, max: 500, color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Star, benefits: ['Standard Booking'] },
  Silver: { min: 501, max: 1500, color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Award, benefits: ['5% Discount', 'Priority Support'] },
  Gold: { min: 1501, max: Infinity, color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Zap, benefits: ['10% Discount', 'Priority Slot Booking', 'Free Refreshments'] },
};

export default function LoyaltyProfile() {
  const [loyalty, setLoyalty] = useState<UserLoyalty | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const path = `loyalty/${user.uid}`;
        const loyaltyRef = doc(db, 'loyalty', user.uid);
        const unsubscribeLoyalty = onSnapshot(loyaltyRef, (docSnap) => {
          if (docSnap.exists()) {
            setLoyalty(docSnap.data() as UserLoyalty);
          } else {
            // Initialize loyalty for new user
            const initialLoyalty: UserLoyalty = {
              userId: user.uid,
              points: 0,
              tier: 'Bronze',
              totalSpent: 0,
              updatedAt: new Date().toISOString()
            };
            setDoc(loyaltyRef, initialLoyalty).catch(error => {
              handleFirestoreError(error, OperationType.WRITE, path);
            });
            setLoyalty(initialLoyalty);
          }
          setLoading(false);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        });
        return () => unsubscribeLoyalty();
      } else {
        setLoyalty(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading loyalty profile...</div>;
  if (!loyalty) return <div className="p-8 text-center">Please sign in to view your loyalty rewards.</div>;

  const currentTier = TIER_CONFIG[loyalty.tier];
  const nextTier = loyalty.tier === 'Bronze' ? 'Silver' : loyalty.tier === 'Silver' ? 'Gold' : null;
  const progress = nextTier ? ((loyalty.points - currentTier.min) / (TIER_CONFIG[nextTier].min - currentTier.min)) * 100 : 100;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Customer Loyalty</h3>
          <p className="text-2xl font-extrabold text-foreground">Your Rewards Hub</p>
        </div>
        <Badge className={`${currentTier.color} px-3 py-1 font-bold uppercase text-[10px]`}>
          {loyalty.tier} Member
        </Badge>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Points Progress</CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
              <div>
                <span className="text-4xl font-extrabold text-primary">{loyalty.points}</span>
                <span className="text-sm font-bold text-muted-foreground ml-2 uppercase">Points</span>
              </div>
              {nextTier && (
                <div className="sm:text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Next Tier: {nextTier}</p>
                  <p className="text-xs font-bold">{TIER_CONFIG[nextTier].min - loyalty.points} points to go</p>
                </div>
              )}
            </div>
            <Progress value={progress} className="h-3" />
            
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Spent</p>
                <p className="text-lg font-extrabold">₹{loyalty.totalSpent.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Bookings Made</p>
                <p className="text-lg font-extrabold">{Math.floor(loyalty.points / 150)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tier Benefits</CardTitle>
          </CardHeader>
          <CardContent className="py-6">
            <div className="space-y-4">
              {currentTier.benefits.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Gift className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-foreground">{benefit}</span>
                </div>
              ))}
              {nextTier && (
                <div className="pt-4 border-t border-dashed">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Unlock with {nextTier}:</p>
                  {TIER_CONFIG[nextTier].benefits.map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 opacity-50 mb-2">
                      <ArrowUpCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Redeem Points</CardTitle>
        </CardHeader>
        <CardContent className="py-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="p-5 rounded-xl border-2 border-dashed border-border flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer group min-h-[120px]">
              <div className="flex items-center justify-between">
                <Star className="w-5 h-5 text-yellow-500" />
                <Badge variant="outline" className="text-[10px] font-bold">500 PTS</Badge>
              </div>
              <p className="text-sm font-bold group-hover:text-primary transition-colors">₹50 Discount Voucher</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Valid for next booking</p>
            </div>
            <div className="p-5 rounded-xl border-2 border-dashed border-border flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer group min-h-[120px]">
              <div className="flex items-center justify-between">
                <Star className="w-5 h-5 text-yellow-500" />
                <Badge variant="outline" className="text-[10px] font-bold">1200 PTS</Badge>
              </div>
              <p className="text-sm font-bold group-hover:text-primary transition-colors">₹150 Discount Voucher</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Valid for next booking</p>
            </div>
            <div className="p-5 rounded-xl border-2 border-dashed border-border flex flex-col gap-3 hover:border-primary transition-colors cursor-pointer group min-h-[120px]">
              <div className="flex items-center justify-between">
                <Star className="w-5 h-5 text-yellow-500" />
                <Badge variant="outline" className="text-[10px] font-bold">2500 PTS</Badge>
              </div>
              <p className="text-sm font-bold group-hover:text-primary transition-colors">Free 1-Hour Session</p>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Weekday slots only</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
