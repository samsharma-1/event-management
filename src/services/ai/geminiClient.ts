import type { EventDetails, EventPlan, PersonalizedIdea, TimelineMilestone, BudgetItem, VendorItem } from '../../types/event';
import { sanitizeUserInput, validateAIOutput } from '../security/guardrails';
import { buildEventGenerationPrompt, buildAIChatAssistantPrompt, SYSTEM_CORE_INSTRUCTION } from './promptTemplates';

const GEMINI_STORAGE_KEY = 'planvibe_gemini_api_key';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(GEMINI_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
  }
  return '';
}

export function setStoredApiKey(key: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  }
}

export function clearStoredApiKey(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

/**
 * Main GenAI Orchestrator:
 * Generates full event plans using Live Gemini API or Fallback Heuristic AI Engine.
 */
export async function generateEventPlanAI(
  details: EventDetails,
  onProgress?: (status: string) => void
): Promise<EventPlan> {
  const apiKey = getStoredApiKey();

  // 1. Sanitize user inputs to guard against prompt injection
  const titleCheck = sanitizeUserInput(details.title);
  const vibeCheck = sanitizeUserInput(details.vibe);
  const notesCheck = sanitizeUserInput(details.specialRequests || '');

  const sanitizedDetails: EventDetails = {
    ...details,
    title: titleCheck.sanitizedText,
    vibe: vibeCheck.sanitizedText,
    specialRequests: notesCheck.sanitizedText
  };

  onProgress?.('Applying security guardrails and sanitizing prompt parameters...');

  // 2. Decide between Live Gemini or High-Fidelity Heuristic AI Engine
  if (apiKey) {
    try {
      onProgress?.('Connecting to Google Gemini API (gemini-1.5-flash)...');
      const liveResult = await callLiveGeminiAPI(sanitizedDetails, apiKey);
      if (liveResult) {
        onProgress?.('Validating AI response against strict Zod schema...');
        const validated = validateAIOutput(liveResult);
        if (validated.success && validated.data) {
          onProgress?.('Plan successfully synthesized!');
          return transformValidatedDataToPlan(sanitizedDetails, validated.data);
        } else {
          console.warn('Live Gemini output validation failed, falling back to heuristic engine:', validated.error);
        }
      }
    } catch (err) {
      console.warn('Live Gemini API call failed or rate-limited, safely falling back to heuristic engine:', err);
    }
  }

  // 3. High-Fidelity Adaptive Heuristic AI Engine
  onProgress?.('Generating tailored plan via PlanVibe Adaptive Heuristic AI...');
  await new Promise(resolve => setTimeout(resolve, 600)); // Smooth UX transition
  return generateTailoredHeuristicPlan(sanitizedDetails);
}

/**
 * Calls Google Gemini REST endpoint with strict JSON schema mode
 */
async function callLiveGeminiAPI(details: EventDetails, apiKey: string): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const prompt = buildEventGenerationPrompt(details);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: `${SYSTEM_CORE_INSTRUCTION}\n\n${prompt}` }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 3500
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) return null;

  return JSON.parse(rawText);
}

/**
 * Adaptive Heuristic Plan Generator
 * Produces deep, realistic, mathematically sound data customized to event type, budget, date, and vibe.
 */
