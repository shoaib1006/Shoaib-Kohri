export type SlotStatus = 'available' | 'frozen' | 'confirmed';

export interface Slot {
  id: string;
  date: string;
  time: string;
  status: SlotStatus;
  frozenAt?: string;
  userId?: string;
  paymentId?: string;
}

export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  source: 'whatsapp' | 'voice';
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  amount: number;
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
}

export interface SentimentPoint {
  time: number;
  sentiment: number;
  engagement: number;
}

export interface CoachingCard {
  strengths: string[];
  missedOpportunities: string[];
}

export interface CallTranscript {
  id: string;
  bookingId: string;
  transcript: TranscriptEntry[];
  entities: {
    date: string;
    time: string;
    playerCount: number;
  };
  sentimentTimeline: SentimentPoint[];
  coachingCard: CoachingCard;
  managerFeedback?: {
    text: string;
    rating: number;
    createdAt: string;
    managerId: string;
  };
}

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold';

export interface UserLoyalty {
  userId: string;
  points: number;
  tier: LoyaltyTier;
  totalSpent: number;
  updatedAt: string;
}
