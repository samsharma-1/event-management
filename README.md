# PlanVibe AI – GenAI Master Event Planning Assistant
> **Global Competition Grade Implementation**  
> *Engineered for Weddings, Birthdays, and Community Events with Intelligent Budgets, Run-of-Show Timelines, Vendor Checklists, and Personalized Ideas.*

---

##  Project Overview

**PlanVibe AI** is an accessible, modern GenAI-powered planning platform designed to solve the real-world operational complexities of organizing **Weddings**, **Birthdays**, and **Community Gatherings**.

Unlike superficial wrappers that output generic text bullets, PlanVibe AI operates as a **Financial Architect, Timeline Producer, and Logistics Director**, delivering:
-  **Structured Budget Allocations** with 8% contingency buffers, category visualization, actuals tracking, and an **AI Budget Optimizer**.
-  **Phased Timelines & Minute-by-Minute Run-of-Show** with precise hourly stamps and **1-click iCalendar (.ics) export**.
-  **Domain-Specific Vendor Checklists & Pipeline Tracking** paired with an **AI Interview Questions Generator** to expose hidden fees and contract traps.
-  **Personalized Idea Lab & Moodboards** with 1-click Hex color copying and direct integration into your budget and timeline.
-  **Context-Aware Co-Planner AI Chat** synced to your active event specifications.

---

##  Alignment with Evaluation Criteria

| Evaluation Tier | Criteria | Implementation in PlanVibe AI |
| :--- | :--- | :--- |
| **High Impact** | **Problem Statement Alignment** | Dedicated planning workflows tailored specifically for **Weddings** (ceremony, reception, vows, tastings), **Birthdays** (milestone themes, cake, DJ, party flow), and **Community Events** (city permits, staging, volunteers, zero-waste). |
| **High Impact** | **Code Quality** | Strict TypeScript architecture (`src/types/event.ts`), modular separation of concerns, reactive state management, Zod schema validation on storage and model outputs, and zero linter warnings. |
| **Medium Impact** | **Security & Responsible AI** | Defense-in-depth prompt injection mitigation with Unicode NFKC and homoglyph normalization, Luhn-verified PII/payment card masking, strict Zod schema validation on AI outputs, header-based API key transport (`x-goog-api-key`), and an interactive **Security & Guardrails Inspector**. |
| **Medium Impact** | **Efficiency & Reliability** | **Dual-Engine Architecture**: Seamlessly toggles between Live Google Gemini API (modern `gemini-2.5-flash`, configurable) and a zero-key **Adaptive Heuristic Intelligence Engine**, ensuring offline simulation capability and zero rate-limit crashes for hackathon judges. |
| **Low Impact** | **Testing Validation** | Automated Vitest test suite (`npm test`) with 23 unit and integration tests validating security guardrails, homoglyph resistance, Luhn algorithms, schema parsing, fallback mechanisms, and calendar export. |
| **Low Impact** | **Accessibility (WCAG AA/AAA)** | High-contrast mode toggle, dynamic text font scaling (14px–22px), full keyboard navigation (`Tab`, `Enter`, `Space`, `Esc`), reduced motion mode, and ARIA live regions for screen readers. |

---

##  Quick Start Guide

### Prerequisites
- Node.js (v18+ recommended, verified on v22)
- npm

