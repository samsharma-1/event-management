import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelineManager } from './components/TimelineManager';
import { VendorTracker } from './components/VendorTracker';
import { IdeaLab } from './components/IdeaLab';
import { AIChatAssistant } from './components/AIChatAssistant';
import { AccessibilityControls } from './components/AccessibilityControls';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import type { EventPlan, BudgetSummary, TimelineMilestone, VendorItem, PersonalizedIdea, BudgetItem, RegionConfig } from './types/event';
import { SUPPORTED_REGIONS } from './types/event';
import { loadAllEvents, saveAllEvents, getActiveEventId, setActiveEventId, saveSingleEvent } from './services/storage/eventStorage';

// Lazy-load heavier modal components to reduce initial bundle chunk size
const EventWizard = lazy(() => import('./components/EventWizard').then(m => ({ default: m.EventWizard })));
const SecurityAuditModal = lazy(() => import('./components/SecurityAuditModal').then(m => ({ default: m.SecurityAuditModal })));

function createMilestoneFromIdea(title: string, desc: string, dueDate: string): TimelineMilestone {
  return {
    id: `t-${Date.now()}`,
    title,
    description: desc,
    dueDate,
    phase: 'weeks-before',
    isCompleted: false,
    category: 'Creative Ideas'
  };
}

function createExpenseFromIdea(name: string, cost: number): BudgetItem {
  return {
    id: `b-${Date.now()}`,
    category: 'Personalized Ideas',
    name,
    estimatedCost: cost || 250,
    actualCost: 0,
    paidAmount: 0,
    priority: 'nice-to-have',
    isPaidInFull: false
  };
}

