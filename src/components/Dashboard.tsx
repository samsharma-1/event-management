import React from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Download, 
  Printer, 
  AlertTriangle,
  TrendingUp,
  Tag
} from 'lucide-react';
import type { EventPlan } from '../types/event';
import { downloadCalendarFile } from '../services/export/calendarExport';

interface DashboardProps {
  plan: EventPlan;
  activeTab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas';
  onTabChange: (tab: 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas') => void;
  onToggleMilestone: (id: string) => void;
  onOpenNewMilestoneModal: () => void;
  onOpenNewBudgetItemModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  plan,
  activeTab,
  onTabChange,
  onToggleMilestone,
  onOpenNewMilestoneModal,
  onOpenNewBudgetItemModal
}) => {
  const { details, budget, timeline, vendors, ideas } = plan;

  // Calculate days remaining
  const eventDate = new Date(details.date);
  const now = new Date();
  const diffTime = eventDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Budget calculations
  const totalEstimated = budget.items.reduce((sum, item) => sum + item.estimatedCost, 0);
  const totalActual = budget.items.reduce((sum, item) => sum + item.actualCost, 0);
  const totalPaid = budget.items.reduce((sum, item) => sum + item.paidAmount, 0);
  const budgetUtilization = Math.round((totalEstimated / (details.totalBudget || 1)) * 100);
  const isOverBudget = totalEstimated > details.totalBudget;

  // Timeline calculations
  const completedMilestones = timeline.filter(m => m.isCompleted).length;
  const timelineProgress = Math.round((completedMilestones / Math.max(1, timeline.length)) * 100);
  const nextPendingMilestone = timeline.find(m => !m.isCompleted);

  // Vendor calculations
  const bookedVendors = vendors.filter(v => ['contract-signed', 'deposit-paid', 'confirmed', 'completed'].includes(v.status)).length;
  const vendorProgress = Math.round((bookedVendors / Math.max(1, vendors.length)) * 100);

  // Event type theme gradient & badge
  const getBadgeClass = () => {
    switch (details.type) {
      case 'wedding': return 'badge-wedding';
      case 'birthday': return 'badge-birthday';
      case 'community': return 'badge-community';
      default: return 'badge-ai';
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
      {/* HERO BANNER */}
      <section 
        className="glass-panel" 
        style={{
          padding: '2rem',
          marginBottom: '1.5rem',
          position: 'relative',
          overflow: 'hidden',
          background: details.type === 'wedding' 
            ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 228, 230, 0.7) 50%, rgba(255, 255, 255, 0.9) 100%)'
            : details.type === 'birthday'
            ? 'linear-gradient(135deg, rgba(245, 243, 255, 0.95) 0%, rgba(237, 233, 254, 0.7) 50%, rgba(255, 255, 255, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(209, 250, 229, 0.7) 50%, rgba(255, 255, 255, 0.9) 100%)'
        }}
        aria-label="Event summary banner"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ flex: '1 1 500px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <span className={`badge ${getBadgeClass()}`}>
                {details.type.toUpperCase()} MASTER PLAN
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Created: {new Date(details.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h1 style={{ fontSize: '2.25rem', marginBottom: '0.65rem' }}>
              {details.title}
            </h1>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} />
                <span>{new Date(details.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} />
                <span>{details.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={16} />
                <span>{details.guestCount} Guests</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={16} />
                <span>Budget: {details.totalBudget.toLocaleString()} {details.currency}</span>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.75)',
              border: '1px solid var(--border-color)',
              fontSize: '0.85rem',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <Tag size={14} style={{ color: 'var(--brand-purple)' }} />
              <span style={{ fontWeight: 600 }}>Vibe:</span>
              <span>{details.vibe}</span>
            </div>
          </div>

          {/* Countdown Clock Widget */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.75rem',
            textAlign: 'center',
            minWidth: '180px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              lineHeight: 1,
              color: diffDays > 0 ? 'var(--text-primary)' : '#10b981'
            }}>
              {diffDays > 0 ? diffDays : diffDays === 0 ? 'TODAY' : 'PAST'}
            </div>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {diffDays > 0 ? 'Days Until Celebration' : diffDays === 0 ? 'Event In Progress!' : 'Event Concluded'}
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button 
            onClick={() => downloadCalendarFile(details, timeline)}
            className="btn btn-secondary btn-sm"
            aria-label="Download timeline as iCal file"
          >
            <Download size={14} /> Export iCal Calendar
          </button>

          <button 
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            aria-label="Print run of show and budget"
          >
            <Printer size={14} /> Print Run-of-Show
          </button>

          <button 
            onClick={onOpenNewMilestoneModal}
            className="btn btn-secondary btn-sm"
            aria-label="Add new timeline milestone"
          >
            <Clock size={14} /> + Milestone
          </button>

          <button 
            onClick={onOpenNewBudgetItemModal}
            className="btn btn-secondary btn-sm"
            aria-label="Add new expense to budget"
          >
            <DollarSign size={14} /> + Expense
          </button>
        </div>
      </section>

      {/* NAVIGATION TABS */}
      <nav 
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0.5rem',
          overflowX: 'auto'
        }}
        role="tablist"
        aria-label="Event Management Views"
      >
        <button
          role="tab"
          aria-selected={activeTab === 'overview'}
          onClick={() => onTabChange('overview')}
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <TrendingUp size={16} /> Overview
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'budget'}
          onClick={() => onTabChange('budget')}
          className={`btn ${activeTab === 'budget' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <DollarSign size={16} /> Budget Planner ({budget.items.length})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'timeline'}
          onClick={() => onTabChange('timeline')}
          className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Clock size={16} /> Timeline & Run-of-Show ({timeline.length})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'vendors'}
          onClick={() => onTabChange('vendors')}
          className={`btn ${activeTab === 'vendors' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <CheckCircle2 size={16} /> Vendor Checklists ({vendors.length})
        </button>

        <button
          role="tab"
          aria-selected={activeTab === 'ideas'}
          onClick={() => onTabChange('ideas')}
          className={`btn ${activeTab === 'ideas' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Sparkles size={16} /> Personalized Ideas ({ideas.length})
        </button>
      </nav>

      {/* OVERVIEW TAB CONTENT: 4 SUMMARY CARDS & NEXT ACTION */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 4 Metric Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            {/* Card 1: Budget Health */}
            <div 
              className="glass-panel" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => onTabChange('budget')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') onTabChange('budget'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  BUDGET HEALTH
                </span>
                <DollarSign size={18} style={{ color: isOverBudget ? 'var(--danger)' : 'var(--success)' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                {totalEstimated.toLocaleString()} {details.currency}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Allocated of {details.totalBudget.toLocaleString()} {details.currency} ({budgetUtilization}%) • Committed: {totalActual.toLocaleString()} {details.currency}
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, budgetUtilization)}%`,
                  background: isOverBudget ? 'var(--danger)' : 'var(--primary-gradient)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              {isOverBudget && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                  <AlertTriangle size={14} /> Over allocated by {(totalEstimated - details.totalBudget).toLocaleString()} {details.currency}
                </div>
              )}
            </div>

            {/* Card 2: Timeline Velocity */}
            <div 
              className="glass-panel" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => onTabChange('timeline')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') onTabChange('timeline'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  TIMELINE VELOCITY
                </span>
                <Clock size={18} style={{ color: 'var(--brand-purple)' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                {completedMilestones} / {timeline.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Milestones completed ({timelineProgress}%)
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${timelineProgress}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #3b82f6)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Card 3: Vendor Booking Status */}
            <div 
              className="glass-panel" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => onTabChange('vendors')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') onTabChange('vendors'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  VENDOR PIPELINE
                </span>
                <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                {bookedVendors} / {vendors.length} Booked
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Deposits paid: {totalPaid.toLocaleString()} {details.currency}
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${vendorProgress}%`,
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>

            {/* Card 4: Curated Inspiration */}
            <div 
              className="glass-panel" 
              style={{ padding: '1.25rem', cursor: 'pointer' }}
              onClick={() => onTabChange('ideas')}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => { if (e.key === 'Enter') onTabChange('ideas'); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  PERSONALIZED IDEAS
                </span>
                <Sparkles size={18} style={{ color: 'var(--brand-pink)' }} />
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 800 }}>
                {ideas.length} Concepts
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Themes, icebreakers, decor & speeches
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem' }}>
                {ideas.flatMap(i => i.moodColors || []).slice(0, 5).map((hex, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: hex,
                      border: '1px solid rgba(255, 255, 255, 0.2)'
                    }}
                    title={hex}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* UPCOMING ACTION FOCUS */}
          {nextPendingMilestone && (
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-purple)'
                }}>
                  <Clock size={22} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    PRIORITY NEXT ACTION
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {nextPendingMilestone.title}
                  </div>
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                    Target: {nextPendingMilestone.dueDate} {nextPendingMilestone.time ? `at ${nextPendingMilestone.time}` : ''} • {nextPendingMilestone.description}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onToggleMilestone(nextPendingMilestone.id)}
                className="btn btn-secondary btn-sm"
                aria-label={`Mark ${nextPendingMilestone.title} as completed`}
              >
                <CheckCircle2 size={16} /> Mark Complete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
