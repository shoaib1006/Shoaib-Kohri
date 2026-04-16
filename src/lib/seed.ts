import { db } from './firebase';
import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';

export const seedData = async () => {
  const slotsRef = collection(db, 'slots');
  const slotsSnap = await getDocs(query(slotsRef, limit(1)));
  
  if (!slotsSnap.empty) return; // Already seeded

  console.log("Seeding data...");

  // Seed Slots
  const slots = [
    { date: '2026-04-20', time: '18:00-19:00', status: 'available' },
    { date: '2026-04-20', time: '19:00-20:00', status: 'available' },
    { date: '2026-04-20', time: '20:00-21:00', status: 'available' },
    { date: '2026-04-21', time: '18:00-19:00', status: 'available' },
    { date: '2026-04-21', time: '19:00-20:00', status: 'available' },
  ];

  for (const s of slots) {
    await addDoc(slotsRef, s);
  }

  // Seed a sample transcript
  await addDoc(collection(db, 'transcripts'), {
    bookingId: 'sample-1',
    entities: { date: '2026-04-20', time: '18:00', playerCount: 12 },
    sentimentTimeline: Array.from({ length: 10 }, (_, i) => ({
      time: i * 10,
      sentiment: 5 + Math.random() * 4,
      engagement: 6 + Math.random() * 3
    })),
    coachingCard: {
      strengths: ["Effective greeting", "Upselling night-light charges", "Clear pricing explanation"],
      missedOpportunities: ["Failed to mention weekend surcharges", "Did not ask for a referral", "Missed opportunity to suggest membership"]
    },
    transcript: [
      { speaker: "Customer", text: "Hi, I want to book a slot for Monday evening.", timestamp: 0 },
      { speaker: "Salesperson", text: "Hello! Welcome to The Royal Turf & Academy. I can definitely help with that. Monday evening we have 6 PM and 8 PM available.", timestamp: 5 },
      { speaker: "Customer", text: "Is the 6 PM slot available for 2 hours?", timestamp: 15 },
      { speaker: "Salesperson", text: "Yes, it is! We also have special night-light charges for evening slots which include professional-grade lighting.", timestamp: 25 },
      { speaker: "Customer", text: "Okay, that sounds good. What's the price?", timestamp: 40 },
      { speaker: "Salesperson", text: "It's ₹1,500 per hour. For 2 hours, it will be ₹3,000.", timestamp: 50 }
    ]
  });

  console.log("Seeding complete.");
};
