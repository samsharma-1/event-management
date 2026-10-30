import type { EventDetails, EventPlan, PersonalizedIdea, TimelineMilestone, BudgetItem, VendorItem } from '../../types/event';
import { sanitizeUserInput, validateAIOutput, type GeneratedPlanOutput } from '../security/guardrails';
import { buildEventGenerationPrompt, buildAIChatAssistantPrompt, SYSTEM_CORE_INSTRUCTION } from './promptTemplates';
import { generateTailoredHeuristicPlan, generateHeuristicChatReply } from './heuristicEngine';

// Re-export heuristic functions for backwards compatibility and direct usage
export { generateTailoredHeuristicPlan, generateHeuristicChatReply } from './heuristicEngine';

const GEMINI_STORAGE_KEY = 'planvibe_gemini_api_key';
let inMemoryApiKey = '';

/**
 * Modern default Gemini model (configurable via VITE_GEMINI_MODEL env var)
 */
export const DEFAULT_GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';

export function getStoredApiKey(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem(GEMINI_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || inMemoryApiKey;
  }
  if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    return (globalThis as unknown as { localStorage: Storage }).localStorage.getItem(GEMINI_STORAGE_KEY) || inMemoryApiKey;
  }
  return inMemoryApiKey;
}

export function setStoredApiKey(key: string): void {
  inMemoryApiKey = key.trim();
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  } else if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    (globalThis as unknown as { localStorage: Storage }).localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  }
}

export function clearStoredApiKey(): void {
  inMemoryApiKey = '';
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(GEMINI_STORAGE_KEY);
  } else if (typeof globalThis !== 'undefined' && (globalThis as unknown as { localStorage?: Storage }).localStorage) {
    (globalThis as unknown as { localStorage: Storage }).localStorage.removeItem(GEMINI_STORAGE_KEY);
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
      onProgress?.(`Connecting to Google Gemini API (${DEFAULT_GEMINI_MODEL})...`);
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
 * Calls Google Gemini REST endpoint with strict JSON schema mode.
 * Transmits API key securely in the 'x-goog-api-key' header instead of leaking into query parameters.
 */
async function callLiveGeminiAPI(details: EventDetails, apiKey: string): Promise<unknown> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`;
  const prompt = buildEventGenerationPrompt(details);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
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
 * Transforms Zod-validated model output into domain EventPlan
 */
function transformValidatedDataToPlan(details: EventDetails, data: GeneratedPlanOutput): EventPlan {
  const budgetItems: BudgetItem[] = (data.budgetBreakdown || []).map((b, idx) => ({
    id: b.id || `b-${idx + 1}`,
    category: b.category || 'General',
    name: b.name || 'Expense',
    estimatedCost: Number(b.estimatedCost) || 0,
    actualCost: Number(b.actualCost) || 0,
    paidAmount: Number(b.paidAmount) || 0,
    priority: b.priority || 'must-have',
    notes: b.notes || '',
    isPaidInFull: Boolean(b.isPaidInFull)
  }));

  const timelineItems: TimelineMilestone[] = (data.timelineMilestones || []).map((t, idx) => ({
    id: t.id || `t-${idx + 1}`,
    title: t.title || 'Milestone',
    description: t.description || '',
    dueDate: t.dueDate || details.date,
    time: t.time || undefined,
    phase: t.phase || 'weeks-before',
    isCompleted: Boolean(t.isCompleted),
    category: t.category || 'Planning'
  }));

  const vendorItems: VendorItem[] = (data.vendorChecklist || []).map((v, idx) => ({
    id: v.id || `v-${idx + 1}`,
    category: v.category || 'other',
    name: v.name || 'Vendor Partner',
    status: v.status || 'researching',
    quotedPrice: Number(v.quotedPrice) || 0,
    depositPaid: Number(v.depositPaid) || 0,
    notes: v.notes || '',
    checklistItems: (v.checklistItems || []).map((c, cidx) => ({
      id: c.id || `c-${idx}-${cidx}`,
      text: c.text || 'Checklist item',
      done: Boolean(c.done)
    }))
  }));

  const ideas: PersonalizedIdea[] = (data.personalizedIdeas || []).map((i, idx) => ({
    id: i.id || `i-${idx + 1}`,
    title: i.title || 'Idea',
    category: i.category || 'theme',
    description: i.description || '',
    tags: i.tags || [],
    estimatedCostImpact: i.estimatedCostImpact || 'low',
    actionableSteps: i.actionableSteps || [],
    moodColors: i.moodColors || []
  }));

  return {
    details,
    budget: {
      totalBudget: details.totalBudget,
      currency: details.currency,
      items: budgetItems,
      contingencyPercent: 8
    },
    timeline: timelineItems,
    vendors: vendorItems,
    ideas
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

  if (guardrail.violations.some(v => v.includes('Prompt Injection')) || guardrail.riskLevel === 'critical' || guardrail.riskLevel === 'high') {
    return {
      reply: "⚠️ I detected a potential prompt override attempt. As your Event Planning Assistant, I can only provide guidance on budgets, timelines, vendors, and event creative ideas. How can I help with your event logistics?",
      securityFlag: 'blocked'
    };
  }

  const apiKey = getStoredApiKey();

  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`;
      const prompt = buildAIChatAssistantPrompt(event, guardrail.sanitizedText, history);

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
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
