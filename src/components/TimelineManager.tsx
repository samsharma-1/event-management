import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Download, 
  Printer, 
  Trash2, 
  Tag
} from 'lucide-react';
import type { TimelineMilestone, TimelinePhase, EventDetails } from '../types/event';
import { downloadCalendarFile } from '../services/export/calendarExport';

interface TimelineManagerProps {
  timeline: TimelineMilestone[];
  eventDetails: EventDetails;
  onUpdateTimeline: (newTimeline: TimelineMilestone[]) => void;
  isOpenAddModal: boolean;
  onCloseAddModal: () => void;
}

export const TimelineManager: React.FC<TimelineManagerProps> = ({
  timeline,
  eventDetails,
  onUpdateTimeline,
  isOpenAddModal,
  onCloseAddModal
}) => {
  const [activePhase, setActivePhase] = useState<'all' | TimelinePhase>('all');

  // Form State for new milestone
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(eventDetails.date);
  const [time, setTime] = useState('16:00');
  const [phase, setPhase] = useState<TimelinePhase>('day-of-run-of-show');
  const [category, setCategory] = useState('General');

  // Filtered milestones
  const filtered = timeline.filter(m => {
    if (activePhase === 'all') return true;
    return m.phase === activePhase;
  });

  // Toggle complete
  const handleToggle = (id: string) => {
    onUpdateTimeline(
      timeline.map(m => m.id === id ? { ...m, isCompleted: !m.isCompleted } : m)
    );
  };

  const handleDelete = (id: string) => {
    onUpdateTimeline(timeline.filter(m => m.id !== id));
  };

  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMilestone: TimelineMilestone = {
      id: `t-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      dueDate,
      time: phase === 'day-of-run-of-show' ? time : undefined,
      phase,
      isCompleted: false,
      category: category.trim() || 'Custom'
    };

    onUpdateTimeline([...timeline, newMilestone]);
    setTitle('');
    setDescription('');
    onCloseAddModal();
  };

  const getPhaseBadge = (p: TimelinePhase) => {
    switch (p) {
      case 'months-before': return { label: 'Months Out', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'weeks-before': return { label: 'Weeks Out', color: '#c084fc', bg: 'rgba(139, 92, 246, 0.15)' };
      case 'days-before': return { label: 'Days Out', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'day-of-run-of-show': return { label: 'Day-Of Run of Show', color: '#fb7185', bg: 'rgba(244, 63, 94, 0.15)' };
    }
  };

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem 4rem 1rem' }}>
      {/* Header and Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
            Event Timeline & Run-of-Show
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Chronological roadmap from long-term vendor booking to minute-by-minute execution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => downloadCalendarFile(eventDetails, timeline)}
            className="btn btn-secondary btn-sm"
            aria-label="Export timeline to iCal"
          >
            <Download size={15} /> Export iCal
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
            aria-label="Print Day-of Run of Show"
          >
            <Printer size={15} /> Print Run-of-Show
          </button>

          <button
            onClick={onCloseAddModal}
            className="btn btn-primary btn-sm"
            aria-label="Add new milestone"
          >
            <Plus size={15} /> + Milestone
          </button>
        </div>
      </div>

      {/* Phase Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActivePhase('all')}
          className={`btn btn-sm ${activePhase === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All Milestones ({timeline.length})
        </button>
        <button
          onClick={() => setActivePhase('months-before')}
          className={`btn btn-sm ${activePhase === 'months-before' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Months Out ({timeline.filter(t => t.phase === 'months-before').length})
        </button>
        <button
          onClick={() => setActivePhase('weeks-before')}
          className={`btn btn-sm ${activePhase === 'weeks-before' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Weeks Out ({timeline.filter(t => t.phase === 'weeks-before').length})
        </button>
        <button
          onClick={() => setActivePhase('days-before')}
          className={`btn btn-sm ${activePhase === 'days-before' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Days Out ({timeline.filter(t => t.phase === 'days-before').length})
        </button>
        <button
          onClick={() => setActivePhase('day-of-run-of-show')}
          className={`btn btn-sm ${activePhase === 'day-of-run-of-show' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Day-of Run of Show ({timeline.filter(t => t.phase === 'day-of-run-of-show').length})
        </button>
      </div>

      {/* Milestone List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.map((item) => {
          const badge = getPhaseBadge(item.phase);
          const isDayOf = item.phase === 'day-of-run-of-show';

          return (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                borderLeft: isDayOf ? '4px solid #fb7185' : '4px solid var(--border-color)',
                opacity: item.isCompleted ? 0.75 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1 }}>
                <button
                  onClick={() => handleToggle(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: item.isCompleted ? '#10b981' : 'var(--text-muted)',
                    marginTop: '0.2rem'
                  }}
                  aria-label={`Mark ${item.title} as ${item.isCompleted ? 'incomplete' : 'complete'}`}
                >
                  {item.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '1.05rem',
                      textDecoration: item.isCompleted ? 'line-through' : 'none'
                    }}>
                      {item.title}
                    </span>

                    <span style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: badge.bg,
                      color: badge.color
                    }}>
                      {badge.label}
                    </span>

                    {item.category && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Tag size={12} /> {item.category}
                      </span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Calendar size={13} /> {item.dueDate}
                    </div>
                    {item.time && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#fb7185' }}>
                        <Clock size={13} /> {item.time}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(item.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                title="Delete milestone"
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Add Milestone Modal */}
      {isOpenAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-milestone-title">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h3 id="add-milestone-title" style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Add Timeline Milestone
            </h3>

            <form onSubmit={handleAddMilestone} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Milestone Title
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cocktail Hour & String Duo Starts"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Description / Action Details
                </label>
                <textarea
                  className="input-control"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Ushers direct guests to lawn terrace, signature drinks poured."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Phase
                  </label>
                  <select
                    className="input-control"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value as TimelinePhase)}
                  >
                    <option value="day-of-run-of-show">Day-of Run of Show</option>
                    <option value="days-before">Days Before</option>
                    <option value="weeks-before">Weeks Before</option>
                    <option value="months-before">Months Before</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    className="input-control"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {phase === 'day-of-run-of-show' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                    Execution Time (24h or HH:MM)
                  </label>
                  <input
                    type="time"
                    className="input-control"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                  Category Tag
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Run-of-Show, Catering, Ceremony, Media"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" onClick={onCloseAddModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
