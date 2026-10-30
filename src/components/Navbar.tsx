import React, { useState } from 'react';
import { 
  PlusCircle, 
  ShieldCheck, 
  Sliders, 
  Moon, 
  Sun, 
  Key, 
  Download, 
  Calendar as CalendarIcon,
  Cake,
  HeartHandshake,
  Heart,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react';
import type { EventPlan, RegionConfig } from '../types/event';
import { SUPPORTED_REGIONS } from '../types/event';
import { getStoredApiKey } from '../services/ai/geminiClient';
import { exportPlanToJson } from '../services/storage/eventStorage';
import logoImg from '../assets/logo.png';

interface NavbarProps {
  events: EventPlan[];
  activeEvent: EventPlan;
  onSelectEvent: (id: string) => void;
  onOpenWizard: () => void;
  onOpenSecurityModal: () => void;
  onOpenApiKeyModal: () => void;
  onOpenAccessibilityModal: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  currentRegion: RegionConfig;
  onSelectRegion: (region: RegionConfig) => void;
  orientation?: 'landscape' | 'portrait';
  onToggleOrientation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  events,
  activeEvent,
  onSelectEvent,
  onOpenWizard,
  onOpenSecurityModal,
  onOpenApiKeyModal,
  onOpenAccessibilityModal,
  theme,
  onToggleTheme,
  currentRegion,
  onSelectRegion,
  orientation = 'landscape',
  onToggleOrientation
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [regionDropdownOpen, setRegionDropdownOpen] = useState(false);
  const hasLiveApiKey = Boolean(getStoredApiKey());

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'wedding': return <Heart size={16} style={{ color: '#e11d48' }} />;
      case 'birthday': return <Cake size={16} style={{ color: '#7c3aed' }} />;
      case 'community': return <HeartHandshake size={16} style={{ color: '#059669' }} />;
      default: return <CalendarIcon size={16} />;
    }
  };

  return (
    <header className="glass-panel" style={{
      margin: '1rem auto',
      maxWidth: '1360px',
      padding: '0.85rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
      position: 'sticky',
      top: '1rem',
      zIndex: 100
    }}>
      {/* Brand Logo & Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid var(--border-color)',
          flexShrink: 0
        }}>
          <img 
            src={logoImg} 
            alt="PlanVibe AI Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: '2px'
            }} 
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ 
              fontFamily: 'var(--font-heading)', 
              fontWeight: 800, 
              fontSize: '1.25rem',
              color: 'var(--text-primary)'
            }}>
              PlanVibe AI
            </span>
            <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>GenAI v2.0</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Intelligent Event Master • Weddings, Birthdays & Community
          </p>
        </div>
      </div>

      {/* Center: Event Selector & New Event Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', flexWrap: 'wrap' }}>
        {/* Event Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setRegionDropdownOpen(false);
            }}
            className="btn btn-secondary"
            aria-expanded={dropdownOpen}
            aria-label="Select active event"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.6rem',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {getEventIcon(activeEvent.details.type)}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeEvent.details.title}
            </span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>▼</span>
          </button>

          {dropdownOpen && (
            <div 
              className="glass-panel" 
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                width: '320px',
                zIndex: 200,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                SELECT ACTIVE EVENT ({events.length})
              </div>
              {events.map(ev => (
                <button
                  key={ev.details.id}
                  onClick={() => {
                    onSelectEvent(ev.details.id);
                    setDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    background: ev.details.id === activeEvent.details.id ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    fontSize: '0.875rem'
                  }}
                >
                  {getEventIcon(ev.details.type)}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {ev.details.title}
                    </div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                      {ev.details.type.toUpperCase()} • {ev.details.date}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Region & Currency Selector Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setRegionDropdownOpen(!regionDropdownOpen);
              setDropdownOpen(false);
            }}
            className="btn btn-secondary"
            aria-expanded={regionDropdownOpen}
            aria-label="Select Region and Currency"
            title="Switch region and currency (e.g. India - ₹ Rupees, USA - $ Dollars)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{currentRegion.flag}</span>
            <span>{currentRegion.country} ({currentRegion.symbol})</span>
            <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
          </button>

          {regionDropdownOpen && (
            <div 
              className="glass-panel" 
              style={{
                position: 'absolute',
                top: '110%',
                left: 0,
                width: '260px',
                zIndex: 200,
                padding: '0.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
                boxShadow: 'var(--shadow-lg)'
              }}
            >
              <div style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={13} /> SELECT REGION & CURRENCY
              </div>
              {SUPPORTED_REGIONS.map(reg => (
                <button
                  key={reg.code}
                  onClick={() => {
                    onSelectRegion(reg);
                    setRegionDropdownOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: reg.code === currentRegion.code ? 'rgba(79, 70, 229, 0.12)' : 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    width: '100%',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{reg.flag}</span>
                    <span style={{ fontWeight: 600 }}>{reg.country}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--brand-purple)', fontWeight: 700 }}>
                    {reg.currency} ({reg.symbol})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button 
          onClick={onOpenWizard} 
          className="btn btn-primary"
          style={{ gap: '0.4rem' }}
          aria-label="Create new AI planned event"
        >
          <PlusCircle size={18} />
          <span>New Event</span>
        </button>

        <button
          onClick={() => exportPlanToJson(activeEvent)}
          className="btn btn-secondary btn-sm"
          title="Export current plan as JSON"
          aria-label="Export Plan JSON"
        >
          <Download size={16} />
        </button>
      </div>

      {/* Right Controls: Engine Badge, Security, Accessibility, Theme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {/* AI Engine Status Toggle */}
        <button
          onClick={onOpenApiKeyModal}
          className="btn btn-secondary btn-sm"
          style={{
            borderColor: hasLiveApiKey ? 'rgba(5, 150, 105, 0.4)' : 'rgba(79, 70, 229, 0.4)',
            background: hasLiveApiKey ? 'rgba(5, 150, 105, 0.08)' : 'rgba(79, 70, 229, 0.08)'
          }}
          title={hasLiveApiKey ? "Using Live Gemini API" : "Using Adaptive Simulated AI (Zero-key offline safe)"}
          aria-label="AI Engine Settings"
        >
          <Key size={14} style={{ color: hasLiveApiKey ? '#059669' : '#7c3aed' }} />
          <span style={{ fontSize: '0.775rem', fontWeight: 600 }}>
            {hasLiveApiKey ? 'Gemini Live' : 'AI Simulated'}
          </span>
        </button>

        {/* Security Inspector Button */}
        <button
          onClick={onOpenSecurityModal}
          className="btn btn-secondary btn-sm"
          style={{ borderColor: 'rgba(5, 150, 105, 0.3)' }}
          title="Security & Guardrails Audit Inspector"
          aria-label="Security and Guardrails Inspector"
        >
          <ShieldCheck size={16} style={{ color: '#059669' }} />
          <span style={{ fontSize: '0.775rem', fontWeight: 600 }}>Guardrails</span>
        </button>

        {/* Accessibility Panel Button */}
        <button
          onClick={onOpenAccessibilityModal}
          className="btn btn-secondary btn-sm"
          title="Accessibility, Font Scale & Contrast"
          aria-label="Accessibility Settings"
        >
          <Sliders size={16} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-secondary btn-sm"
          title={`Switch to ${theme === 'dark' ? 'White Glassmorphism' : 'Dark'} mode`}
          aria-label="Toggle Dark and Light theme"
        >
          {theme === 'dark' ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} />}
        </button>

        {/* Landscape <-> Portrait Orientation Toggle Button */}
        {onToggleOrientation && (
          <button
            onClick={onToggleOrientation}
            className="btn btn-secondary btn-sm"
            style={{
              borderColor: orientation === 'portrait' ? 'var(--brand-purple)' : 'var(--border-color)',
              background: orientation === 'portrait' ? 'rgba(124, 58, 237, 0.12)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title={orientation === 'landscape' ? "Toggle to Portrait View (Mobile/Tablet Mode)" : "Toggle to Landscape View (Desktop Widescreen)"}
            aria-label={`Current layout is ${orientation}. Click to toggle orientation`}
          >
            {orientation === 'landscape' ? (
              <>
                <Smartphone size={15} style={{ color: 'var(--brand-purple)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Portrait</span>
              </>
            ) : (
              <>
                <Monitor size={15} style={{ color: 'var(--brand-cyan)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Landscape</span>
              </>
            )}
          </button>
        )}
      </div>
    </header>
  );
};
