import { z } from 'zod';
import type { EventPlan, EventDetails } from '../../types/event';
import { generateTailoredHeuristicPlan } from '../ai/heuristicEngine';
import { BudgetItemSchema, TimelineItemSchema, VendorItemSchema, IdeaItemSchema } from '../security/guardrails';

const STORAGE_KEY_V2 = 'planvibe_saved_events_v2';
const STORAGE_KEY_LEGACY = 'planvibe_saved_events_v1';
const ACTIVE_EVENT_KEY = 'planvibe_active_event_id';
const CURRENT_SCHEMA_VERSION = 2;

/**
 * Generates an ISO date string (YYYY-MM-DD) offset by a given number of days from today.
 * Guarantees that demo events always land in the future and countdown timers stay positive.
 */
export function getRelativeFutureDate(daysAhead: number): string {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  return target.toISOString().split('T')[0];
}

/**
 * Zod schemas for persisted EventPlan state
 */
export const StoredEventDetailsSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  type: z.enum(['wedding', 'birthday', 'community']),
  date: z.string().min(1),
  location: z.string().default('Venue TBD'),
  guestCount: z.number().int().positive().default(50),
  vibe: z.string().default('Celebration'),
  totalBudget: z.number().nonnegative().default(1000),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'AED']).default('USD'),
  specialRequests: z.string().optional().default(''),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString())
});

export const StoredBudgetSummarySchema = z.object({
  totalBudget: z.number().nonnegative(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'AED']).default('USD'),
  items: z.array(BudgetItemSchema).default([]),
  contingencyPercent: z.number().nonnegative().default(8)
});

export const StoredEventPlanSchema = z.object({
  details: StoredEventDetailsSchema,
  budget: StoredBudgetSummarySchema,
  timeline: z.array(TimelineItemSchema).default([]),
  vendors: z.array(VendorItemSchema).default([]),
  ideas: z.array(IdeaItemSchema).default([])
});

export const StorageEnvelopeSchema = z.object({
  schemaVersion: z.number().int().positive(),
  updatedAt: z.string(),
  events: z.array(StoredEventPlanSchema)
});

export function getInitialDemoEvents(): EventPlan[] {
  // 1. Luxury Botanical Wedding (approx. 4 months ahead)
  const weddingDetails: EventDetails = {
    id: 'demo-wedding-1',
    title: 'Avery & Morgan’s Botanical Glasshouse Wedding',
    type: 'wedding',
    date: getRelativeFutureDate(120),
    location: 'Conservatory of Flowers, San Francisco, CA',
    guestCount: 135,
    vibe: 'Modern Botanical Elegance with Ambient Candlelight',
    totalBudget: 38000,
    currency: 'USD',
    specialRequests: 'Prioritize farm-to-table vegetarian menu options and an acoustic string duo for ceremony.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. High-Energy Birthday (approx. 1.5 months ahead)
  const birthdayDetails: EventDetails = {
    id: 'demo-birthday-2',
    title: 'Maya’s 30th Cyberpunk Rooftop Neon Bash',
    type: 'birthday',
    date: getRelativeFutureDate(45),
    location: 'The Penthouse Vista, Brooklyn, NY',
    guestCount: 65,
    vibe: 'Futuristic Neon Cyberpunk & High Energy Dancefloor',
    totalBudget: 9500,
    currency: 'USD',
    specialRequests: 'Custom illuminated cocktail bar, guest polaroid camera wall, and DJ playing 90s synthwave.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 3. Community Impact Festival (approx. 3 months ahead)
  const communityDetails: EventDetails = {
    id: 'demo-community-3',
    title: 'Oakridge Eco-Harvest Community Street Fair',
    type: 'community',
    date: getRelativeFutureDate(90),
    location: 'Oakridge Town Square & Main Boulevard',
    guestCount: 450,
    vibe: 'Warm Autumn Harvest, Family Fun & Environmental Action',
    totalBudget: 16000,
    currency: 'USD',
    specialRequests: 'Zero-waste sorting stations, youth robotics showcase, artisan craft market, and civic permits.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return [
    generateTailoredHeuristicPlan(weddingDetails),
    generateTailoredHeuristicPlan(birthdayDetails),
    generateTailoredHeuristicPlan(communityDetails)
  ];
}

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
    return (globalThis as any).localStorage;
  }
  return null;
}

/**
 * Loads all events with strict Zod schema validation and migration support.
 * Prevents corrupted or old data structures from crashing the React UI.
 */
export function loadAllEvents(): EventPlan[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    // 1. Try modern versioned envelope (V2)
    const rawV2 = storage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsedJson = JSON.parse(rawV2);
      const envelopeResult = StorageEnvelopeSchema.safeParse(parsedJson);
      if (envelopeResult.success && envelopeResult.data.events.length > 0) {
        return envelopeResult.data.events as EventPlan[];
      }
    }

    // 2. Migration fallback from legacy unversioned storage (V1)
    const rawLegacy = storage.getItem(STORAGE_KEY_LEGACY);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        const validatedEvents: EventPlan[] = [];
        for (const item of parsedLegacy) {
          const itemResult = StoredEventPlanSchema.safeParse(item);
          if (itemResult.success) {
            validatedEvents.push(itemResult.data as EventPlan);
          }
        }
        if (validatedEvents.length > 0) {
          saveAllEvents(validatedEvents); // Upgrade to V2
          return validatedEvents;
        }
      }
    }
  } catch (e) {
    console.warn('Storage parsing or validation failed, gracefully resetting to demo defaults:', e);
  }

  // 3. Default fallback if storage empty or corrupted
  const defaults = getInitialDemoEvents();
  saveAllEvents(defaults);
  return defaults;
}

/**
 * Saves events wrapped in a versioned envelope for schema evolution.
 */
export function saveAllEvents(events: EventPlan[]): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    const envelope = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      events
    };
    storage.setItem(STORAGE_KEY_V2, JSON.stringify(envelope));
    // Also keep sync with legacy key during transition
    storage.setItem(STORAGE_KEY_LEGACY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving events to storage:', e);
  }
}

export function getActiveEventId(): string {
  const storage = getStorage();
  if (!storage) return 'demo-wedding-1';
  return storage.getItem(ACTIVE_EVENT_KEY) || 'demo-wedding-1';
}

export function setActiveEventId(id: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(ACTIVE_EVENT_KEY, id);
}

export function saveSingleEvent(updatedEvent: EventPlan): void {
  const all = loadAllEvents();
  const index = all.findIndex(e => e.details.id === updatedEvent.details.id);
  if (index >= 0) {
    all[index] = {
      ...updatedEvent,
      details: {
        ...updatedEvent.details,
        updatedAt: new Date().toISOString()
      }
    };
  } else {
    all.push(updatedEvent);
  }
  saveAllEvents(all);
}

export function deleteEvent(id: string): EventPlan[] {
  const all = loadAllEvents().filter(e => e.details.id !== id);
  saveAllEvents(all);
  return all;
}

export function exportPlanToJson(event: EventPlan): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${event.details.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_plan.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