export function generateTailoredHeuristicPlan(details: EventDetails): EventPlan {
  const { type, totalBudget, currency, date, guestCount, vibe, title } = details;
  const eventDate = new Date(date || Date.now() + 90 * 86400000);

  // Helper date calculator
  const formatOffsetDate = (daysOffset: number): string => {
    const d = new Date(eventDate.getTime() - daysOffset * 86400000);
    return d.toISOString().split('T')[0];
  };

  let budgetItems: BudgetItem[] = [];
  let timelineItems: TimelineMilestone[] = [];
  let vendorItems: VendorItem[] = [];
  let ideas: PersonalizedIdea[] = [];
  let themeVibeSummary = '';

  const contingencyAmount = Math.round(totalBudget * 0.08);
  const allocatableBudget = totalBudget - contingencyAmount;

  if (type === 'wedding') {
    themeVibeSummary = `A breathtaking wedding celebrating "${title}" steeped in ${vibe}. The aesthetic marries timeless romance with thoughtful guest comforts, tailored for ${guestCount} cherished guests with warm amber candlelight and artisanal textures.`;

    budgetItems = [
      { id: 'b-1', category: 'Venue & Rentals', name: 'Ceremony & Reception Venue Rental', estimatedCost: Math.round(allocatableBudget * 0.38), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Includes tables, Chiavari chairs, and bridal suite', isPaidInFull: false },
      { id: 'b-2', category: 'Catering & Bar', name: `Plated Dinner & Open Bar (${guestCount} guests)`, estimatedCost: Math.round(allocatableBudget * 0.28), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: `Target ~$${Math.round((allocatableBudget * 0.28) / Math.max(1, guestCount))}/head with custom cocktail pairings`, isPaidInFull: false },
      { id: 'b-3', category: 'Photography & Video', name: 'Full-Day Photo & Video Storytellers', estimatedCost: Math.round(allocatableBudget * 0.12), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: '10-hour coverage, second shooter, drone footage and raw archive', isPaidInFull: false },
      { id: 'b-4', category: 'Decor & Floral', name: 'Floral Arch & Centerpieces', estimatedCost: Math.round(allocatableBudget * 0.08), actualCost: 0, paidAmount: 0, priority: 'nice-to-have', notes: `Styled in harmony with "${vibe}" aesthetic`, isPaidInFull: false },
      { id: 'b-5', category: 'Music & Entertainment', name: 'Ceremony Strings & Reception DJ/Emcee', estimatedCost: Math.round(allocatableBudget * 0.06), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Includes sound system, wireless mics, and custom lighting', isPaidInFull: false },
      { id: 'b-6', category: 'Attire & Styling', name: 'Bridal Gown, Tuxedo & Hair/Makeup', estimatedCost: Math.round(allocatableBudget * 0.05), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Includes alterations and trial runs', isPaidInFull: false },
      { id: 'b-7', category: 'Bakery', name: 'Bespoke 3-Tier Wedding Cake', estimatedCost: Math.round(allocatableBudget * 0.03), actualCost: 0, paidAmount: 0, priority: 'optional', notes: 'Plus dessert tasting bar', isPaidInFull: false },
      { id: 'b-8', category: 'Contingency', name: '8% Buffer & Gratuities Pool', estimatedCost: contingencyAmount, actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Safety net for weather provisions, overtime fees, or tips', isPaidInFull: false },
    ];

    timelineItems = [
      { id: 't-1', title: 'Lock In Primary Venue & Date', description: 'Tour finalists, review sound ordinances, verify guest capacity and sign agreement.', dueDate: formatOffsetDate(180), phase: 'months-before', isCompleted: true, category: 'Venue' },
      { id: 't-2', title: 'Book Photographer & Videographer', description: 'Review full wedding galleries, ensure style matches vibe, execute contract.', dueDate: formatOffsetDate(150), phase: 'months-before', isCompleted: false, category: 'Media' },
      { id: 't-3', title: 'Mail Save-The-Dates', description: `Notify ${guestCount} guests, launch wedding website with RSVP tracking.`, dueDate: formatOffsetDate(120), phase: 'months-before', isCompleted: false, category: 'Guest Ops' },
      { id: 't-4', title: 'Catering Tasting & Menu Curation', description: 'Sample entrees, select wine pairings, finalize dietary vegan/GF alternatives.', dueDate: formatOffsetDate(75), phase: 'weeks-before', isCompleted: false, category: 'Catering' },
      { id: 't-5', title: 'Final RSVP & Seating Chart Cutoff', description: 'Confirm final headcount with caterer and venue manager.', dueDate: formatOffsetDate(14), phase: 'weeks-before', isCompleted: false, category: 'Logistics' },
      { id: 't-6', title: 'Rehearsal Dinner & Walkthrough', description: 'Practice processional pacing, hand off emergency kit to Maid of Honor.', dueDate: formatOffsetDate(1), phase: 'days-before', isCompleted: false, category: 'Run-of-Show' },
      { id: 't-7', title: 'Hair & Makeup Glam Session', description: 'Bridal suite preparations with mimosa toast.', dueDate: details.date, time: '09:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-8', title: 'First Look & Couple Portraits', description: 'Private intimate portraits before guests arrive; captures golden natural light.', dueDate: details.date, time: '14:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-9', title: 'Guest Arrival & Prelude Music', description: 'Ushers seated, welcome refreshments served.', dueDate: details.date, time: '16:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-10', title: 'Wedding Ceremony', description: 'Processional, exchange of vows and rings, first kiss.', dueDate: details.date, time: '16:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-11', title: 'Cocktail Hour & Hors d’Oeuvres', description: 'Signature cocktails poured, live acoustic music.', dueDate: details.date, time: '17:15', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-12', title: 'Grand Entrance & Dinner Service', description: 'Couple announced, dinner served, heartful toasts.', dueDate: details.date, time: '18:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-13', title: 'First Dance & Dancefloor Open', description: 'Couple dance, parent dances, dance party commences!', dueDate: details.date, time: '20:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-14', title: 'Sparkler Grand Send-off', description: 'Guests line pathway with sparklers for departure getaway.', dueDate: details.date, time: '22:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' }
    ];

    vendorItems = [
      {
        id: 'v-1',
        category: 'venue',
        name: 'Historic Manor / Estate Grounds',
        status: 'contract-signed',
        quotedPrice: Math.round(allocatableBudget * 0.38),
        depositPaid: Math.round(allocatableBudget * 0.15),
        notes: 'Deposit paid. Curfew is 11:30 PM. Vendor load-in begins at 10 AM.',
        checklistItems: [
          { id: 'c-1', text: 'Confirm venue liability insurance requirements', done: true },
          { id: 'c-2', text: 'Verify bridal dressing suite access hours', done: true },
          { id: 'c-3', text: 'Confirm bad-weather indoor backup room', done: false }
        ]
      },
      {
        id: 'v-2',
        category: 'catering',
        name: 'Artisan Culinary Group',
        status: 'quoted',
        quotedPrice: Math.round(allocatableBudget * 0.28),
        depositPaid: 0,
        notes: 'Tasting scheduled next Tuesday. Customizing seasonal produce menu.',
        checklistItems: [
          { id: 'c-4', text: 'Check if bar service includes glassware and ice', done: true },
          { id: 'c-5', text: 'Confirm dietary allergy protocol', done: false },
          { id: 'c-6', text: 'Verify vendor meal pricing', done: false }
        ]
      },
      {
        id: 'v-3',
        category: 'photography',
        name: 'Lumina Wedding Photographers',
        status: 'contacted',
        quotedPrice: Math.round(allocatableBudget * 0.12),
        depositPaid: 0,
        notes: 'Requested shot list including grandparents dance and golden hour.',
        checklistItems: [
          { id: 'c-7', text: 'Confirm copyright usage & full resolution rights', done: false },
          { id: 'c-8', text: 'Ask about timeline turnaround (typically 4-6 weeks)', done: false }
        ]
      },
      {
        id: 'v-4',
        category: 'music-entertainment',
        name: 'Electric Groove DJ & Live Ensemble',
        status: 'researching',
        quotedPrice: Math.round(allocatableBudget * 0.06),
        notes: 'Must provide ceremony wireless lavalier microphones.',
        checklistItems: [
          { id: 'c-9', text: 'Submit "Do Not Play" playlist to DJ', done: false },
          { id: 'c-10', text: 'Confirm backup sound generator or power surge protector', done: false }
        ]
      }
    ];

    ideas = [
      {
        id: 'i-1',
        title: 'Audio Guestbook Phone Booth',
        category: 'activity',
        description: 'Set up a vintage rotary telephone where guests pick up the receiver, hear a recorded greeting from the couple, and leave heartfelt, funny voicemail messages that are compiled into a vinyl record keepsake.',
        tags: ['Interactive', 'Keepsake', 'Emotional'],
        estimatedCostImpact: 'low',
        actionableSteps: ['Rent vintage audio phone kit', 'Print acrylic instructions sign', 'Place in quiet corner lounge']
      },
      {
        id: 'i-2',
        title: 'Curated Moodboard Color Story',
        category: 'theme',
        description: `Sophisticated palette reflecting "${vibe}": Warm Terracotta (#C86D51), Champagne Glow (#F5E6CC), Dusty Eucalyptus (#7B8C7E), and Midnight Slate (#2B303A).`,
        tags: ['Color Palette', 'Aesthetic', 'Florals'],
        estimatedCostImpact: 'free',
        moodColors: ['#C86D51', '#F5E6CC', '#7B8C7E', '#2B303A'],
        actionableSteps: ['Share hex codes with florist', 'Match ribbon accents on invitations']
      },
      {
        id: 'i-3',
        title: 'Late Night Artisanal Snack Cart',
        category: 'food-drink',
        description: 'Surprise guests at 10 PM with warm gourmet pretzel sliders and mini milkshakes or woodfired pizza slices directly on the dance floor.',
        tags: ['Catering Surprise', 'Crowd Pleaser', 'Night Owl'],
        estimatedCostImpact: 'moderate',
        actionableSteps: ['Arrange 10 PM delivery window with caterer', 'Distribute branded paper wax sleeves']
      },
      {
        id: 'i-4',
        title: 'First Look Private Vows',
        category: 'speech-vows',
        description: 'Read emotional, handwritten personal vows quietly to one another during the pre-ceremony first look, then exchange traditional concise vows at the altar.',
        tags: ['Intimate', 'Stress Reliever', 'Authentic'],
        estimatedCostImpact: 'free',
        actionableSteps: ['Purchase matching leather vow journals', 'Inform photographer to capture from distance']
      }
    ];
  } else if (type === 'birthday') {
    themeVibeSummary = `An electric, unforgettable birthday extravaganza for "${title}" tuned to a "${vibe}" atmosphere. Engineered for maximum fun, music, and interactive moments for ${guestCount} friends and family.`;

    budgetItems = [
      { id: 'b-1', category: 'Venue & Loft', name: 'Rooftop Lounge or Private Space Rental', estimatedCost: Math.round(allocatableBudget * 0.35), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Private bar area with ambient lighting', isPaidInFull: false },
      { id: 'b-2', category: 'Food & Bites', name: `Craft Tapas / Gourmet Grazing Table (${guestCount} guests)`, estimatedCost: Math.round(allocatableBudget * 0.25), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Charcuterie, warm skewers, sliders, and dessert bites', isPaidInFull: false },
      { id: 'b-3', category: 'Signature Bar', name: 'Mixologist Bar & Bespoke Mocktails', estimatedCost: Math.round(allocatableBudget * 0.15), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Two signature themed cocktails plus beer/wine', isPaidInFull: false },
      { id: 'b-4', category: 'DJ & Sound', name: 'Live DJ & Party Sound System', estimatedCost: Math.round(allocatableBudget * 0.10), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Custom dance playlist tailored to celebrant’s favorite decade', isPaidInFull: false },
      { id: 'b-5', category: 'Decor & Lighting', name: 'Custom Neon Sign & Balloon Installation', estimatedCost: Math.round(allocatableBudget * 0.05), actualCost: 0, paidAmount: 0, priority: 'nice-to-have', notes: 'Matches party aesthetic', isPaidInFull: false },
      { id: 'b-6', category: 'Showstopper Cake', name: 'Custom Architectural Birthday Cake', estimatedCost: Math.round(allocatableBudget * 0.04), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Sparkler candles included', isPaidInFull: false },
      { id: 'b-7', category: 'Photo Experience', name: '360 Video Booth or Instant Polaroid Station', estimatedCost: Math.round(allocatableBudget * 0.06), actualCost: 0, paidAmount: 0, priority: 'optional', notes: 'Custom digital overlays and printed magnetic frames', isPaidInFull: false }
    ];

    timelineItems = [
      { id: 't-1', title: 'Confirm Date & Secure Space', description: 'Lock in venue contract and pay initial deposit.', dueDate: formatOffsetDate(45), phase: 'months-before', isCompleted: true, category: 'Venue' },
      { id: 't-2', title: 'Send Digital Animated Invitations', description: `Circulate Partiful or Paperless Post invites to ${guestCount} friends.`, dueDate: formatOffsetDate(30), phase: 'weeks-before', isCompleted: false, category: 'Invites' },
      { id: 't-3', title: 'Order Custom Cake & Decor Pieces', description: 'Finalize cake flavor, design sketch, and order customized neon acrylic sign.', dueDate: formatOffsetDate(18), phase: 'weeks-before', isCompleted: false, category: 'Decor' },
      { id: 't-4', title: 'Curate Playlist & Special Requests', description: 'Submit 20 must-play tracks and celebration anthem to DJ.', dueDate: formatOffsetDate(7), phase: 'days-before', isCompleted: false, category: 'Music' },
      { id: 't-5', title: 'Venue Load-In & Balloon Setup', description: 'Install balloon garland backdrop, setup welcome signage and bar stations.', dueDate: details.date, time: '17:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-6', title: 'Doors Open & Welcome Drinks Flow', description: 'Guests arrive, greeted with signature welcome drinks and upbeat lounge music.', dueDate: details.date, time: '19:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-7', title: 'Interactive Roast & Toast / Game', description: 'Host dynamic 15-minute trivia or roast about the guest of honor.', dueDate: details.date, time: '20:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-8', title: 'Grand Cake Presentation & Sparklers', description: 'Dim the main lights, light sparklers, sing anthem, blow candles.', dueDate: details.date, time: '21:15', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-9', title: 'Peak Dance Floor Anthems', description: 'DJ elevates the energy; confetti drop moment.', dueDate: details.date, time: '21:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' }
    ];

    vendorItems = [
      {
        id: 'v-1',
        category: 'venue',
        name: 'The Skylight Loft',
        status: 'contract-signed',
        quotedPrice: Math.round(allocatableBudget * 0.35),
        depositPaid: Math.round(allocatableBudget * 0.20),
        notes: 'Includes integrated sound system and ambient uplighting.',
        checklistItems: [
          { id: 'c-1', text: 'Confirm outside food/dessert policy', done: true },
          { id: 'c-2', text: 'Check elevator loading dock access for DJ', done: true }
        ]
      },
      {
        id: 'v-2',
        category: 'cake-bakery',
        name: 'Velvet & Crumb Patisserie',
        status: 'quoted',
        quotedPrice: Math.round(allocatableBudget * 0.04),
        notes: 'Flavor: Salted Caramel Crunch & Espresso Ganache.',
        checklistItems: [
          { id: 'c-3', text: 'Confirm delivery time window on party afternoon', done: false }
        ]
      },
      {
        id: 'v-3',
        category: 'music-entertainment',
        name: 'DJ Pulse & Soundwave FX',
        status: 'contacted',
        quotedPrice: Math.round(allocatableBudget * 0.10),
        notes: 'Includes wireless mic for speeches.',
        checklistItems: [
          { id: 'c-4', text: 'Send Spotify playlist link with celebrant favorites', done: false }
        ]
      }
    ];

    ideas = [
      {
        id: 'i-1',
        title: 'Custom "Through the Decades" Photo Wall',
        category: 'decor',
        description: 'A chronological timeline wall featuring candid, funny photos from each year of the celebrant’s life, leading to the neon photo-op.',
        tags: ['Nostalgic', 'Visual', 'Conversation Starter'],
        estimatedCostImpact: 'low',
        actionableSteps: ['Collect 20 childhood and college photos', 'Print 5x7 prints with clip fairy lights']
      },
      {
        id: 'i-2',
        title: 'Celebrant Trivia Live Kahoot Game',
        category: 'activity',
        description: 'A rapid 10-question smartphone quiz about the guest of honor with hilarious options, awarding a fun trophy to the winner.',
        tags: ['Icebreaker', 'Gamification', 'High Energy'],
        estimatedCostImpact: 'free',
        actionableSteps: ['Create 10-question Kahoot board', 'Display QR code on venue monitor']
      },
      {
        id: 'i-3',
        title: 'Vibrant Neon Party Palette',
        category: 'theme',
        description: `High-voltage palette honoring "${vibe}": Electric Violet (#8A2BE2), Cyber Pink (#FF1493), Bright Amber (#FFBF00), and Deep Onyx (#121212).`,
        tags: ['Colors', 'Modern', 'Neon'],
        moodColors: ['#8A2BE2', '#FF1493', '#FFBF00', '#121212'],
        estimatedCostImpact: 'free'
      }
    ];
  } else {
    // Community event
    themeVibeSummary = `An inspiring civic gathering: "${title}" celebrating unity, engagement, and "${vibe}". Designed to welcome ${guestCount} community members with accessible facilities, local talent, and seamless safety protocols.`;

    budgetItems = [
      { id: 'b-1', category: 'City Permits & Insurance', name: 'Municipal Park Permit, Sound Variance & Liability Policy', estimatedCost: Math.round(allocatableBudget * 0.20), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Required for public gatherings over 50 attendees', isPaidInFull: false },
      { id: 'b-2', category: 'Staging & AV Equipment', name: 'Covered Stage, Generator & Public Address Sound System', estimatedCost: Math.round(allocatableBudget * 0.25), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Includes 4 wireless mics and sound engineer for the day', isPaidInFull: false },
      { id: 'b-3', category: 'Sanitation & Safety', name: 'Portable ADA Restrooms, Handwash Stations & First Aid Kit', estimatedCost: Math.round(allocatableBudget * 0.18), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Meets city public health guidelines', isPaidInFull: false },
      { id: 'b-4', category: 'Signage & Marketing', name: 'Banners, Wayfinding Signs, and Eco-friendly Flyers', estimatedCost: Math.round(allocatableBudget * 0.10), actualCost: 0, paidAmount: 0, priority: 'nice-to-have', notes: 'Includes digital social promotion budget', isPaidInFull: false },
      { id: 'b-5', category: 'Volunteer Hospitality', name: 'Volunteer T-Shirts, Water Stations & Lunch Vouchers', estimatedCost: Math.round(allocatableBudget * 0.12), actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Supports 20 dedicated volunteers across 2 shifts', isPaidInFull: false },
      { id: 'b-6', category: 'Local Talent & Performers', name: 'Honorarium for Community Performers & Cultural Artists', estimatedCost: Math.round(allocatableBudget * 0.08), actualCost: 0, paidAmount: 0, priority: 'nice-to-have', notes: 'Equitable compensation for performers', isPaidInFull: false },
      { id: 'b-7', category: 'Contingency & Waste Mgmt', name: 'Emergency Contingency & Green Waste Sorting', estimatedCost: contingencyAmount, actualCost: 0, paidAmount: 0, priority: 'must-have', notes: 'Zero-waste sorting station and weather contingency', isPaidInFull: false }
    ];

    timelineItems = [
      { id: 't-1', title: 'Submit Municipal Park & Street Permits', description: 'File paperwork with City Parks & Rec, police and fire department.', dueDate: formatOffsetDate(75), phase: 'months-before', isCompleted: true, category: 'Permits' },
      { id: 't-2', title: 'Procure General Liability Insurance Rider', description: 'Obtain $1M-$2M event insurance certificate naming city as additional insured.', dueDate: formatOffsetDate(45), phase: 'weeks-before', isCompleted: false, category: 'Compliance' },
      { id: 't-3', title: 'Volunteer Recruitment & Orientation', description: 'Onboard 25 volunteers for check-in, water stations, and breakdown.', dueDate: formatOffsetDate(21), phase: 'weeks-before', isCompleted: false, category: 'Volunteers' },
      { id: 't-4', title: 'Final Site Inspection & Map Layout', description: 'Mark vendor booth locations, power drop points, and emergency exits.', dueDate: formatOffsetDate(7), phase: 'days-before', isCompleted: false, category: 'Logistics' },
      { id: 't-5', title: 'Early Morning Site Load-In & Staging', description: 'Stage delivery, portable restrooms placement, generator testing.', dueDate: details.date, time: '07:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-6', title: 'Volunteer Morning Briefing & Radio Check', description: 'Assign radios, safety vests, review emergency and medical protocols.', dueDate: details.date, time: '08:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-7', title: 'Gates Open & Community Welcome Opening', description: 'Opening remarks from community organizers and ribbon cutting ceremony.', dueDate: details.date, time: '10:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-8', title: 'Mainstage Cultural Performances & Showcase', description: 'Rotating local acts, youth choir, and dance troupes.', dueDate: details.date, time: '12:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-9', title: 'Civic Awards & Recognition Presentation', description: 'Honoring outstanding neighborhood volunteers and local advocates.', dueDate: details.date, time: '15:00', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' },
      { id: 't-10', title: 'Event Conclusion & Zero-Waste Cleanup', description: 'Volunteers execute litter sweep, compost collection, equipment breakdown.', dueDate: details.date, time: '17:30', phase: 'day-of-run-of-show', isCompleted: false, category: 'Day-Of' }
    ];

    vendorItems = [
      {
        id: 'v-1',
        category: 'permits-security',
        name: 'City Department of Parks & Public Works',
        status: 'contract-signed',
        quotedPrice: Math.round(allocatableBudget * 0.20),
        depositPaid: Math.round(allocatableBudget * 0.20),
        notes: 'Permit #CP-8842 approved. Sound permit valid until 7 PM.',
        checklistItems: [
          { id: 'c-1', text: 'Submit site map with emergency ingress/egress', done: true },
          { id: 'c-2', text: 'Provide proof of liability insurance rider', done: true }
        ]
      },
      {
        id: 'v-2',
        category: 'other',
        name: 'Metro Audio & Stage Productions',
        status: 'quoted',
        quotedPrice: Math.round(allocatableBudget * 0.25),
        notes: 'Requires 2 dedicated 20A power circuits or mobile whisper generator.',
        checklistItems: [
          { id: 'c-3', text: 'Confirm rain canopy for audio mixing console', done: false }
        ]
      },
      {
        id: 'v-3',
        category: 'other',
        name: 'CleanEarth Sanitation Services',
        status: 'contacted',
        quotedPrice: Math.round(allocatableBudget * 0.18),
        notes: 'Delivering 4 ADA portable restrooms and 2 hand-sanitizer stations.',
        checklistItems: [
          { id: 'c-4', text: 'Confirm morning drop-off by 7:00 AM', done: false }
        ]
      }
    ];

    ideas = [
      {
        id: 'i-1',
        title: 'Community Collaborative Vision Mural',
        category: 'community-impact',
        description: 'Erect a giant chalkboard or canvas wall with the prompt "My dream for our neighborhood is..." where all ages can paint and write with eco-friendly markers.',
        tags: ['Civic Pride', 'Inclusive', 'All Ages'],
        estimatedCostImpact: 'low',
        actionableSteps: ['Build two 8x4 plywood easel stands', 'Provide non-toxic paint pens and wipes']
      },
      {
        id: 'i-2',
        title: 'Civic Earth Color Scheme',
        category: 'theme',
        description: `Vibrant, inviting colors for "${vibe}": Pine Green (#1B4D3E), Sky Cyan (#00A8E8), Sunflower Gold (#F4B41A), and Warm White (#F8F9FA).`,
        tags: ['Civic', 'Welcoming', 'Nature'],
        moodColors: ['#1B4D3E', '#00A8E8', '#F4B41A', '#F8F9FA'],
        estimatedCostImpact: 'free'
      },
      {
        id: 'i-3',
        title: 'Zero-Waste Sorting Stations & Green Volunteers',
        category: 'budget-hack',
        description: 'Partner with local high school environmental club to staff 3-bin sorting stations (compost, recycling, landfill). Diverts 85% of waste and reduces municipal tipping fees.',
        tags: ['Eco-Friendly', 'Cost-Saving', 'Sustainability'],
        estimatedCostImpact: 'free',
        actionableSteps: ['Borrow clear sorting bins from city recycling division', 'Award community service hours to students']
      }
    ];
  }

  if (themeVibeSummary) {
    ideas.unshift({
      id: 'i-vibe-summary',
      title: 'Creative Vibe Vision',
      category: 'theme',
      description: themeVibeSummary,
      tags: ['Vision', type],
      estimatedCostImpact: 'free'
    });
  }

  return {
    details,
    budget: {
      totalBudget,
      currency,
      items: budgetItems,
      contingencyPercent: 8
    },
    timeline: timelineItems,
    vendors: vendorItems,
    ideas
  };
}

function transformValidatedDataToPlan(details: EventDetails, data: any): EventPlan {
  return {
    details,
    budget: {
      totalBudget: details.totalBudget,
      currency: details.currency,
      items: (data.budgetBreakdown || []).map((b: any, idx: number) => ({
        id: b.id || `b-${idx + 1}`,
        category: b.category || 'General',
        name: b.name || 'Expense',
        estimatedCost: Number(b.estimatedCost) || 0,
        actualCost: Number(b.actualCost) || 0,
        paidAmount: Number(b.paidAmount) || 0,
        priority: b.priority || 'must-have',
        notes: b.notes || '',
        isPaidInFull: Boolean(b.isPaidInFull)
      })),
      contingencyPercent: 8
    },
    timeline: (data.timelineMilestones || []).map((t: any, idx: number) => ({
      id: t.id || `t-${idx + 1}`,
      title: t.title || 'Milestone',
      description: t.description || '',
      dueDate: t.dueDate || details.date,
      time: t.time || undefined,
      phase: t.phase || 'weeks-before',
      isCompleted: Boolean(t.isCompleted),
      category: t.category || 'Planning'
    })),
    vendors: (data.vendorChecklist || []).map((v: any, idx: number) => ({
      id: v.id || `v-${idx + 1}`,
      category: v.category || 'other',
      name: v.name || 'Vendor Partner',
      status: v.status || 'researching',
      quotedPrice: Number(v.quotedPrice) || 0,
      depositPaid: Number(v.depositPaid) || 0,
      notes: v.notes || '',
      checklistItems: (v.checklistItems || []).map((c: any, cidx: number) => ({
        id: c.id || `c-${idx}-${cidx}`,
        text: c.text || 'Checklist item',
        done: Boolean(c.done)
      }))
    })),
    ideas: (data.personalizedIdeas || []).map((i: any, idx: number) => ({
      id: i.id || `i-${idx + 1}`,
      title: i.title || 'Idea',
      category: i.category || 'theme',
      description: i.description || '',
      tags: i.tags || [],
      estimatedCostImpact: i.estimatedCostImpact || 'low',
      actionableSteps: i.actionableSteps || [],
      moodColors: i.moodColors || []
    }))
  };
}

/**
 * AI Chat Assistant streaming/response service
 */
export async function askAIChatAssistant(
  event: EventDetails,
  userMessage: string,
  history: { role: string; content: string }[]
): Promise<{ reply: string; securityFlag: 'safe' | 'sanitized' | 'blocked' }> {
  // 1. Guardrail input validation
  const guardrail = sanitizeUserInput(userMessage);

  if (guardrail.riskLevel === 'critical') {
    return {
      reply: "⚠️ I detected a potential prompt override attempt. As your Event Planning Assistant, I can only provide guidance on budgets, timelines, vendors, and event creative ideas. How can I help with your event logistics?",
      securityFlag: 'blocked'
    };
  }

  const apiKey = getStoredApiKey();

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const prompt = buildAIChatAssistantPrompt(event, guardrail.sanitizedText, history);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        })
      });

      if (res.ok) {
        const json = await res.json();
        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return {
            reply: text,
            securityFlag: guardrail.isSafe ? 'safe' : 'sanitized'
          };
        }
      }
    } catch (e) {
      console.warn('Gemini chat error, using heuristic advisor:', e);
    }
  }

  // Fallback intelligent event advisor
  const heuristicReply = generateHeuristicChatReply(event, guardrail.sanitizedText);
  return {
    reply: heuristicReply,
    securityFlag: guardrail.isSafe ? 'safe' : 'sanitized'
  };
}

function generateHeuristicChatReply(event: EventDetails, query: string): string {
  const q = query.toLowerCase();

  if (q.includes('budget') || q.includes('cost') || q.includes('save') || q.includes('money')) {
    return `### 💡 Budget Optimization Strategy for ${event.title}
1. **Rule of Thumb Allocation:** With a total budget of **${event.totalBudget.toLocaleString()} ${event.currency}** for ${event.guestCount} guests, your per-guest baseline is roughly **${Math.round(event.totalBudget / Math.max(1, event.guestCount))} ${event.currency}**.
2. **Top Cost-Saving Levers:**
   - **Alcohol & Bar:** Switch from an open top-shelf bar to signature cocktails + beer/wine to save 20-30%.
   - **Florals/Decor:** Repurpose ceremony florals (e.g., bridesmaid bouquets become head table centerpieces).
   - **Printables:** Digital RSVPs save printing & postage while eliminating manual tracking errors.
3. **Safety Buffer:** Always preserve the 8% contingency buffer for overtime or delivery fees.`;
  }

  if (q.includes('vendor') || q.includes('contract') || q.includes('catering') || q.includes('dj') || q.includes('photo')) {
    return `### 📋 Vendor Contracting Master Checklist
When finalizing quotes for your ${event.type}:
- **Overtime Rates:** Clarify the exact hourly charge if speeches run 30 minutes over.
- **Cancellation & Weather Clauses:** Verify force majeure and rain relocation timelines.
- **Power & Tech Riders:** Ensure the venue can supply enough dedicated circuits for the DJ/Band and food warmers without tripping breakers.
- **Deposit Schedule:** Standard practice is 25-50% on signing, remaining balance 7-14 days prior to event.`;
  }

  if (q.includes('timeline') || q.includes('schedule') || q.includes('run of show') || q.includes('time')) {
    return `### ⏱️ Run-of-Show Timing Advice
For your ${event.vibe} celebration:
- **Pacing Rule:** Never let speeches or formalities exceed 20-25 minutes consecutively; guest energy dips quickly after 8 minutes of speaking.
- **Buffer Magic:** Build an invisible 15-minute buffer into your pre-ceremony/reception schedule.
- **Catering Stride:** Allow at least 90 minutes for a multi-course dinner service before starting the dance music.`;
  }

  return `### ✨ Expert Recommendation for "${event.title}"
For an event of this scale (${event.guestCount} guests with a "${event.vibe}" aesthetic):
- **Guest Experience Touchpoint:** The first 10 minutes define the tone. Have greeting music playing and welcome refreshments available immediately as people arrive.
- **Logistics Check:** Verify that parking or drop-off signage is crystal clear.
- **Checklist Sync:** You can view your current budget breakdown and vendor statuses directly in the tabs above! What specific element would you like me to tailor next?`;
}