export const App: React.FC = () => {
  // State initialized lazily from persistent storage
  const [events, setEvents] = useState<EventPlan[]>(() => loadAllEvents());
  const [activeId, setActiveId] = useState<string>(() => {
    const initialActive = getActiveEventId();
    const loaded = loadAllEvents();
    if (loaded.some(e => e.details.id === initialActive)) {
      return initialActive;
    }
    return loaded[0]?.details.id || 'demo-wedding-1';
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas'>('overview');
  
  // Theme (default to White Glassmorphism) & Localization
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [baseFontSize, setBaseFontSize] = useState<number>(16);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [a11yAnnouncement, setA11yAnnouncement] = useState<string>('');

  // Modals
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isAccessibilityModalOpen, setIsAccessibilityModalOpen] = useState(false);
  const [isAddBudgetItemModalOpen, setIsAddBudgetItemModalOpen] = useState(false);
  const [isAddMilestoneModalOpen, setIsAddMilestoneModalOpen] = useState(false);

  // Update theme and contrast attributes on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    document.documentElement.style.fontSize = `${baseFontSize}px`;
  }, [theme, highContrast, baseFontSize]);

  // Current active event derived purely without effect cascades
  const currentPlan = useMemo(() => {
    return events.find(e => e.details.id === activeId) || events[0];
  }, [events, activeId]);

  // Region configuration derived directly from active event currency
  const currentRegion = useMemo<RegionConfig>(() => {
    if (currentPlan) {
      const match = SUPPORTED_REGIONS.find(r => r.currency === currentPlan.details.currency);
      if (match) return match;
    }
    return SUPPORTED_REGIONS[0];
  }, [currentPlan]);

  const handleSelectRegion = (region: RegionConfig) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = {
      ...currentPlan,
      details: { ...currentPlan.details, currency: region.currency },
      budget: { ...currentPlan.budget, currency: region.currency }
    };
    saveSingleEvent(updatedPlan);
    setEvents(prev => prev.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement(`Region switched to ${region.country} (${region.currency} ${region.symbol})`);
  };

  const handleToggleOrientation = () => {
    setOrientation(prev => {
      const next = prev === 'landscape' ? 'portrait' : 'landscape';
      setA11yAnnouncement(`Layout orientation switched to ${next} mode`);
      return next;
    });
  };

  const handleSelectEvent = (id: string) => {
    setActiveId(id);
    setActiveEventId(id);
    setA11yAnnouncement(`Switched active event to ${events.find(e => e.details.id === id)?.details.title}`);
  };

  const handlePlanCreated = (newPlan: EventPlan) => {
    const updated = [newPlan, ...events];
    setEvents(updated);
    setActiveId(newPlan.details.id);
    saveAllEvents(updated);
    setActiveEventId(newPlan.details.id);
    setA11yAnnouncement(`New event generated: ${newPlan.details.title}`);
  };

  const handleUpdateBudget = (updatedBudget: BudgetSummary) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, budget: updatedBudget };
    saveSingleEvent(updatedPlan);
    setEvents(prev => prev.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
  };

  const handleUpdateTimeline = (updatedTimeline: TimelineMilestone[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, timeline: updatedTimeline };
    saveSingleEvent(updatedPlan);
    setEvents(prev => prev.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
  };

  const handleUpdateVendors = (updatedVendors: VendorItem[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, vendors: updatedVendors };
    saveSingleEvent(updatedPlan);
    setEvents(prev => prev.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
  };

  const handleUpdateIdeas = (updatedIdeas: PersonalizedIdea[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, ideas: updatedIdeas };
    saveSingleEvent(updatedPlan);
    setEvents(prev => prev.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
  };

  const handleToggleMilestone = (milestoneId: string) => {
    if (!currentPlan) return;
    const updatedTimeline = currentPlan.timeline.map(m => 
      m.id === milestoneId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    handleUpdateTimeline(updatedTimeline);
    const toggled = updatedTimeline.find(m => m.id === milestoneId);
    setA11yAnnouncement(`Milestone "${toggled?.title}" marked as ${toggled?.isCompleted ? 'completed' : 'pending'}`);
  };

  const handleAddMilestoneFromIdea = (title: string, desc: string) => {
    if (!currentPlan) return;
    const newMilestone = createMilestoneFromIdea(title, desc, currentPlan.details.date);
    const updated = [...currentPlan.timeline, newMilestone];
    handleUpdateTimeline(updated);
    setA11yAnnouncement(`Milestone added: ${title}`);
  };

  const handleAddExpenseFromIdea = (name: string, cost: number) => {
    if (!currentPlan) return;
    const newExpense = createExpenseFromIdea(name, cost);
    const updatedItems = [...currentPlan.budget.items, newExpense];
    handleUpdateBudget({ ...currentPlan.budget, items: updatedItems });
    setA11yAnnouncement(`Expense added: ${name}`);
  };

  if (!currentPlan) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading PlanVibe AI Workspace...</p>
      </div>
    );
  }

  return (
    <div className={`app-container layout-${orientation} ${reducedMotion ? 'reduced-motion' : ''}`}>
      {/* Simulated Device Notch when in Portrait Mode */}
      {orientation === 'portrait' && (
        <div className="portrait-device-notch" title="Simulated Portrait Screen" />
      )}

      {/* Screen Reader ARIA Live Region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}
      >
        {a11yAnnouncement}
      </div>

      {/* Top Universal Navigation Bar */}
      <Navbar
        events={events}
        activeEvent={currentPlan}
        onSelectEvent={handleSelectEvent}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        currentRegion={currentRegion}
        onSelectRegion={handleSelectRegion}
        orientation={orientation}
        onToggleOrientation={handleToggleOrientation}
      />

      {/* Main Responsive Workspace */}
      <main style={{ maxWidth: '1360px', margin: '0 auto', padding: '0 1rem' }}>
        {activeTab === 'overview' && (
          <Dashboard
            plan={currentPlan}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onToggleMilestone={handleToggleMilestone}
            onOpenNewMilestoneModal={() => {
              setActiveTab('timeline');
              setIsAddMilestoneModalOpen(true);
            }}
            onOpenNewBudgetItemModal={() => {
              setActiveTab('budget');
              setIsAddBudgetItemModalOpen(true);
            }}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetPlanner
            budget={currentPlan.budget}
            totalBudgetCap={currentPlan.details.totalBudget}
            currency={currentPlan.details.currency}
            eventType={currentPlan.details.type}
            onUpdateBudget={handleUpdateBudget}
            isOpenAddModal={isAddBudgetItemModalOpen}
            onCloseAddModal={() => setIsAddBudgetItemModalOpen(false)}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineManager
            timeline={currentPlan.timeline}
            eventDetails={currentPlan.details}
            onUpdateTimeline={handleUpdateTimeline}
            isOpenAddModal={isAddMilestoneModalOpen}
            onCloseAddModal={() => setIsAddMilestoneModalOpen(false)}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorTracker
            vendors={currentPlan.vendors}
            currency={currentPlan.details.currency}
            eventType={currentPlan.details.type}
            onUpdateVendors={handleUpdateVendors}
          />
        )}

        {activeTab === 'ideas' && (
          <IdeaLab
            ideas={currentPlan.ideas}
            eventDetails={currentPlan.details}
            onUpdateIdeas={handleUpdateIdeas}
            onAddMilestone={handleAddMilestoneFromIdea}
            onAddBudgetItem={handleAddExpenseFromIdea}
          />
        )}
      </main>

      {/* Global Footer with Copyright Statement & System Status */}
      <Footer
        currentRegion={currentRegion}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
      />

      {/* Persistent AI Chat Co-Planner Floating Assistant */}
      <AIChatAssistant event={currentPlan.details} />

      {/* Modals wrapped in Suspense for lazy loading */}
      {isWizardOpen && (
        <Suspense fallback={null}>
          <EventWizard
            isOpen={isWizardOpen}
            onClose={() => setIsWizardOpen(false)}
            onPlanCreated={handlePlanCreated}
          />
        </Suspense>
      )}

      {isSecurityModalOpen && (
        <Suspense fallback={null}>
          <SecurityAuditModal
            isOpen={isSecurityModalOpen}
            onClose={() => setIsSecurityModalOpen(false)}
          />
        </Suspense>
      )}

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onKeyUpdated={() => {
          setA11yAnnouncement('AI Engine preference saved.');
        }}
      />

      <AccessibilityControls
        isOpen={isAccessibilityModalOpen}
        onClose={() => setIsAccessibilityModalOpen(false)}
        baseFontSize={baseFontSize}
        onFontSizeChange={setBaseFontSize}
        highContrast={highContrast}
        onToggleHighContrast={() => setHighContrast(prev => !prev)}
        reducedMotion={reducedMotion}
        onToggleReducedMotion={() => setReducedMotion(prev => !prev)}
        orientation={orientation}
        onToggleOrientation={handleToggleOrientation}
      />
    </div>
  );
};

export default App;
