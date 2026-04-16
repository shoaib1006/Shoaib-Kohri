import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, query, onSnapshot, orderBy, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Phone, Smartphone, MessageSquare, TrendingUp, Users, Clock, Award, AlertCircle, Sparkles, Loader2, Star } from 'lucide-react';
import { CallTranscript, Booking } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Dashboard() {
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<CallTranscript | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const adminEmails = ["shoaibkohri1006@gmail.com", "falkon.kohri404@gmail.com"];
    setIsAdmin(auth.currentUser?.email ? adminEmails.includes(auth.currentUser.email) : false);
  }, []);

  const handleSaveFeedback = async () => {
    if (!selectedTranscript || !feedbackText) return;
    setIsSavingFeedback(true);
    const path = `transcripts/${selectedTranscript.id}`;
    try {
      const docRef = doc(db, 'transcripts', selectedTranscript.id);
      const feedback = {
        text: feedbackText,
        rating: feedbackRating,
        createdAt: new Date().toISOString(),
        managerId: auth.currentUser?.uid || 'admin'
      };
      await updateDoc(docRef, { managerFeedback: feedback });
      setSelectedTranscript({ ...selectedTranscript, managerFeedback: feedback });
      setFeedbackText('');
      setFeedbackRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const simulateCallAnalysis = async () => {
    setIsAnalyzing(true);
    const path = 'transcripts';
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: "Generate a realistic diarized transcript for a box cricket booking call at 'The Royal Turf & Academy'. Include speaker (Salesperson/Customer), text, and timestamp. Also provide sentiment timeline (0-10), key entities (date, time, players), and a coaching card (3 strengths, 3 missed opportunities). Format as JSON.",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              transcript: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    text: { type: Type.STRING },
                    timestamp: { type: Type.NUMBER }
                  }
                }
              },
              entities: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  playerCount: { type: Type.NUMBER }
                }
              },
              sentimentTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    time: { type: Type.NUMBER },
                    sentiment: { type: Type.NUMBER },
                    engagement: { type: Type.NUMBER }
                  }
                }
              },
              coachingCard: {
                type: Type.OBJECT,
                properties: {
                  strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                  missedOpportunities: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      });

      const analysis = JSON.parse(response.text);
      const docRef = await addDoc(collection(db, path), {
        ...analysis,
        bookingId: `sim-${Date.now()}`,
        createdAt: new Date().toISOString()
      });
      
      // Select the new one
      setSelectedTranscript({ id: docRef.id, ...analysis });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    const transcriptsPath = 'transcripts';
    const qT = query(collection(db, transcriptsPath));
    const unsubscribeT = onSnapshot(qT, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CallTranscript));
      setTranscripts(data);
      if (data.length > 0 && !selectedTranscript) setSelectedTranscript(data[0]);
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, transcriptsPath);
      }
    });

    const bookingsPath = 'bookings';
    const qB = query(collection(db, bookingsPath), orderBy('createdAt', 'desc'));
    const unsubscribeB = onSnapshot(qB, (snapshot) => {
      setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
    }, (error) => {
      if (!error.message.includes('insufficient permissions')) {
        handleFirestoreError(error, OperationType.GET, bookingsPath);
      }
    });

    return () => {
      unsubscribeT();
      unsubscribeB();
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <AlertCircle className="w-12 h-12 text-danger" />
        <h3 className="text-xl font-bold">Access Denied</h3>
        <p className="text-muted-foreground">You do not have permission to view the Admin Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">₹{bookings.reduce((acc, b) => acc + b.amount, 0).toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">{bookings.length}</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Across all channels</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. Sentiment</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">8.4/10</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Customer satisfaction index</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Missed Opps</CardTitle>
            <AlertCircle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold">12</div>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">Identified by AI</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transcripts" className="space-y-4">
        <TabsList className="w-full lg:w-auto flex overflow-x-auto no-scrollbar">
          <TabsTrigger value="transcripts" className="flex-1 lg:flex-none min-h-[44px]">Call Intelligence</TabsTrigger>
          <TabsTrigger value="bookings" className="flex-1 lg:flex-none min-h-[44px]">Recent Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="transcripts" className="space-y-4">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b py-4">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Call Recordings</CardTitle>
                </div>
                <Button size="sm" variant="outline" onClick={simulateCallAnalysis} disabled={isAnalyzing} className="h-11 lg:h-9 px-4 text-[10px] font-bold uppercase">
                  {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 mr-2" />}
                  Simulate Call
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  <div className="divide-y">
                    {transcripts.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 cursor-pointer transition-all ${selectedTranscript?.id === t.id ? 'bg-primary/5 border-l-4 border-primary' : 'hover:bg-muted'}`}
                        onClick={() => setSelectedTranscript(t)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase border-blue-200 text-blue-600 bg-blue-50">
                            VOICE CALL
                          </Badge>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">2 mins ago</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">Booking for {t.entities.date}</p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {t.entities.playerCount} Players</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {t.entities.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              {selectedTranscript ? (
                <ScrollArea className="h-[600px]">
                  <CardHeader className="border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Analysis: {selectedTranscript.id}</CardTitle>
                      <Badge className="bg-red-100 text-red-600 border-none font-bold text-[10px] px-2 py-0.5 uppercase">High Intent</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Sentiment & Engagement Timeline
                      </h4>
                      <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={selectedTranscript.sentimentTimeline}>
                            <defs>
                              <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={[0, 10]} hide />
                            <Tooltip />
                            <Area type="monotone" dataKey="sentiment" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" name="Sentiment" />
                            <Area type="monotone" dataKey="engagement" stroke="#10b981" fill="transparent" name="Engagement" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                      <div className="p-5 rounded-xl bg-white border shadow-sm">
                        <h5 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <span className="text-success">✔</span> STRENGTHS
                        </h5>
                        <ul className="text-sm space-y-3">
                          {selectedTranscript.coachingCard.strengths.map((s, i) => (
                            <li key={i} className="flex gap-3 pb-3 border-b border-dashed last:border-0">
                              <span className="text-success">•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-5 rounded-xl bg-white border shadow-sm">
                        <h5 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                          <span className="text-danger">⚠</span> OPPORTUNITIES
                        </h5>
                        <ul className="text-sm space-y-3">
                          {selectedTranscript.coachingCard.missedOpportunities.map((m, i) => (
                            <li key={i} className="flex gap-3 pb-3 border-b border-dashed last:border-0">
                              <span className="text-danger">•</span>
                              {m}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Manager Feedback Section */}
                    <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                      <h4 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                        <MessageSquare className="w-4 h-4 text-primary" /> Manager's Performance Feedback
                      </h4>
                      
                      {selectedTranscript.managerFeedback ? (
                        <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= selectedTranscript.managerFeedback!.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(selectedTranscript.managerFeedback.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700 italic">"{selectedTranscript.managerFeedback.text}"</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Performance Rating</label>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setFeedbackRating(star)}
                                  className={`p-1 transition-all ${feedbackRating >= star ? 'text-yellow-400 scale-110' : 'text-slate-300 hover:text-slate-400'}`}
                                >
                                  <Star className={`w-5 h-5 ${feedbackRating >= star ? 'fill-yellow-400' : ''}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Direct Feedback</label>
                            <textarea
                              value={feedbackText}
                              onChange={(e) => setFeedbackText(e.target.value)}
                              placeholder="Provide actionable feedback to the salesperson..."
                              className="w-full min-h-[100px] p-3 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none bg-white"
                            />
                          </div>
                          <Button 
                            onClick={handleSaveFeedback} 
                            disabled={!feedbackText || isSavingFeedback}
                            className="w-full gap-2"
                          >
                            {isSavingFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Save & Send Feedback
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Diarized Transcript</h4>
                      <div className="space-y-3">
                        {selectedTranscript.transcript.map((entry, i) => (
                          <div key={i} className={`flex flex-col ${entry.speaker === 'Salesperson' ? 'items-start' : 'items-end'}`}>
                            <div className={`
                              max-w-[90%] p-3 rounded-lg text-sm relative
                              ${entry.speaker === 'Salesperson' 
                                ? 'bg-[#F8FAFC] border-l-4 border-primary text-foreground' 
                                : 'bg-[#ECFDF5] border-l-4 border-success text-foreground'}
                            `}>
                              <div className="flex justify-between items-center gap-4 mb-1">
                                <span className="text-[10px] font-extrabold uppercase opacity-50">{entry.speaker}</span>
                                <span className="text-[10px] opacity-50">00:{entry.timestamp.toString().padStart(2, '0')}</span>
                              </div>
                              {entry.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a recording to view analysis
                </div>
              )}
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center w-fit gap-1">
                          {b.source === 'whatsapp' ? <MessageSquare className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
                          {b.source}
                        </Badge>
                      </TableCell>
                      <TableCell>₹{b.amount}</TableCell>
                      <TableCell>
                        <Badge className={b.status === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'}>
                          {b.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
