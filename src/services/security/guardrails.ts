import { z } from 'zod';
import type { SecurityAuditEntry } from '../../types/event';

/**
 * Security & Guardrails Engine for GenAI Event Planning Assistant
 * Protects against prompt injections, jailbreaks, PII leakage, and malformed outputs.
 * 
 * Note: Prompt-injection defenses here represent a defense-in-depth heuristic filter
 * to catch common override signatures and homoglyph attacks, not an absolute security boundary.
 */

// Common prompt injection attack signatures
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(the\s+)?(previous|system)\s+instructions/i,
  /you\s+are\s+now\s+(an?\s+unrestricted|a\s+different|in\s+DAN\s+mode)/i,
  /\bDAN\s+Mode\b/i,
  /reveal\s+(your\s+)?(system\s+prompt|developer\s+mode|instructions)/i,
  /repeat\s+(everything|the\s+words)\s+above/i,
  /system:\s*role/i,
  /\[SYSTEM_INSTRUCTION\]/i,
  /<\/?system>/i,
  /```(?:system|admin|root)/i,
  /bypass\s+(safety|content|filter)\s+checks/i,
  /act\s+as\s+(an?\s+evil|an?\s+unfiltered|a\s+malicious)/i
];

// Homoglyphs and lookalike characters mapping for Cyrillic and Greek to ASCII
const HOMOGLYPH_MAP: Record<string, string> = {
  // Cyrillic small & capital letters that resemble Latin
  'а': 'a', 'А': 'A',
  'в': 'b', 'В': 'B',
  'с': 'c', 'С': 'C',
  'е': 'e', 'Е': 'E',
  'і': 'i', 'І': 'I',
  'ј': 'j', 'Ј': 'J',
  'к': 'k', 'К': 'K',
  'м': 'm', 'М': 'M',
  'о': 'o', 'О': 'O',
  'р': 'p', 'Р': 'P',
  'ѕ': 's', 'Ѕ': 'S',
  'т': 't', 'Т': 'T',
  'у': 'y', 'У': 'Y',
  'х': 'x', 'Х': 'X',
  // Greek lookalikes
  'α': 'a', 'Α': 'A',
  'β': 'b', 'Β': 'B',
  'ε': 'e', 'Ε': 'E',
  'ι': 'i', 'Ι': 'I',
  'κ': 'k', 'Κ': 'K',
  'ο': 'o', 'Ο': 'O',
  'ρ': 'p', 'Ρ': 'P',
  'τ': 't', '\u03A4': 'T',
  'υ': 'u', 'Υ': 'Y',
  'χ': 'x', 'Χ': 'X'
};

/**
 * Normalizes input text using Unicode NFKC, strips zero-width chars,
 * replaces confusable homoglyphs, and collapses multiple whitespace for accurate inspection.
 */
export function normalizeSecurityInput(str: string): string {
  let s = str.normalize('NFKC');
  // Strip zero-width & non-printable formatting characters
  s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
  // Map Cyrillic and Greek homoglyphs to Latin equivalents
  s = s.replace(/[\u0400-\u04FF\u0370-\u03FF]/g, (char) => HOMOGLYPH_MAP[char] || char);
  // Collapse whitespace
  s = s.replace(/\s+/g, ' ');
  return s;
}

/**
 * Validates a number string using the Luhn algorithm (Mod 10).
 * Prevents false positives where innocent large numbers (e.g. budgets or IDs) get redacted.
 */
export function isValidLuhn(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

// Other PII regex patterns to mask sensitive data
const OTHER_PII_PATTERNS = [
  // US SSN pattern
  { regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[REDACTED_GOVT_ID]' },
  // Generic API key pattern
  { regex: /(?:AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,})/g, replacement: '[REDACTED_API_KEY]' }
];

export interface SanitizationResult {
  isSafe: boolean;
  sanitizedText: string;
  violations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidenceScore: number;
}

// In-memory security audit history for live auditing
const securityAuditHistory: SecurityAuditEntry[] = [];

/**
 * Sanitizes user input before passing to GenAI models.
 * Strips injection sequences, neutralizes overrides, and redacts PII.
 */
export function sanitizeUserInput(input: string): SanitizationResult {
  if (!input || typeof input !== 'string') {
    return {
      isSafe: true,
      sanitizedText: '',
      violations: [],
      riskLevel: 'low',
      confidenceScore: 1.0
    };
  }

  const violations: string[] = [];
  let processed = input.trim();

  // 1. Normalize for inspection (Unicode NFKC, homoglyphs, whitespace)
  const normalizedForCheck = normalizeSecurityInput(processed);

  // Check for prompt injection signatures against both normalized and raw text
  let injectionDetected = false;
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(normalizedForCheck) || pattern.test(processed)) {
      violations.push(`Prompt Injection Pattern Detected: ${pattern.source}`);
      injectionDetected = true;
    }
  }

  // 2. Neutralize instruction overrides if detected
  if (injectionDetected) {
    for (const pattern of INJECTION_PATTERNS) {
      processed = processed.replace(pattern, '[INJECTION_NEUTRALIZED]');
    }
    // Also check if normalized match was missed due to homoglyphs in raw text
    if (!processed.includes('[INJECTION_NEUTRALIZED]')) {
      processed = '[INJECTION_NEUTRALIZED] ' + processed;
    }
  }

  // 3. Redact sensitive Payment Cards with card-group structure or Luhn check
  const CARD_CANDIDATE_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;
  processed = processed.replace(CARD_CANDIDATE_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length < 13 || digitsOnly.length > 19) return match;

    // Check if it's explicitly structured in standard card groups (e.g. 4-4-4-4 or 4-6-5)
    const isCardGrouped = /^\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}$/.test(match) || /^\d{4}[ -]\d{6}[ -]\d{4,5}$/.test(match);
    // Or if raw digits pass the mathematical Luhn checksum
    const passesLuhn = isValidLuhn(digitsOnly);

    if (isCardGrouped || passesLuhn) {
      violations.push('Sensitive Information (Payment Card) Detected and Masked');
      return '[REDACTED_PAYMENT_CARD]';
    }
    return match;
  });

  // 4. Redact other sensitive PII (SSN, API keys)
  for (const pii of OTHER_PII_PATTERNS) {
    if (pii.regex.test(processed)) {
      violations.push('Sensitive Information (PII/Key) Detected and Masked');
      processed = processed.replace(pii.regex, pii.replacement);
    }
  }

  // 5. Character limits
  if (processed.length > 4000) {
    violations.push('Input truncated to 4000 character maximum');
    processed = processed.substring(0, 4000);
  }

  // Strip non-printable / control ASCII & Unicode characters except standard newlines & tabs
  // Uses \p{Cc} with u flag to avoid no-control-regex warnings
  processed = processed.replace(/\p{Cc}/gu, (char) => (char === '\t' || char === '\n' || char === '\r' ? char : ''));

  const isSafe = violations.length === 0;
  const riskLevel = violations.length === 0 ? 'low' : violations.length === 1 ? 'medium' : violations.length <= 2 ? 'high' : 'critical';
  const confidenceScore = isSafe ? 1.0 : Math.max(0.1, 1.0 - (violations.length * 0.25));

  // Record audit entry
  recordAuditEntry({
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    inputExcerpt: input.substring(0, 80) + (input.length > 80 ? '...' : ''),
    actionTaken: isSafe ? 'cleared' : violations.some(v => v.includes('Injection')) ? 'sanitized' : 'flagged',
    ruleViolated: violations.join('; ') || undefined,
    confidenceScore
  });

  return {
    isSafe,
    sanitizedText: processed,
    violations,
    riskLevel,
    confidenceScore
  };
}

/**
 * Audit log recording
 */
export function recordAuditEntry(entry: SecurityAuditEntry): void {
  securityAuditHistory.unshift(entry);
  if (securityAuditHistory.length > 50) {
    securityAuditHistory.pop();
  }
}

export function getSecurityAuditLog(): SecurityAuditEntry[] {
  return [...securityAuditHistory];
}

export function clearSecurityAuditLog(): void {
  securityAuditHistory.length = 0;
}

// Zod Schema for Structured Event Plan Generation
export const BudgetItemSchema = z.object({
  id: z.string().optional().default(() => `b-${Math.random().toString(36).substring(2, 9)}`),
  category: z.string().min(1),
  name: z.string().min(1),
  estimatedCost: z.number().nonnegative(),
  actualCost: z.number().nonnegative().default(0),
  paidAmount: z.number().nonnegative().default(0),
  priority: z.enum(['must-have', 'nice-to-have', 'optional']).default('must-have'),
  notes: z.string().optional().default(''),
  isPaidInFull: z.boolean().default(false)
});

export const TimelineItemSchema = z.object({
  id: z.string().optional().default(() => `t-${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().min(1),
  description: z.string().default(''),
  dueDate: z.string(),
  time: z.string().optional(),
  phase: z.enum(['months-before', 'weeks-before', 'days-before', 'day-of-run-of-show']),
  isCompleted: z.boolean().default(false),
  category: z.string().optional()
});

