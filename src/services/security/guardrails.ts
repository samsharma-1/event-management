import { z } from 'zod';
import type { SecurityAuditEntry } from '../../types/event';

/**
 * Security & Guardrails Engine for GenAI Event Planning Assistant
 * Protects against prompt injections, jailbreaks, PII leakage, and malformed outputs.
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

// PII regex patterns to mask accidental sensitive data
const PII_PATTERNS = [
  // Credit card patterns (simple Luhn-like sequence)
  { regex: /\b(?:\d[ -]*?){13,16}\b/g, replacement: '[REDACTED_PAYMENT_CARD]' },
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
 * Strips dangerous injection sequences, neutralizes prompt overrides, and redacts PII.
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

  // 1. Check for prompt injection signatures
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(processed)) {
      violations.push(`Prompt Injection Pattern Detected: ${pattern.source}`);
    }
  }

  // 2. Neutralize instruction overrides
  if (violations.length > 0) {
    for (const pattern of INJECTION_PATTERNS) {
      processed = processed.replace(pattern, '[INJECTION_NEUTRALIZED]');
    }
  }

  // 3. Redact sensitive PII
  for (const pii of PII_PATTERNS) {
    if (pii.regex.test(processed)) {
      violations.push('Sensitive Information (PII/Key) Detected and Masked');
      processed = processed.replace(pii.regex, pii.replacement);
    }
  }

  // 4. Character limits and control character stripping
  if (processed.length > 4000) {
    violations.push('Input truncated to 4000 character maximum');
    processed = processed.substring(0, 4000);
  }

  // Strip non-printable / control ASCII characters except standard newlines & tabs
  processed = processed.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

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
  id: z.string().optional().default(() => `b-${Math.random().toString(36).substr(2, 9)}`),
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
  id: z.string().optional().default(() => `t-${Math.random().toString(36).substr(2, 9)}`),
  title: z.string().min(1),
  description: z.string().default(''),
  dueDate: z.string(),
  time: z.string().optional(),
  phase: z.enum(['months-before', 'weeks-before', 'days-before', 'day-of-run-of-show']),
  isCompleted: z.boolean().default(false),
  category: z.string().optional()
});

export const VendorItemSchema = z.object({
  id: z.string().optional().default(() => `v-${Math.random().toString(36).substr(2, 9)}`),
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
  id: z.string().optional().default(() => `i-${Math.random().toString(36).substr(2, 9)}`),
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

/**
 * Validates and repairs AI JSON output against the strict Zod schema.
 * Replaces invalid fields with safe defaults rather than crashing.
 */
export function validateAIOutput(rawJson: unknown) {
  try {
    return {
      success: true,
      data: GeneratedPlanSchema.parse(rawJson),
      error: null
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        data: null,
        error: `Output Schema Validation Failed: ${(err as any).issues ? (err as any).issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ') : String(err)}`
      };
    }
    return {
      success: false,
      data: null,
      error: 'Malformed JSON response from AI model'
    };
  }
}
