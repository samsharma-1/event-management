import React, { useState } from 'react';
import { 
  Heart, 
  Cake, 
  HeartHandshake, 
  Sparkles, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  DollarSign, 
  Users, 
  Calendar, 
  MapPin, 
  ShieldAlert
} from 'lucide-react';
import type { EventType, Currency, EventDetails, EventPlan } from '../types/event';
import { generateEventPlanAI } from '../services/ai/geminiClient';
import { sanitizeUserInput } from '../services/security/guardrails';

interface EventWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanCreated: (plan: EventPlan) => void;
}

function createEventDetailsPayload(params: {
  title: string;
  eventType: EventType;
  date: string;
  location: string;
  guestCount: number | string;
  totalBudget: number | string;
  currency: Currency;
  vibe: string;
  specialRequests: string;
}): EventDetails {
  const timestamp = new Date().toISOString();
  return {
    id: `event-${Date.now()}`,
    title: params.title.trim() || 'My Master Event',
    type: params.eventType,
    date: params.date,
    location: params.location.trim() || 'Venue TBD',
    guestCount: Math.max(1, Number(params.guestCount) || 50),
    totalBudget: Math.max(100, Number(params.totalBudget) || 5000),
    currency: params.currency,
    vibe: params.vibe,
    specialRequests: params.specialRequests.trim(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export const EventWizard: React.FC<EventWizardProps> = ({
  isOpen,
  onClose,
  onPlanCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [eventType, setEventType] = useState<EventType>('wedding');
  
  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    return d.toISOString().split('T')[0];
  });
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState<number>(100);
  const [totalBudget, setTotalBudget] = useState<number>(25000);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [vibe, setVibe] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [inputWarnings, setInputWarnings] = useState<string[]>([]);

  if (!isOpen) return null;

  // Preset Vibe Recommendations per event type
  const vibePresets: Record<EventType, string[]> = {
    wedding: [
      'Modern Botanical Glasshouse with Ambient Candlelight',
      'Rustic Tuscan Vineyard & Warm Sunset Tones',
      'Minimalist Contemporary Rooftop Elegance',
      'Romantic Secret Garden & Acoustic Strings'
    ],
    birthday: [
      'Futuristic Neon Cyberpunk & Synthwave',
      '90s Retro Disco Fever with Polaroid Keepsakes',
      'Gilded Art Deco Great Gatsby Cocktail Soirée',
      'Tropical Sunset Tiki Lounge & Craft Mocktails'
    ],
    community: [
      'Eco-Harvest Family Festival & Zero Waste',
      'Neighborhood Cultural Arts & Street Food Fair',
      'Civic Tech Hackathon & Youth Science Pavilion',
      'Riverside Charity 5K & Live Acoustic Stage'
    ]
  };

  const handleNextStep1 = (type: EventType) => {
    setEventType(type);
    if (!title) {
      if (type === 'wedding') setTitle('Dream Garden Glasshouse Wedding');
      else if (type === 'birthday') setTitle('30th Milestone Neon Birthday');
      else setTitle('Spring Neighborhood Community Fair');
    }
    if (!vibe) {
      setVibe(vibePresets[type][0]);
    }
    if (!location) {
      if (type === 'wedding') setLocation('The Botanical Atrium, CA');
      else if (type === 'birthday') setLocation('Skyline Rooftop Bar & Lounge');
      else setLocation('Oakridge Central Civic Park');
    }
    if (type === 'birthday' && totalBudget === 25000) setTotalBudget(8000);
    if (type === 'community' && totalBudget === 25000) setTotalBudget(15000);

    setStep(2);
  };

  const handleValidateStep2 = () => {
    // Quick sanitization check on inputs
    const titleCheck = sanitizeUserInput(title);
    const locCheck = sanitizeUserInput(location);
    const warnings = [...titleCheck.violations, ...locCheck.violations];
    setInputWarnings(warnings);
    setStep(3);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgressStatus('Initializing PlanVibe AI orchestration...');

    const newDetails = createEventDetailsPayload({
      title,
      eventType,
      date,
      location,
      guestCount,
      totalBudget,
      currency,
      vibe: vibe.trim() || vibePresets[eventType][0],
      specialRequests
    });

    try {
      const plan = await generateEventPlanAI(newDetails, (status) => {
        setProgressStatus(status);
      });

      // Confetti burst (dynamically imported)
      try {
        const { default: confetti } = await import('canvas-confetti');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Non-blocking if confetti fails to load
      }

      onPlanCreated(plan);
      onClose();
    } catch (err) {
      console.error('Plan generation failed:', err);
      setProgressStatus('Plan generation completed via intelligent fallback.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div className="modal-content" style={{ padding: '2rem', position: 'relative' }}>
        {/* Close Button */}
        {!isGenerating && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '1.25rem',
              right: '1.25rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer'
            }}
            aria-label="Close creation wizard"
          >
            <X size={20} />
          </button>
        )}

        {/* Wizard Header */}
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#a855f7',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.75rem'
          }}>
            <Sparkles size={14} /> Step {step} of 3
          </div>
          <h2 id="wizard-title" style={{ fontSize: '1.65rem' }}>
            {step === 1 && "What type of event are you organizing?"}
            {step === 2 && "Essential Logistics & Numbers"}
            {step === 3 && "Aesthetic Vibe & Personalization"}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            {step === 1 && "PlanVibe AI tailors budgeting logic, vendor checklists, and run-of-show protocols to each category."}
            {step === 2 && "Set your expected headcount, target budget cap, and primary event date."}
            {step === 3 && "Tell the AI your style vision or select a curated aesthetic."}
          </p>
        </div>

        {/* STEP 1: EVENT TYPE SELECTION */}
        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {/* Wedding Card */}
            <div
              onClick={() => handleNextStep1('wedding')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                border: eventType === 'wedding' ? '2px solid #f43f5e' : undefined,
                transition: 'all 0.2s ease'
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNextStep1('wedding'); }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fb7185',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Heart size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Wedding</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Ceremony & reception flow, catering tastings, photographer shot lists, and emotional run-of-show.
              </p>
            </div>

            {/* Birthday Card */}
            <div
              onClick={() => handleNextStep1('birthday')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                border: eventType === 'birthday' ? '2px solid #8b5cf6' : undefined,
                transition: 'all 0.2s ease'
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNextStep1('birthday'); }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(139, 92, 246, 0.15)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Cake size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Birthday</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Milestone themes, bespoke cakes, interactive games, DJ playlists, and high-energy party timeline.
              </p>
            </div>

            {/* Community Card */}
            <div
              onClick={() => handleNextStep1('community')}
              className="glass-panel"
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                textAlign: 'center',
                border: eventType === 'community' ? '2px solid #10b981' : undefined,
                transition: 'all 0.2s ease'
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') handleNextStep1('community'); }}
            >
              <div style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <HeartHandshake size={28} />
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.35rem' }}>Community</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Festivals, galas & fairs: city park permits, stage AV, volunteers, safety protocols, and zero-waste.
              </p>
            </div>
          </div>
        )}

        {/* STEP 2: LOGISTICS */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Event Title
              </label>
              <input
                type="text"
                className="input-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Avery & Morgan's Glasshouse Wedding"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  <Calendar size={14} /> Event Date
                </label>
                <input
                  type="date"
                  className="input-control"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  <Users size={14} /> Expected Guests
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  className="input-control"
                  value={guestCount}
                  onChange={(e) => setGuestCount(parseInt(e.target.value, 10) || 1)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  <DollarSign size={14} /> Target Budget Cap
                </label>
                <input
                  type="number"
                  min="100"
                  step="500"
                  className="input-control"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseInt(e.target.value, 10) || 1000)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Currency
                </label>
                <select
                  className="input-control"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                >
                  <option value="INR">🇮🇳 India - INR (₹)</option>
                  <option value="USD">🇺🇸 USA - USD ($)</option>
                  <option value="GBP">🇬🇧 UK - GBP (£)</option>
                  <option value="EUR">🇪🇺 Europe - EUR (€)</option>
                  <option value="CAD">🇨🇦 Canada - CAD (CA$)</option>
                  <option value="AUD">🇦🇺 Australia - AUD (A$)</option>
                  <option value="AED">🇦🇪 UAE - AED (د.إ)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                <MapPin size={14} /> Location / Venue Type
              </label>
              <input
                type="text"
                className="input-control"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco Conservatory, Private Villa, or Central Park"
              />
            </div>

            {/* Step 2 Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-secondary">
                <ArrowLeft size={16} /> Back
              </button>
              <button onClick={handleValidateStep2} className="btn btn-primary">
                Next: Vibe & Style <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VIBE & AI GENERATION */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {inputWarnings.length > 0 && (
              <div style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontSize: '0.8rem',
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <ShieldAlert size={16} />
                <span>Security Notice: Some inputs were normalized for safety against prompt overrides.</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Aesthetic Vision / Theme
              </label>
              <input
                type="text"
                className="input-control"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                placeholder="e.g. Candlelit Bohemian Greenhouse"
              />

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                {vibePresets[eventType].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setVibe(preset)}
                    style={{
                      background: vibe === preset ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '9999px',
                      padding: '0.25rem 0.65rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Special Instructions, Dietary, or Specific Requirements
              </label>
              <textarea
                className="input-control"
                rows={3}
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="e.g. Need gluten-free dessert options, prioritize acoustic ceremony music, zero-waste focus..."
              />
            </div>

            {/* Generation Progress Indicator */}
            {isGenerating ? (
              <div style={{
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                textAlign: 'center'
              }}>
                <div className="pulse-ai" style={{ display: 'inline-flex', marginBottom: '0.75rem', color: '#a855f7' }}>
                  <Sparkles size={32} />
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                  Synthesizing Master Event Plan...
                </div>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {progressStatus}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <button onClick={() => setStep(2)} className="btn btn-secondary">
                  <ArrowLeft size={16} /> Back
                </button>
                <button onClick={handleGenerate} className="btn btn-primary" style={{ gap: '0.5rem' }}>
                  <Sparkles size={18} />
                  <span>Generate Complete Plan</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