export const VendorItemSchema = z.object({
  id: z.string().optional().default(() => `v-${Math.random().toString(36).substring(2, 9)}`),
  category: z.enum([
    'venue', 'catering', 'photography', 'music-entertainment', 
    'decor-florals', 'permits-security', 'cake-bakery', 'attire-styling', 
    'transportation', 'other'
  ]),
  name: z.string().min(1),
  status: z.enum(['researching', 'contacted', 'quoted', 'contract-signed', 'deposit-paid', 'confirmed', 'completed']).default('researching'),
  quotedPrice: z.number().optional().default(0),
  depositPaid: z.number().optional().default(0),
  notes: z.string().optional().default(''),
  checklistItems: z.array(z.object({
    id: z.string(),
    text: z.string(),
    done: z.boolean()
  })).default([])
});

export const IdeaItemSchema = z.object({
  id: z.string().optional().default(() => `i-${Math.random().toString(36).substring(2, 9)}`),
  title: z.string().min(1),
  category: z.enum(['theme', 'activity', 'decor', 'food-drink', 'entertainment', 'speech-vows', 'community-impact', 'budget-hack']),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  estimatedCostImpact: z.enum(['free', 'low', 'moderate', 'high']).default('low'),
  actionableSteps: z.array(z.string()).optional().default([]),
  moodColors: z.array(z.string()).optional().default([])
});

