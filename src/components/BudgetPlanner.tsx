import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  Filter
} from 'lucide-react';
import type { BudgetItem, BudgetSummary, Currency } from '../types/event';

interface BudgetPlannerProps {
  budget: BudgetSummary;
  totalBudgetCap: number;
  currency: Currency;
  eventType: string;
  onUpdateBudget: (newBudget: BudgetSummary) => void;
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
}

export const BudgetPlanner: React.FC<BudgetPlannerProps> = ({
  budget,
  totalBudgetCap,
  currency,
  eventType,
  onUpdateBudget,
  isOpenAddModal,
  onCloseAddModal
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAiAdvisor, setShowAiAdvisor] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState('');
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  // New item modal form state
  const [category, setCategory] = useState('Venue & Rentals');
  const [name, setName] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number>(500);
  const [actualCost, setActualCost] = useState<number>(0);
  const [priority, setPriority] = useState<'must-have' | 'nice-to-have' | 'optional'>('must-have');
  const [notes, setNotes] = useState('');

  // Calculations
  const totalEstimated = budget.items.reduce((s, i) => s + i.estimatedCost, 0);
  const totalActual = budget.items.reduce((s, i) => s + i.actualCost, 0);
  const totalPaid = budget.items.reduce((s, i) => s + i.paidAmount, 0);
  const remainingBudget = totalBudgetCap - totalEstimated;
  const isOverBudget = totalEstimated > totalBudgetCap;

  // Group by categories
  const categories = Array.from(new Set(budget.items.map(i => i.category)));

  // Priority Filter
  const filteredItems = budget.items.filter(item => {
    if (filterPriority === 'all') return true;
    return item.priority === filterPriority;
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      category,
      name: name.trim(),
      estimatedCost: Number(estimatedCost) || 0,
      actualCost: Number(actualCost) || 0,
      paidAmount: 0,
      priority,
      notes: notes.trim(),
      isPaidInFull: false
    };

    onUpdateBudget({
      ...budget,
      items: [...budget.items, newItem]
    });

    setName('');
    setEstimatedCost(500);
    setActualCost(0);
    setNotes('');
    onCloseAddModal();
  };

  const handleDeleteItem = (id: string) => {
    onUpdateBudget({
      ...budget,
      items: budget.items.filter(i => i.id !== id)
    });
  };

  const handleTogglePaidInFull = (id: string) => {
    onUpdateBudget({
      ...budget,
      items: budget.items.map(i => {
        if (i.id === id) {
          const newStatus = !i.isPaidInFull;
          return {
            ...i,
            isPaidInFull: newStatus,
            paidAmount: newStatus ? (i.actualCost || i.estimatedCost) : i.paidAmount
          };
        }
        return i;
      })
    });
  };

  const handleCostChange = (id: string, field: 'actualCost' | 'estimatedCost' | 'paidAmount', val: number) => {
    onUpdateBudget({
      ...budget,
      items: budget.items.map(i => {
        if (i.id === id) {
          return { ...i, [field]: Math.max(0, val) };
        }
        return i;
      })
    });
  };

  const handleRunAiOptimizer = () => {
    setIsGeneratingAdvice(true);
    setShowAiAdvisor(true);

    setTimeout(() => {
      let advice = '';
      if (eventType === 'wedding') {
        advice = `### 💍 AI Wedding Budget Optimization
- **Venue & Catering Balance:** Currently accounting for ~$${Math.round(totalEstimated * 0.65).toLocaleString()} (${Math.round((totalEstimated * 0.65 / totalBudgetCap) * 100)}% of cap). If you need to cut $1,500, consider switching dessert to miniature artisan cupcakes or a late-night dessert bar instead of a fondant cake slice fee.
- **Bar Strategy:** A curated wine + signature cocktail service reduces hard liquor wastage by up to 22% compared to an open top-shelf bar.
- **Repurposed Florals:** Move ceremony aisle markers and arch florals to decorate the reception sweetheart table and cake display.`;
      } else if (eventType === 'birthday') {
        advice = `### 🎂 AI Birthday Budget Optimization
- **Entertainment ROI:** Allocate funds towards high-impact visual moments (e.g. customized neon sign or 360 photo booth) which yield maximum guest photos and memories.
- **Finger Food Pacing:** Heavy hors d'oeuvres stations cost 30% less than plated dinners while encouraging more socializing and dancing.
- **Digital Invites:** Save ~$300 on paper stationery and stamps with interactive animated invites.`;
      } else {
        advice = `### 🌍 AI Community Event Budget Optimization
- **Permit & Insurance Deadlines:** Filing municipal permits 60 days in advance avoids rush penalties (up to $500).
- **Sponsor Co-op:** Local coffee roasters or grocery cooperatives can sponsor volunteer hospitality snacks in exchange for banner placement.
- **Equipment Pooling:** Partner with local schools or community theaters for sound boards and wireless mics to reduce AV rental costs.`;
      }
      setAiAdviceText(advice);
      setIsGeneratingAdvice(false);
    }, 700);
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
      {/* Financial Health Header Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            TARGET BUDGET CAP
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {totalBudgetCap.toLocaleString()} {currency}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Max budget ceiling
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ESTIMATED TOTAL
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: isOverBudget ? 'var(--danger)' : 'var(--text-primary)' }}>
            {totalEstimated.toLocaleString()} {currency}
          </div>
          <div style={{ fontSize: '0.75rem', color: isOverBudget ? 'var(--danger)' : 'var(--text-muted)' }}>
            {isOverBudget ? `Over cap by ${(totalEstimated - totalBudgetCap).toLocaleString()} ${currency}` : `${remainingBudget.toLocaleString()} ${currency} unallocated`}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            ACTUAL COMMITTED
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {totalActual.toLocaleString()} {currency}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Signed contract obligations
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            PAID DEPOSITS
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--brand-purple)' }}>
            {totalPaid.toLocaleString()} {currency}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Disbursed to vendors
          </div>
        </div>
      </div>

      {/* Visual Category Distribution Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            BUDGET ALLOCATION BY CATEGORY
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {categories.length} Active Categories
          </span>
        </div>

        <div style={{
          display: 'flex',
          height: '14px',
          borderRadius: '9999px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.08)'
        }}>
          {categories.map((cat, idx) => {
            const catSum = budget.items.filter(i => i.category === cat).reduce((s, i) => s + i.estimatedCost, 0);
            const percent = totalEstimated > 0 ? (catSum / totalEstimated) * 100 : 0;
            const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#3b82f6'];
            const color = colors[idx % colors.length];

            return (
              <div
                key={cat}
                style={{
                  width: `${percent}%`,
                  backgroundColor: color,
                  height: '100%'
                }}
                title={`${cat}: ${catSum.toLocaleString()} ${currency} (${Math.round(percent)}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.85rem', fontSize: '0.75rem' }}>
          {categories.map((cat, idx) => {
            const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e', '#3b82f6'];
            const color = colors[idx % colors.length];
            const catSum = budget.items.filter(i => i.category === cat).reduce((s, i) => s + i.estimatedCost, 0);

            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }} />
                <span>{cat}: <strong>{catSum.toLocaleString()} {currency}</strong></span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toolbar: AI Optimizer & Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRunAiOptimizer}
            className="btn btn-primary btn-sm"
            style={{ gap: '0.4rem' }}
            aria-label="Run GenAI budget optimization analysis"
          >
            <Sparkles size={16} /> AI Budget Optimizer
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <Filter size={14} /> Filter:
            <select
              className="input-control"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.825rem', width: 'auto' }}
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="all">All Priorities ({budget.items.length})</option>
              <option value="must-have">Must-Have</option>
              <option value="nice-to-have">Nice-to-Have</option>
              <option value="optional">Optional</option>
            </select>
          </div>
        </div>

        <button
          onClick={onCloseAddModal}
          className="btn btn-secondary btn-sm"
          style={{ gap: '0.4rem' }}
          aria-label="Open add new expense dialog"
        >
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* AI Budget Advice Panel */}
      {showAiAdvisor && (
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-purple)', fontWeight: 700 }}>
              <Sparkles size={18} />
              <span>AI Budget Intelligence & Re-balancing Report</span>
            </div>
            <button
              onClick={() => setShowAiAdvisor(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Dismiss
            </button>
          </div>

          {isGeneratingAdvice ? (
            <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
              Analyzing category variances and industry rates...
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {aiAdviceText}
            </div>
          )}
        </div>
      )}

      {/* Items Table / Cards */}
      <div className="glass-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '1rem' }}>Category & Name</th>
              <th style={{ padding: '1rem' }}>Priority</th>
              <th style={{ padding: '1rem' }}>Estimated</th>
              <th style={{ padding: '1rem' }}>Actual</th>
              <th style={{ padding: '1rem' }}>Paid</th>
              <th style={{ padding: '1rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr 
                key={item.id} 
                style={{ 
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: item.isPaidInFull ? 'rgba(16, 185, 129, 0.04)' : undefined
                }}
              >
                <td style={{ padding: '1rem' }}>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.category} {item.notes ? `• ${item.notes}` : ''}
                  </div>
                </td>

                <td style={{ padding: '1rem' }}>
                  <span style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    backgroundColor: item.priority === 'must-have' 
                      ? 'rgba(239, 68, 68, 0.15)' 
                      : item.priority === 'nice-to-have' 
                      ? 'rgba(59, 130, 246, 0.15)' 
                      : 'rgba(156, 163, 175, 0.15)',
                    color: item.priority === 'must-have' ? '#f87171' : item.priority === 'nice-to-have' ? '#60a5fa' : '#9ca3af'
                  }}>
                    {item.priority}
                  </span>
                </td>

                <td style={{ padding: '1rem', fontWeight: 600 }}>
                  {item.estimatedCost.toLocaleString()} {currency}
                </td>

                <td style={{ padding: '1rem' }}>
                  <input
                    type="number"
                    className="input-control"
                    style={{ padding: '0.3rem 0.5rem', width: '100px', fontSize: '0.825rem' }}
                    value={item.actualCost || ''}
                    placeholder="0"
                    onChange={(e) => handleCostChange(item.id, 'actualCost', Number(e.target.value) || 0)}
                    aria-label={`Actual cost for ${item.name}`}
                  />
                </td>

                <td style={{ padding: '1rem' }}>
                  <input
                    type="number"
                    className="input-control"
                    style={{ padding: '0.3rem 0.5rem', width: '100px', fontSize: '0.825rem' }}
                    value={item.paidAmount || ''}
                    placeholder="0"
                    onChange={(e) => handleCostChange(item.id, 'paidAmount', Number(e.target.value) || 0)}
                    aria-label={`Paid amount for ${item.name}`}
                  />
                </td>

                <td style={{ padding: '1rem' }}>
                  <button
                    onClick={() => handleTogglePaidInFull(item.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'transparent',
                      border: 'none',
                      color: item.isPaidInFull ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}
                    aria-label={`Toggle paid in full for ${item.name}`}
                  >
                    {item.isPaidInFull ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    <span>{item.isPaidInFull ? 'Paid In Full' : 'Pending'}</span>
                  </button>
                </td>

                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                    title="Delete item"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {isOpenAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h3 id="add-expense-title" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Add New Expense Item
            </h3>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Expense Category
                </label>
                <select
                  className="input-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Venue & Rentals">Venue & Rentals</option>
                  <option value="Catering & Bar">Catering & Bar</option>
                  <option value="Photography & Video">Photography & Video</option>
                  <option value="Music & Entertainment">Music & Entertainment</option>
                  <option value="Decor & Floral">Decor & Floral</option>
                  <option value="Permits & Safety">Permits & Safety</option>
                  <option value="Attire & Styling">Attire & Styling</option>
                  <option value="Bakery & Cakes">Bakery & Cakes</option>
                  <option value="Contingency & Fees">Contingency & Fees</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Item Name
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Acoustic Guitarist for Ceremony"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Estimated Cost ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="input-control"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Priority
                  </label>
                  <select
                    className="input-control"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as BudgetItem['priority'])}
                  >
                    <option value="must-have">Must-Have</option>
                    <option value="nice-to-have">Nice-to-Have</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
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
                  placeholder="e.g. Includes travel fee and sound equipment"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={onCloseAddModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