### 1. Installation
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:5173/` in your browser.

### 3. Run the Automated Test Suite
```bash
npm test
```
Runs 23 unit and integration tests verifying security guardrails, homoglyph normalization, Luhn credit card validation, schema parsing, storage recovery, and Gemini client fallback.

### 4. Code Quality & Lint
```bash
npm run lint
```
Enforces oxlint rules with 0 errors and 0 warnings.

### 5. Build for Production
```bash
npm run build
```
Type-checks with `tsc -b` and produces optimized, code-split chunks with Vite.

---

##  Security & Responsible GenAI Implementation

Evaluators can inspect the active security safeguards by clicking the **"Guardrails"** badge in the header:

1. **Prompt Injection Mitigation (`sanitizeUserInput`)**:
   - Applies Unicode NFKC normalization and Cyrillic/Greek homoglyph mapping (`ignоre` -> `ignore`) to resist common evasion techniques.
   - Normalizes whitespace and neutralizes detected override signatures before prompt synthesis.
   - *Security Note*: These filters serve as a practical defense-in-depth heuristic filter rather than an absolute security boundary.
2. **PII and Financial Token Redaction**:
   - Detects card-shaped digit groupings and applies the **Luhn algorithm (Mod 10)** check to mask valid payment cards (`[REDACTED_PAYMENT_CARD]`) while preventing false-positive redaction of innocent numbers (e.g. large budgets like `1500000000000 INR`).
   - Masks US SSNs (`[REDACTED_GOVT_ID]`) and exposed API keys (`[REDACTED_API_KEY]`).
3. **Strict Schema Enforcement (Zod)**:
   - Validates all AI outputs against `GeneratedPlanSchema` using Zod. Rejects unvalidated scripts or unexpected payloads.
   - Validates incoming and persisted event plans in `eventStorage` with automated schema versioning (V2) and migration fallbacks.
4. **Header-Based API Key Transmission**:
   - Transmits Gemini API keys securely via the `x-goog-api-key` header rather than URL query parameters, preventing leakage into browser history, server logs, or intermediate proxies.
   - *Production Recommendation*: For deployments beyond client demos, proxy API requests through a secure serverless backend.
5. **Interactive Security Playground**:
   - Judges can test malicious payloads in real-time inside the **Security Inspector Modal** to verify live defense and confidence scoring.

---

##  Dual AI Engine (Zero-Key Reviewer Guarantee)

Hackathon judges often face rate limits or missing API keys. PlanVibe AI implements a resilient dual-engine architecture:

1. **Simulated Heuristic AI Engine (Default)**:
   - Zero-key, offline-safe heuristic engine that generates authentic, mathematically sound budgets, phased milestones, and custom aesthetic color stories based on user inputs.
2. **Live Gemini Engine (Default: `gemini-2.5-flash`)**:
   - Connect your own Google Gemini API key via the **"AI Engine"** button in the navbar, or configure `VITE_GEMINI_MODEL` and `VITE_GEMINI_API_KEY` in `.env`.
   - Keys are stored locally in the browser and transmitted using secure HTTP request headers.

---

##  Architecture & File Structure

```
event-planner-promptwars/
├── src/
│   ├── types/
│   │   └── event.ts                    # Strict TypeScript domain interfaces
│   ├── services/
│   │   ├── security/
│   │   │   └── guardrails.ts          # Normalization, homoglyphs, Luhn check & Zod schemas
│   │   ├── ai/
│   │   │   ├── geminiClient.ts        # Gemini API orchestrator & model config
│   │   │   ├── heuristicEngine.ts     # Domain heuristic engine & expert advisor
│   │   │   └── promptTemplates.ts     # Specialized Wedding, Birthday & Community prompts
│   │   ├── storage/
│   │   │   └── eventStorage.ts        # Typed storage persistence, relative dates & Zod migration
│   │   └── export/
│   │       └── calendarExport.ts      # RFC 5545 iCalendar (.ics) generator
│   ├── components/
│   │   ├── Navbar.tsx                 # Event switcher, engine status & quick actions
│   │   ├── Dashboard.tsx              # Metric cards, countdown clock & action bar
│   │   ├── BudgetPlanner.tsx          # Allocation bars, actuals & AI Optimizer
│   │   ├── TimelineManager.tsx        # Milestones, hourly run-of-show & iCal export
│   │   ├── VendorTracker.tsx          # Status pipeline & AI interview questions
│   │   ├── IdeaLab.tsx                # Hex color swatches, ideas & 1-click add
│   │   ├── EventWizard.tsx            # 3-step AI onboarding wizard (lazy loaded)
│   │   ├── AIChatAssistant.tsx        # Pure React markdown co-planner
│   │   ├── SecurityAuditModal.tsx     # Live injection testing playground (lazy loaded)
│   │   ├── AccessibilityControls.tsx  # Dynamic font scaling & high contrast mode
│   │   └── ApiKeyModal.tsx            # Dual engine switcher
│   ├── App.tsx                        # Master container, lazy imports & reactive orchestrator
│   ├── index.css                      # Modern design system with HSL tokens
│   └── main.tsx                       # React 19 entry point
├── tests/
│   ├── guardrails.test.ts             # Homoglyphs, Luhn check, PII & Zod schemas
│   ├── eventLogic.test.ts             # Domain planning, future countdowns & storage migrations
│   └── geminiClient.test.ts           # Gemini headers, model config & fallback tests
├── .env.example                       # Sample environment configuration
├── .github/workflows/ci.yml           # Automated CI workflow
├── LICENSE                            # MIT License
├── package.json
└── vite.config.ts
```

---

##  Accessibility Standards (WCAG 2.1 AA/AAA)

Click the **Sliders (Accessibility)** icon in the header to access:
- **Font Scale Slider**: Smoothly scale application typography from 14px to 22px.
- **High-Contrast Mode**: Enforces maximum contrast ratios (>7:1) meeting WCAG AAA guidelines.
- **Reduced Motion**: Disables floating pulse animations and smooth scroll transitions for vestibular safety.
- **Full Keyboard Navigation**: Every interactive element is accessible via `Tab`, `Enter`, `Space`, and `Esc`.
- **Screen Reader Support**: Semantic HTML with ARIA live regions announcing dynamic AI and budget updates.

---

##  License
MIT License. Built for competition evaluation.
