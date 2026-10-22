import React from 'react';
import { 
  Sliders, 
  X, 
  Eye, 
  Type, 
  Keyboard
} from 'lucide-react';

interface AccessibilityControlsProps {
  isOpen: boolean;
  onClose: () => void;
  baseFontSize: number;
  onFontSizeChange: (size: number) => void;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export const AccessibilityControls: React.FC<AccessibilityControlsProps> = ({
  isOpen,
  onClose,
  baseFontSize,
  onFontSizeChange,
  highContrast,
  onToggleHighContrast,
  reducedMotion,
  onToggleReducedMotion
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="a11y-title">
      <div className="modal-content" style={{ padding: '2rem', maxWidth: '560px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3b82f6'
            }}>
              <Sliders size={22} />
            </div>
            <div>
              <h2 id="a11y-title" style={{ fontSize: '1.35rem' }}>
                Accessibility & Usability Studio
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                WCAG 2.1 AA / AAA Compliance & Inclusive Design
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            aria-label="Close accessibility controls"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Font Size Scaling */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label htmlFor="font-scale-slider" style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Type size={16} /> Text Font Scaling
              </label>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-purple)' }}>
                {baseFontSize}px ({Math.round((baseFontSize / 16) * 100)}%)
              </span>
            </div>

            <input
              id="font-scale-slider"
              type="range"
              min="14"
              max="22"
              step="1"
              value={baseFontSize}
              onChange={(e) => onFontSizeChange(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand-purple)' }}
              aria-label="Adjust font scale slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              <span>Compact (14px)</span>
              <span>Standard (16px)</span>
              <span>Large (22px)</span>
            </div>
          </div>

          {/* High Contrast Mode Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={16} /> High Contrast Mode
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Enforces maximum contrast borders & WCAG AAA compliance.
              </div>
            </div>

            <button
              onClick={onToggleHighContrast}
              className={`btn btn-sm ${highContrast ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={highContrast}
            >
              {highContrast ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Reduced Motion Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Reduced Motion Mode
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Disables animated transitions and pulse effects for vestibular comfort.
              </div>
            </div>

            <button
              onClick={onToggleReducedMotion}
              className={`btn btn-sm ${reducedMotion ? 'btn-primary' : 'btn-secondary'}`}
              aria-pressed={reducedMotion}
            >
              {reducedMotion ? 'Active' : 'Off'}
            </button>
          </div>

          {/* Keyboard Navigation Quick Reference */}
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <Keyboard size={16} /> Accessible Keyboard Navigation
            </div>
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li><kbd style={{ background: '#334155', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Tab</kbd> / <kbd style={{ background: '#334155', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Shift + Tab</kbd> Navigate between interactive buttons, tabs, and inputs</li>
              <li><kbd style={{ background: '#334155', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Enter</kbd> or <kbd style={{ background: '#334155', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Space</kbd> Activate cards, checkboxes, and buttons</li>
              <li><kbd style={{ background: '#334155', padding: '0.1rem 0.3rem', borderRadius: '4px' }}>Esc</kbd> Close open dialogs, wizards, or inspectors</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
