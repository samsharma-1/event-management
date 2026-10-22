import { describe, it, expect } from 'vitest';
import { generateTailoredHeuristicPlan } from '../src/services/ai/geminiClient';
import { generateIcsCalendar } from '../src/services/export/calendarExport';
import { getInitialDemoEvents } from '../src/services/storage/eventStorage';
import type { EventDetails } from '../src/types/event';

describe('Event Domain & Planning Logic', () => {
  it('generates specialized wedding plans with ceremony and reception breakdown', () => {
    const weddingDetails: EventDetails = {
      id: 'test-wedding',
      title: 'Liam & Sophia Wedding',
      type: 'wedding',
      date: '2026-11-20',
      location: 'Napa Valley Cellars',
      guestCount: 120,
      vibe: 'Romantic Wine Country Sunset',
      totalBudget: 40000,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const plan = generateTailoredHeuristicPlan(weddingDetails);

    expect(plan.details.type).toBe('wedding');
    expect(plan.budget.items.length).toBeGreaterThan(5);
    expect(plan.budget.contingencyPercent).toBe(8);

    // Verify wedding-specific items
    const categories = plan.budget.items.map(i => i.category);
    expect(categories).toContain('Venue & Rentals');
    expect(categories).toContain('Catering & Bar');
    expect(categories).toContain('Photography & Video');

    // Verify day-of run-of-show milestones with times
    const dayOfMilestones = plan.timeline.filter(t => t.phase === 'day-of-run-of-show');
    expect(dayOfMilestones.length).toBeGreaterThan(4);
    expect(dayOfMilestones.some(m => m.time !== undefined)).toBe(true);

    // Verify wedding vendors
    expect(plan.vendors.some(v => v.category === 'venue')).toBe(true);
    expect(plan.vendors.some(v => v.category === 'catering')).toBe(true);
  });

  it('generates specialized birthday party plans with entertainment and cake', () => {
    const birthdayDetails: EventDetails = {
      id: 'test-birthday',
      title: 'Alex 25th Birthday',
      type: 'birthday',
      date: '2026-08-15',
      location: 'Downtown Lounge',
      guestCount: 50,
      vibe: 'Retro 80s Disco',
      totalBudget: 6000,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const plan = generateTailoredHeuristicPlan(birthdayDetails);

    expect(plan.details.type).toBe('birthday');
    expect(plan.budget.items.some(i => i.name.toLowerCase().includes('cake'))).toBe(true);
    expect(plan.budget.items.some(i => i.category.toLowerCase().includes('dj') || i.category.toLowerCase().includes('sound'))).toBe(true);
  });

  it('generates specialized community event plans with permits, staging, and volunteers', () => {
    const communityDetails: EventDetails = {
      id: 'test-community',
      title: 'Riverfront Green Fair',
      type: 'community',
      date: '2026-10-05',
      location: 'Civic Esplanade',
      guestCount: 500,
      vibe: 'Eco-Friendly Neighborhood Harvest',
      totalBudget: 18000,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const plan = generateTailoredHeuristicPlan(communityDetails);

    expect(plan.details.type).toBe('community');
    expect(plan.budget.items.some(i => i.category.toLowerCase().includes('permit') || i.name.toLowerCase().includes('permit'))).toBe(true);
    expect(plan.timeline.some(t => t.title.toLowerCase().includes('permit') || t.description.toLowerCase().includes('permit'))).toBe(true);
    expect(plan.timeline.some(t => t.title.toLowerCase().includes('volunteer'))).toBe(true);
  });

  it('generates compliant iCalendar (.ics) export data', () => {
    const event: EventDetails = {
      id: 'test-ics',
      title: 'Gala Night',
      type: 'community',
      date: '2026-12-31',
      location: 'Grand Ballroom',
      guestCount: 200,
      vibe: 'Black Tie',
      totalBudget: 20000,
      currency: 'USD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const milestones = [
      {
        id: 'm-1',
        title: 'Doors Open & Welcome',
        description: 'Cocktail reception begins',
        dueDate: '2026-12-31',
        time: '18:00',
        phase: 'day-of-run-of-show' as const,
        isCompleted: false
      }
    ];

    const icsString = generateIcsCalendar(event, milestones);

    expect(icsString).toContain('BEGIN:VCALENDAR');
    expect(icsString).toContain('VERSION:2.0');
    expect(icsString).toContain('BEGIN:VEVENT');
    expect(icsString).toContain('SUMMARY:Doors Open & Welcome');
    expect(icsString).toContain('LOCATION:Grand Ballroom');
    expect(icsString).toContain('END:VEVENT');
    expect(icsString).toContain('END:VCALENDAR');
  });

  it('provides complete demo starter events for Weddings, Birthdays, and Community events', () => {
    const demos = getInitialDemoEvents();

    expect(demos).toHaveLength(3);
    const types = demos.map(d => d.details.type);
    expect(types).toContain('wedding');
    expect(types).toContain('birthday');
    expect(types).toContain('community');

    for (const demo of demos) {
      expect(demo.budget.items.length).toBeGreaterThan(0);
      expect(demo.timeline.length).toBeGreaterThan(0);
      expect(demo.vendors.length).toBeGreaterThan(0);
      expect(demo.ideas.length).toBeGreaterThan(0);
    }
  });
});
