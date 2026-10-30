export type EventType = 'wedding' | 'birthday' | 'community';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR' | 'CAD' | 'AUD' | 'AED';

export type RegionCode = 'IN' | 'US' | 'UK' | 'EU' | 'CA' | 'AU' | 'AE';

export interface RegionConfig {
  code: RegionCode;
  country: string;
  currency: Currency;
  symbol: string;
  locale: string;
  flag: string;
}

export const SUPPORTED_REGIONS: RegionConfig[] = [
  { code: 'IN', country: 'India', currency: 'INR', symbol: '₹', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'US', country: 'USA', currency: 'USD', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'UK', country: 'United Kingdom', currency: 'GBP', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'EU', country: 'Europe', currency: 'EUR', symbol: '€', locale: 'de-DE', flag: '🇪🇺' },
  { code: 'CA', country: 'Canada', currency: 'CAD', symbol: 'CA$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'AU', country: 'Australia', currency: 'AUD', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'AE', country: 'UAE', currency: 'AED', symbol: 'د.إ', locale: 'ar-AE', flag: '🇦🇪' }
];

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  notes?: string;
  isPaidInFull: boolean;
  priority: 'must-have' | 'nice-to-have' | 'optional';
}

export interface BudgetSummary {
  totalBudget: number;
  currency: Currency;
  items: BudgetItem[];
  contingencyPercent: number; // e.g., 10%
}

export type TimelinePhase = 'months-before' | 'weeks-before' | 'days-before' | 'day-of-run-of-show';

export interface TimelineMilestone {
  id: string;
  title: string;
  description: string;
  dueDate: string; // ISO date or time string
  time?: string; // e.g. "14:00" for day-of
  phase: TimelinePhase;
  isCompleted: boolean;
  assignedTo?: string;
  category?: string;
}

export type VendorStatus = 
  | 'researching' 
  | 'contacted' 
  | 'quoted' 
  | 'contract-signed' 
  | 'deposit-paid' 
  | 'confirmed' 
  | 'completed';

export interface VendorItem {
  id: string;
  category: 'venue' | 'catering' | 'photography' | 'music-entertainment' | 'decor-florals' | 'permits-security' | 'cake-bakery' | 'attire-styling' | 'transportation' | 'other';
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  status: VendorStatus;
  quotedPrice?: number;
  depositPaid?: number;
  contractSignedDate?: string;
  notes?: string;
  checklistItems: { id: string; text: string; done: boolean }[];
}

export interface PersonalizedIdea {
  id: string;
  title: string;
  category: 'theme' | 'activity' | 'decor' | 'food-drink' | 'entertainment' | 'speech-vows' | 'community-impact' | 'budget-hack';
  description: string;
  tags: string[];
  estimatedCostImpact?: 'free' | 'low' | 'moderate' | 'high';
  actionableSteps?: string[];
  moodColors?: string[]; // hex codes for themes
}

export interface EventDetails {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO date string
  location: string;
  guestCount: number;
  vibe: string; // e.g. "Rustic Elegance", "Retro 90s Neon", "Eco-friendly Neighborhood Green Day"
  totalBudget: number;
  currency: Currency;
  specialRequests?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventPlan {
  details: EventDetails;
  budget: BudgetSummary;
  timeline: TimelineMilestone[];
  vendors: VendorItem[];
  ideas: PersonalizedIdea[];
}

export type SuggestedActionPayload =
  | BudgetItem
  | TimelineMilestone
  | VendorItem
  | PersonalizedIdea
  | Record<string, unknown>;

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  securityFlag?: 'safe' | 'sanitized' | 'blocked';
  suggestedActions?: {
    label: string;
    actionType: 'add-budget' | 'add-timeline' | 'add-vendor' | 'add-idea';
    payload: SuggestedActionPayload;
  }[];
}

export interface SecurityAuditEntry {
  id: string;
  timestamp: string;
  inputExcerpt: string;
  actionTaken: 'cleared' | 'sanitized' | 'flagged' | 'blocked';
  ruleViolated?: string;
  confidenceScore: number;
}