export const GeneratedPlanSchema = z.object({
  themeVibeSummary: z.string(),
  budgetBreakdown: z.array(BudgetItemSchema),
  timelineMilestones: z.array(TimelineItemSchema),
  vendorChecklist: z.array(VendorItemSchema),
  personalizedIdeas: z.array(IdeaItemSchema)
});

export type GeneratedPlanOutput = z.infer<typeof GeneratedPlanSchema>;

/**
 * Validates AI JSON output against the strict Zod schema and scans output text
 * for prompt injection echoes or system prompt leakage.
 */
export function validateAIOutput(rawJson: unknown): {
  success: boolean;
  data: GeneratedPlanOutput | null;
  error: string | null;
} {
  try {
    const data = GeneratedPlanSchema.parse(rawJson);

    // Scan output text fields for reflected prompt injection or instructions leakage
    const textCorpus = [
      data.themeVibeSummary,
      ...data.budgetBreakdown.map(b => `${b.name} ${b.notes}`),
      ...data.timelineMilestones.map(t => `${t.title} ${t.description}`),
      ...data.vendorChecklist.map(v => `${v.name} ${v.notes}`),
      ...data.personalizedIdeas.map(i => `${i.title} ${i.description}`)
    ].join(' ');

    const outputScan = sanitizeUserInput(textCorpus);
    if (outputScan.violations.some(v => v.includes('Prompt Injection'))) {
      return {
        success: false,
        data: null,
        error: 'Output contained detected prompt injection or instruction leakage'
      };
    }

    return {
      success: true,
      data,
      error: null
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: `Output Schema Validation Failed: ${err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      };
    }
    return {
      success: false,
      data: null,
      error: 'Malformed JSON response from AI model'
    };
  }
}
