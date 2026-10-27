export type TabType = 'home' | 'jurnal' | 'studio' | 'katalog' | 'profil';

export interface HabitState {
  water: boolean;
  vitamins: boolean;
  walk: boolean;
  sleep: boolean;
  sleepHours?: number;
  yoga?: boolean;
  reading?: boolean;
}

export interface PhotoMemory {
  id: string | number;
  caption: string;
  date: string;
  src: string;
  week?: number;
  isCustom?: boolean;
}

export interface JournalEntry {
  id: string;
  week: number;
  date: string;
  text: string;
  moodIndex: number;
  habitsSnapshot: HabitState;
  sleepHours?: number;
  createdAt: number;
}

export interface BabyWeekInfo {
  week: number;
  trimester: 1 | 2 | 3;
  month: number;
  fruitEmoji: string;
  fruitName: string;
  lengthCm: string;
  weightGrams: string;
  heartbeatBpm: string;
  daysLeft: number;
  quote: string;
  highlights: string[];
}

export interface UserProfile {
  name: string;
  babyNickname: string;
  hplDate: string; // e.g. "2025-05-18" or "18 Mei 2025"
  doctorName: string;
  hospitalName: string;
  bloodType: string;
  avatar?: string;
}

export interface BookOrder {
  coverColor: 'sage' | 'oatmeal' | 'terracotta' | 'rose' | 'charcoal';
  coverTitle: string;
  authorName: string;
  foilColor: 'gold' | 'silver' | 'roseGold';
  paperType: 'fine-art-linen' | 'cotton-matte';
  recipientName: string;
  shippingAddress: string;
  phoneNumber: string;
  status: 'draft' | 'ordered';
}

export interface ReminderSettings {
  enabled: boolean;
  vitaminTime: string;
  journalTime: string;
  waterIntervalHours: number;
  soundEnabled: boolean;
}
