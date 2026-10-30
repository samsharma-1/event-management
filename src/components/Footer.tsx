import React from 'react';
import { 
  ShieldCheck, 
  Heart, 
  CheckCircle2 
} from 'lucide-react';
import type { RegionConfig } from '../types/event';
import logoImg from '../assets/logo.png';

interface FooterProps {
  currentRegion: RegionConfig;
  onOpenSecurityModal: () => void;
  onOpenAccessibilityModal: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({
  currentRegion,
  onOpenSecurityModal,
  onOpenAccessibilityModal
}) => {
  return (
    <footer 
      className="glass-panel"
      style={{
        maxWidth: '1360px',
        margin: '2rem auto 1.5rem auto',
        padding: '2rem',
        borderRadius: 'var(--radius-lg)'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '2rem',
        marginBottom: '1.75rem',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '1.5rem'
      }}>
        {/* Brand & Purpose */}
        <div style={{ maxWidth: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              flexShrink: 0
            }}>
              <img src={logoImg} alt="PlanVibe AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1px' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
              PlanVibe AI
            </span>
            <span className="badge badge-ai" style={{ fontSize: '0.65rem' }}>Global v2.0</span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Intelligent Master Planning Studio empowering seamless organization of weddings, birthdays, and community festivals through responsible GenAI, strict financial allocations, and minute-by-minute run-of-shows.
          </p>
        </div>

        {/* Region & Compliance Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '220px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Active Regional Localization
          </div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 0.8rem',
            background: 'rgba(255, 255, 255, 0.9)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{currentRegion.flag}</span>
            <span>{currentRegion.country} ({currentRegion.currency} - {currentRegion.symbol})</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Locale: {currentRegion.locale} • Standard Tax & Contingency Buffer Active
          </div>
        </div>

        {/* Security & Accessibility Quick Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            System Assurances
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              onClick={onOpenSecurityModal}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <ShieldCheck size={14} style={{ color: '#059669' }} />
              <span>Prompt Injection Guard</span>
            </button>
            <button
              onClick={onOpenAccessibilityModal}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <CheckCircle2 size={14} style={{ color: '#2563eb' }} />
              <span>WCAG 2.1 AA Compliant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.825rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>© {CURRENT_YEAR} PlanVibe AI. All rights reserved.</span>
          <span>•</span>
          <span>Crafted with</span>
          <Heart size={13} style={{ color: '#e11d48', fill: '#e11d48' }} />
          <span>for memorable celebrations worldwide.</span>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Zero PII Telemetry</span>
          <span>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>Zod Schema Verified</span>
          <span>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>Offline Simulation Safe</span>
        </div>
      </div>
    </footer>
  );
};
