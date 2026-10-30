import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Sparkles, 
  HelpCircle
} from 'lucide-react';
import type { VendorItem, VendorStatus, Currency } from '../types/event';

interface VendorTrackerProps {
  vendors: VendorItem[];
  currency: Currency;
  eventType: string;
  onUpdateVendors: (newVendors: VendorItem[]) => void;
}

export const VendorTracker: React.FC<VendorTrackerProps> = ({
  vendors,
  currency,
  eventType,
  onUpdateVendors
}) => {
  const [activeVendorForAi, setActiveVendorForAi] = useState<VendorItem | null>(null);
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isOpenAddModal, setIsOpenAddModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<VendorItem['category']>('catering');
  const [quotedPrice, setQuotedPrice] = useState<number>(0);
  const [depositPaid, setDepositPaid] = useState<number>(0);
  const [status, setStatus] = useState<VendorStatus>('researching');
  const [notes, setNotes] = useState('');

  const statusOptions: { value: VendorStatus; label: string; color: string }[] = [
    { value: 'researching', label: 'Researching', color: '#9ca3af' },
    { value: 'contacted', label: 'Contacted', color: '#38bdf8' },
    { value: 'quoted', label: 'Quoted Received', color: '#f59e0b' },
    { value: 'contract-signed', label: 'Contract Signed', color: '#a855f7' },
    { value: 'deposit-paid', label: 'Deposit Paid', color: '#10b981' },
    { value: 'confirmed', label: 'Confirmed Final', color: '#059669' },
    { value: 'completed', label: 'Completed', color: '#6b7280' }
  ];

  const handleStatusChange = (id: string, newStatus: VendorStatus) => {
    onUpdateVendors(
      vendors.map(v => v.id === id ? { ...v, status: newStatus } : v)
    );
  };

  const handleToggleChecklistItem = (vendorId: string, checkId: string) => {
    onUpdateVendors(
      vendors.map(v => {
        if (v.id === vendorId) {
          return {
            ...v,
            checklistItems: v.checklistItems.map(c => 
              c.id === checkId ? { ...c, done: !c.done } : c
            )
          };
        }
        return v;
      })
    );
  };

  const handleAddChecklistItem = (vendorId: string, text: string) => {
    if (!text.trim()) return;
    onUpdateVendors(
      vendors.map(v => {
        if (v.id === vendorId) {
          return {
            ...v,
            checklistItems: [
              ...v.checklistItems,
              { id: `chk-${Date.now()}`, text: text.trim(), done: false }
            ]
          };
        }
        return v;
      })
    );
  };

  const handleDeleteVendor = (id: string) => {
    onUpdateVendors(vendors.filter(v => v.id !== id));
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVendor: VendorItem = {
      id: `v-${Date.now()}`,
      category,
      name: name.trim(),
      status,
      quotedPrice: Number(quotedPrice) || 0,
      depositPaid: Number(depositPaid) || 0,
      notes: notes.trim(),
      checklistItems: [
        { id: `c-${Date.now()}-1`, text: 'Review terms & liability insurance', done: false },
        { id: `c-${Date.now()}-2`, text: 'Confirm arrival / load-in schedule', done: false }
      ]
    };

    onUpdateVendors([...vendors, newVendor]);
    setName('');
    setQuotedPrice(0);
    setDepositPaid(0);
    setNotes('');
    setIsOpenAddModal(false);
  };

  const handleGenerateVendorQuestions = (vendor: VendorItem) => {
    setActiveVendorForAi(vendor);
    setIsAiLoading(true);

    setTimeout(() => {
      let questions: string[] = [];
      if (vendor.category === 'catering') {
        questions = [
          'Are vendor meals (for photographer, DJ, coordinator) included or billed at a discount?',
          'What is the per-person corkage and cake-cutting fee if we bring our own beverages or dessert?',
          'Do you supply complete tableware, cloth linens, and ice, or must we rent those separately?',
          'What is your exact protocol for severe airborne or gluten allergies during prep?',
          'How many dedicated waitstaff and bartenders will be on site per 50 guests?'
        ];
      } else if (vendor.category === 'photography') {
        questions = [
          'Do we receive full high-resolution digital rights without watermarks for personal printing?',
          'What is your backup plan if the primary shooter is sick or equipment fails on the day?',
          'What is your guaranteed delivery window for the sneak-peek gallery and full album?',
          'Have you shot in this specific lighting or venue setting before?'
        ];
      } else if (vendor.category === 'venue') {
        questions = [
          'What is the precise curfew for amplified music, and what are the sound decibel limits?',
          'How many hours prior to the event can vendors begin setup and teardown without overtime fees?',
          'Is general liability insurance required for all third-party vendors?',
          'What is the exact bad-weather backup plan for outdoor ceremony or lawn spaces?'
        ];
      } else {
        questions = [
          'What is your exact deposit schedule and cancellation / postponement policy?',
          'What power requirements or dedicated electrical circuits do you require on-site?',
          'Are there any overtime fees if speeches run 30-45 minutes over schedule?',
          'What is the latest date we can modify our final headcount or specifications?'
        ];
      }
      setAiQuestions(questions);
      setIsAiLoading(false);
    }, 600);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            Vendor Checklists & Contracts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Track vetting, price quotes, contract clauses, and key logistics for your {eventType} suppliers.
          </p>
        </div>

        <button
          onClick={() => setIsOpenAddModal(true)}
          className="btn btn-primary btn-sm"
          aria-label="Add new vendor"
        >
          <Plus size={15} /> + Add Vendor
        </button>
      </div>

      {/* AI Vendor Questions Modal */}
      {activeVendorForAi && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-purple)', fontWeight: 700 }}>
                <Sparkles size={20} />
                <span>AI Interview Questions for {activeVendorForAi.name}</span>
              </div>
              <button
                onClick={() => setActiveVendorForAi(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Ask these specific vetting questions before signing or paying a deposit to protect your budget:
            </p>

            {isAiLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                Generating targeted vendor questions...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {aiQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <HelpCircle size={16} style={{ color: 'var(--brand-purple)', flexShrink: 0, marginTop: '0.15rem' }} />
                    <span style={{ flex: 1 }}>{q}</span>
                    <button
                      onClick={() => {
                        handleAddChecklistItem(activeVendorForAi.id, `Ask: ${q}`);
                        alert('Added to vendor checklist!');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      title="Add to vendor checklist"
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendor Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {vendors.map(vendor => (
          <div
            key={vendor.id}
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
              {/* Category & Status Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: 'var(--brand-purple)'
                }}>
                  {vendor.category.replace('-', ' ')}
                </span>

                <select
                  className="input-control"
                  style={{ width: 'auto', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                  value={vendor.status}
                  onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                  aria-label={`Status for ${vendor.name}`}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem' }}>
                {vendor.name}
              </h3>

              {vendor.notes && (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  {vendor.notes}
                </p>
              )}

              {/* Financial commitments */}
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Quoted: </span>
                  <strong>{vendor.quotedPrice ? `${vendor.quotedPrice.toLocaleString()} ${currency}` : 'Pending'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Deposit: </span>
                  <strong style={{ color: '#10b981' }}>{vendor.depositPaid ? `${vendor.depositPaid.toLocaleString()} ${currency}` : 'None'}</strong>
                </div>
              </div>

              {/* Checklist Items */}
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Action Checklist ({vendor.checklistItems.filter(c => c.done).length}/{vendor.checklistItems.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {vendor.checklistItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(vendor.id, item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.825rem',
                        cursor: 'pointer',
                        color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: item.done ? 'line-through' : 'none'
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={item.done}
                      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') handleToggleChecklistItem(vendor.id, item.id); }}
                    >
                      {item.done ? (
                        <CheckSquare size={16} style={{ color: '#10b981' }} />
                      ) : (
                        <Square size={16} style={{ color: 'var(--text-muted)' }} />
                      )}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => handleGenerateVendorQuestions(vendor)}
                className="btn btn-secondary btn-sm"
                style={{ gap: '0.35rem', fontSize: '0.75rem' }}
                aria-label={`Ask AI questions for ${vendor.name}`}
              >
                <Sparkles size={14} style={{ color: 'var(--brand-purple)' }} /> AI Interview Questions
              </button>

              <button
                onClick={() => handleDeleteVendor(vendor.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                title="Remove vendor"
                aria-label={`Remove ${vendor.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vendor Modal */}
      {isOpenAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-vendor-title">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h3 id="add-vendor-title" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Add New Vendor
            </h3>

            <form onSubmit={handleAddVendor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Vendor Category
                </label>
                <select
                  className="input-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as VendorItem['category'])}
                >
                  <option value="venue">Venue & Facilities</option>
                  <option value="catering">Catering & Bar</option>
                  <option value="photography">Photography & Videography</option>
                  <option value="music-entertainment">Music & Live Entertainment</option>
                  <option value="decor-florals">Decor & Floral Design</option>
                  <option value="permits-security">City Permits & Security</option>
                  <option value="cake-bakery">Cake & Bakery</option>
                  <option value="attire-styling">Attire & Styling</option>
                  <option value="transportation">Guest Transportation</option>
                  <option value="other">Other Specialist</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Vendor / Business Name
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Golden State Sound & DJ Co."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Quoted Total Price ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-control"
                    value={quotedPrice}
                    onChange={(e) => setQuotedPrice(Number(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Deposit Paid ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-control"
                    value={depositPaid}
                    onChange={(e) => setDepositPaid(Number(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Contract Status
                </label>
                <select
                  className="input-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VendorStatus)}
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Notes / Inclusions
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. 50% deposit required upon contract signature."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setIsOpenAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
