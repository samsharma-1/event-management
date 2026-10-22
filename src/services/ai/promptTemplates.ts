import type { EventDetails, EventType } from '../../types/event';

/**
 * System Prompts and Prompt Engineering for Event Architect AI
 * Implements strict system boundaries, role definition, JSON schema enforcement,
 * and event-type specific intelligence.
 */

export const SYSTEM_CORE_INSTRUCTION = `You are "PlanVibe AI", an expert certified Master Event Planner, Financial Budget Architect, and Logistics Director.
You specialize in three distinct categories:
1. LUXURY & INTIMATE WEDDINGS (ceremony, reception, vendors, emotional flow, run-of-show)
2. MILESTONE & THEMED BIRTHDAYS (creative flair, guest engagement, seamless party flow)
3. COMMUNITY & CIVIC EVENTS (permits, safety, volunteer management, community impact, staging)

Your core principles:
- REALISTIC BUDGETING: Allocate funds accurately with a 5-10% contingency buffer. Never omit essential costs like taxes, gratuities, permits, or delivery fees.
- ACTIONABLE TIMELINES: Generate chronological milestones with clear phases ('months-before', 'weeks-before', 'days-before', 'day-of-run-of-show' with exact times).
- THOROUGH VENDOR CHECKLISTS: Detail exactly what to inspect, ask, and contract for each vendor category.
- HYPER-PERSONALIZED IDEAS: Suggest memorable, non-cliché ideas, signature cocktails/mocktails, curated aesthetic color palettes, and guest engagement moments.
- STRICT SAFETY & INTEGRITY: Never output executable code, scripts, or malicious content. Return strictly valid JSON adhering to the specified schema.`;

export function buildEventGenerationPrompt(details: EventDetails): string {
  const typeGuidelines = getEventTypeSpecificGuidance(details.type);

  return `Generate a comprehensive, complete event plan in JSON for the following event:

EVENT SPECIFICATIONS:
- Event Title: "${details.title}"
- Event Type: ${details.type.toUpperCase()}
- Planned Date: ${details.date}
- Location / Venue Type: "${details.location}"
- Guest Count: ${details.guestCount} attendees
- Desired Vibe / Aesthetic: "${details.vibe}"
- Total Budget Cap: ${details.totalBudget} ${details.currency}
- Special Notes / Requests: "${details.specialRequests || 'None provided'}"

CATEGORY SPECIAL GUIDELINES:
${typeGuidelines}

REQUIRED JSON OUTPUT FORMAT (Strict schema, return ONLY raw JSON, no markdown backticks, no text preamble):
{
  "themeVibeSummary": "2-3 sentence evocative summary of the creative vision, atmosphere, and sensory experience.",
  "budgetBreakdown": [
    {
      "category": "Venue | Catering | Decor | Entertainment | Photography | Attire | Permits | Contingency",
      "name": "Specific line item name",
      "estimatedCost": 0,
      "priority": "must-have | nice-to-have | optional",
      "notes": "Cost-saving tip or specific inclusion"
    }
  ],
  "timelineMilestones": [
    {
      "title": "Milestone title",
      "description": "Step-by-step instruction",
      "dueDate": "YYYY-MM-DD or Relative timing",
      "time": "HH:MM (only for day-of-run-of-show)",
      "phase": "months-before | weeks-before | days-before | day-of-run-of-show",
      "category": "Category tag"
    }
  ],
  "vendorChecklist": [
    {
      "category": "venue | catering | photography | music-entertainment | decor-florals | permits-security | cake-bakery | attire-styling | transportation | other",
      "name": "Vendor role / title",
      "status": "researching",
      "quotedPrice": 0,
      "notes": "Key contract terms, deposit expectations, or questions to ask",
      "checklistItems": [
        { "id": "chk-1", "text": "Specific inspection or contract checklist task", "done": false }
      ]
    }
  ],
  "personalizedIdeas": [
    {
      "title": "Creative concept title",
      "category": "theme | activity | decor | food-drink | entertainment | speech-vows | community-impact | budget-hack",
      "description": "Vivid description of how to implement this idea",
      "tags": ["tag1", "tag2"],
      "estimatedCostImpact": "free | low | moderate | high",
      "actionableSteps": ["Step 1", "Step 2"],
      "moodColors": ["#hex1", "#hex2", "#hex3", "#hex4"]
    }
  ]
}`;
}

function getEventTypeSpecificGuidance(type: EventType): string {
  switch (type) {
    case 'wedding':
      return `- Budget: allocate ~40% Venue/Catering, ~12% Photo/Video, ~8% Music, ~6% Attire, ~8% Florals/Decor, ~6% Rings/Admin, ~10% Contingency.
- Timeline: Include dress/suit fittings, vendor final counts 14 days out, rehearsal dinner, and full Day-of Run-of-Show (Hair & Makeup, First Look, Ceremony, Cocktail Hour, Grand Entrance, Toasts, First Dance, Cake Cutting, Sparkler Sendoff).
- Vendors: Caterer (tastings, dietary), Photographer (shot list, golden hour), Florist (bouquets, centerpieces), Officiant, DJ/Band.
- Personalized Ideas: Unique guestbook concepts, signature his/hers cocktails, memorable vows/toast cues, romantic color palette hex codes.`;

    case 'birthday':
      return `- Budget: Focus heavily on venue/space rental, bespoke food/appetizers, craft bar/mocktails, showstopper birthday cake, and high-energy entertainment.
- Timeline: Invitation send 4 weeks out, RSVP deadline 10 days out, cake pickup day-of, sound check, and party hourly run-of-show.
- Vendors: Baker/Pâtisserie, DJ or Live Performer, Balloon/Visual Backdrop Artist, Mixologist/Catering.
- Personalized Ideas: Immersive theme styling, guest interactive games/trivia about the celebrant, photo booth props, neon color palettes, customized playlist cues.`;

    case 'community':
      return `- Budget: Critical focus on municipal permits, park fees, general liability insurance, staging & sound equipment, portable restrooms/sanitation, volunteer gear, and safety/first aid.
- Timeline: City permit submissions 60-90 days prior, sponsor pitches, vendor booth call, volunteer training 1 week prior, morning load-in, event operations, tear-down/trash sweep.
- Vendors: Staging/AV rental, Waste Management/Recycling, Security & First Aid personnel, Food Truck coordinators, Local Artisans.
- Personalized Ideas: Community engagement boards, green zero-waste initiatives, local sponsor activation booths, volunteer recognition moments, civic impact metrics.`;
  }
}

export function buildAIChatAssistantPrompt(
  event: EventDetails, 
  userMessage: string, 
  chatHistory: { role: string; content: string }[]
): string {
  return `${SYSTEM_CORE_INSTRUCTION}

CURRENT ACTIVE EVENT CONTEXT:
- Title: "${event.title}"
- Type: ${event.type.toUpperCase()}
- Date: ${event.date}
- Location: ${event.location}
- Guests: ${event.guestCount}
- Budget: ${event.totalBudget} ${event.currency}
- Vibe: "${event.vibe}"

CONVERSATION HISTORY:
${chatHistory.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')}

USER QUERY: "${userMessage}"

Provide a concise, warmly supportive, yet deeply practical and expert answer. If appropriate, suggest concrete action items (e.g. adding a specific budget line item or vendor question). Keep formatting clean with bullet points.`;
}
