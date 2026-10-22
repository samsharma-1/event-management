import type { EventPlan, EventDetails } from '../../types/event';
import { generateTailoredHeuristicPlan } from '../ai/geminiClient';

const STORAGE_KEY = 'planvibe_saved_events_v1';
const ACTIVE_EVENT_KEY = 'planvibe_active_event_id';

export function getInitialDemoEvents(): EventPlan[] {
  // 1. Luxury Botanical Wedding
  const weddingDetails: EventDetails = {
    id: 'demo-wedding-1',
    title: 'Avery & Morgan’s Botanical Glasshouse Wedding',
    type: 'wedding',
    date: '2026-09-18',
    location: 'Conservatory of Flowers, San Francisco, CA',
    guestCount: 135,
    vibe: 'Modern Botanical Elegance with Ambient Candlelight',
    totalBudget: 38000,
    currency: 'USD',
    specialRequests: 'Prioritize farm-to-table vegetarian menu options and an acoustic string duo for ceremony.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 2. High-Energy Birthday
  const birthdayDetails: EventDetails = {
    id: 'demo-birthday-2',
    title: 'Maya’s 30th Cyberpunk Rooftop Neon Bash',
    type: 'birthday',
    date: '2026-07-25',
    location: 'The Penthouse Vista, Brooklyn, NY',
    guestCount: 65,
    vibe: 'Futuristic Neon Cyberpunk & High Energy Dancefloor',
    totalBudget: 9500,
    currency: 'USD',
    specialRequests: 'Custom illuminated cocktail bar, guest polaroid camera wall, and DJ playing 90s synthwave.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // 3. Community Impact Festival
  const communityDetails: EventDetails = {
    id: 'demo-community-3',
    title: 'Oakridge Eco-Harvest Community Street Fair',
    type: 'community',
    date: '2026-10-10',
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

export function loadAllEvents(): EventPlan[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const defaults = getInitialDemoEvents();
      saveAllEvents(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Error loading events from storage, resetting to default:', e);
  }
  const defaults = getInitialDemoEvents();
  saveAllEvents(defaults);
  return defaults;
}

export function saveAllEvents(events: EventPlan[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Error saving events to storage:', e);
  }
}

export function getActiveEventId(): string {
  if (typeof window === 'undefined') return 'demo-wedding-1';
  return localStorage.getItem(ACTIVE_EVENT_KEY) || 'demo-wedding-1';
}

export function setActiveEventId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_EVENT_KEY, id);
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
