import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Trash2, 
  Palette, 
  PartyPopper, 
  Utensils, 
  MessageSquare, 
  Coins,
  ArrowRight,
  DollarSign
} from 'lucide-react';
import type { PersonalizedIdea, EventDetails } from '../types/event';
import { sanitizeUserInput } from '../services/security/guardrails';

interface IdeaLabProps {
  ideas: PersonalizedIdea[];
  eventDetails: EventDetails;
  onUpdateIdeas: (newIdeas: PersonalizedIdea[]) => void;
  onAddBudgetItem?: (name: string, cost: number) => void;
  onAddMilestone?: (title: string, desc: string) => void;
}

export const IdeaLab: React.FC<IdeaLabProps> = ({
  ideas,
  eventDetails,
  onUpdateIdeas,
  onAddBudgetItem,
  onAddMilestone
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [customIdeaPrompt, setCustomIdeaPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const categories = [
    { id: 'all', label: 'All Ideas' },
    { id: 'theme', label: 'Themes & Color Stories' },
    { id: 'activity', label: 'Guest Activities & Games' },
    { id: 'food-drink', label: 'Food & Bar Concepts' },
    { id: 'speech-vows', label: eventDetails.type === 'wedding' ? 'Vows & Speeches' : 'Toasts & Speeches' },
    { id: 'budget-hack', label: 'Budget Hacks & DIY' }
  ];

  const filtered = ideas.filter(i => {
    if (selectedCategory === 'all') return true;
    return i.category === selectedCategory;
  });

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleDelete = (id: string) => {
    onUpdateIdeas(ideas.filter(i => i.id !== id));
  };

  const handleGenerateCustomIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customIdeaPrompt.trim()) return;

    // Sanitize user input
    const check = sanitizeUserInput(customIdeaPrompt);

    setIsGenerating(true);

    setTimeout(() => {
      const newIdea: PersonalizedIdea = {
        id: `i-${Date.now()}`,
        title: `AI Concept: ${check.sanitizedText.substring(0, 40)}`,
        category: 'activity',
        description: `Customized for "${eventDetails.title}" with ${eventDetails.vibe} aesthetic: ${check.sanitizedText}. Designed to create memorable guest engagement while fitting your guest count of ${eventDetails.guestCount}.`,
        tags: ['Custom AI', eventDetails.type],
        estimatedCostImpact: 'low',
        actionableSteps: ['Review feasibility with coordinator', 'Assign lead volunteer/friend']
      };

      onUpdateIdeas([newIdea, ...ideas]);
      setCustomIdeaPrompt('');
      setIsGenerating(false);
    }, 600);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'theme': return <Palette size={16} style={{ color: '#fb7185' }} />;
      case 'activity': return <PartyPopper size={16} style={{ color: '#c084fc' }} />;
      case 'food-drink': return <Utensils size={16} style={{ color: '#f59e0b' }} />;
      case 'speech-vows': return <MessageSquare size={16} style={{ color: '#38bdf8' }} />;
      case 'budget-hack': return <Coins size={16} style={{ color: '#10b981' }} />;
      default: return <Sparkles size={16} style={{ color: 'var(--brand-purple)' }} />;
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
      {/* Header & Prompt Generator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            Personalized Inspiration & Idea Lab
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Creative concepts, color stories, and guest experiences engineered for "{eventDetails.title}".
          </p>
        </div>
      </div>

      {/* AI Idea Prompt Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)' }}>
        <form onSubmit={handleGenerateCustomIdea} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 300px' }}>
            <input
              type="text"
              className="input-control"
              value={customIdeaPrompt}
              onChange={(e) => setCustomIdeaPrompt(e.target.value)}
              placeholder="e.g. Brainstorm a memorable wedding cocktail pairing or an interactive 30th birthday game..."
              aria-label="Idea brainstorm prompt"
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating || !customIdeaPrompt.trim()}
            className="btn btn-primary"
            style={{ gap: '0.4rem', whiteSpace: 'nowrap' }}
          >
            <Sparkles size={16} />
            <span>{isGenerating ? 'Synthesizing Idea...' : 'Brainstorm with AI'}</span>
          </button>
        </form>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        {categories.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`btn btn-sm ${selectedCategory === c.id ? 'btn-primary' : 'btn-secondary'}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(idea => (
          <div
            key={idea.id}
            className="glass-panel"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              {/* Category tag */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {getCategoryIcon(idea.category)}
                  <span>{idea.category.replace('-', ' ')}</span>
                </div>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '9999px',
                  backgroundColor: idea.estimatedCostImpact === 'free' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: idea.estimatedCostImpact === 'free' ? '#10b981' : '#f59e0b'
                }}>
                  {idea.estimatedCostImpact} cost impact
                </span>
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                {idea.title}
              </h3>

              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                {idea.description}
              </p>

              {/* Mood Colors if available */}
              {idea.moodColors && idea.moodColors.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    PALETTE SWATCHES (CLICK TO COPY HEX)
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {idea.moodColors.map(hex => (
                      <button
                        key={hex}
                        onClick={() => handleCopyHex(hex)}
                        style={{
                          backgroundColor: hex,
                          width: '40px',
                          height: '40px',
                          borderRadius: '8px',
                          border: '2px solid rgba(255, 255, 255, 0.25)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#ffffff',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                        title={`Copy ${hex}`}
                        aria-label={`Copy color ${hex}`}
                      >
                        {copiedHex === hex ? <Check size={14} /> : <Copy size={12} style={{ opacity: 0.6 }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Steps */}
              {idea.actionableSteps && idea.actionableSteps.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                    ACTIONABLE STEPS:
                  </div>
                  <ul style={{ paddingLeft: '1.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {idea.actionableSteps.map((step, sIdx) => (
                      <li key={sIdx} style={{ marginBottom: '0.2rem' }}>{step}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                {idea.tags.map(t => (
                  <span
                    key={t}
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.2rem 0.5rem',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)'
                    }}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {onAddMilestone && (
                  <button
                    onClick={() => {
                      onAddMilestone(idea.title, idea.description);
                      alert(`Added "${idea.title}" to Timeline!`);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                  >
                    <span>+ Timeline</span>
                    <ArrowRight size={13} />
                  </button>
                )}

                {onAddBudgetItem && (
                  <button
                    onClick={() => {
                      const estimated = idea.estimatedCostImpact === 'free' ? 0 : idea.estimatedCostImpact === 'low' ? 150 : idea.estimatedCostImpact === 'moderate' ? 400 : 1000;
                      onAddBudgetItem(idea.title, estimated);
                      alert(`Added "${idea.title}" to Budget!`);
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                  >
                    <DollarSign size={13} />
                    <span>+ Budget</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => handleDelete(idea.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                title="Remove idea"
                aria-label={`Remove idea ${idea.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
