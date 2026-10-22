import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { BudgetPlanner } from './components/BudgetPlanner';
import { TimelineManager } from './components/TimelineManager';
import { VendorTracker } from './components/VendorTracker';
import { IdeaLab } from './components/IdeaLab';
import { EventWizard } from './components/EventWizard';
import { AIChatAssistant } from './components/AIChatAssistant';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { AccessibilityControls } from './components/AccessibilityControls';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Footer } from './components/Footer';
import type { EventPlan, BudgetSummary, TimelineMilestone, VendorItem, PersonalizedIdea, BudgetItem, RegionConfig } from './types/event';
import { SUPPORTED_REGIONS } from './types/event';
import { loadAllEvents, saveAllEvents, getActiveEventId, setActiveEventId, saveSingleEvent } from './services/storage/eventStorage';

export const App: React.FC = () => {
  // State
  const [events, setEvents] = useState<EventPlan[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas'>('overview');
  
  // Theme (default to White Glassmorphism) & Localization
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [currentRegion, setCurrentRegion] = useState<RegionConfig>(SUPPORTED_REGIONS[0]); // India - INR ₹ by default
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

  // Load initial events from storage
  useEffect(() => {
    const loaded = loadAllEvents();
    setEvents(loaded);
    const initialActive = getActiveEventId();
    if (loaded.some(e => e.details.id === initialActive)) {
      setActiveId(initialActive);
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].details.id);
    }
  }, []);

  // Update theme and contrast attributes on root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-contrast', highContrast ? 'high' : 'normal');
    document.documentElement.style.fontSize = `${baseFontSize}px`;
  }, [theme, highContrast, baseFontSize]);

  // Current active event
  const currentPlan = events.find(e => e.details.id === activeId) || events[0];

  // Sync region config with active event's currency
  useEffect(() => {
    if (currentPlan) {
      const match = SUPPORTED_REGIONS.find(r => r.currency === currentPlan.details.currency);
      if (match) setCurrentRegion(match);
    }
  }, [currentPlan?.details.currency]);

  const handleSelectRegion = (region: RegionConfig) => {
    setCurrentRegion(region);
    if (!currentPlan) return;
    const updatedPlan: EventPlan = {
      ...currentPlan,
      details: { ...currentPlan.details, currency: region.currency },
      budget: { ...currentPlan.budget, currency: region.currency }
    };
    saveSingleEvent(updatedPlan);
    setEvents(events.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement(`Region switched to ${region.country} (${region.currency} ${region.symbol})`);
  };

  const handleSelectEvent = (id: string) => {
    setActiveId(id);
    setActiveEventId(id);
    setA11yAnnouncement(`Switched active event to ${events.find(e => e.details.id === id)?.details.title}`);
  };

  const handlePlanCreated = (newPlan: EventPlan) => {
    const updated = [newPlan, ...events];
    setEvents(updated);
    saveAllEvents(updated);
    setActiveId(newPlan.details.id);
    setActiveEventId(newPlan.details.id);
    setActiveTab('overview');
    setA11yAnnouncement(`Successfully generated new master event plan for ${newPlan.details.title}`);
  };

  const handleUpdateBudget = (newBudget: BudgetSummary) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, budget: newBudget };
    saveSingleEvent(updatedPlan);
    setEvents(events.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement('Budget updated.');
  };

  const handleUpdateTimeline = (newTimeline: TimelineMilestone[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, timeline: newTimeline };
    saveSingleEvent(updatedPlan);
    setEvents(events.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement('Timeline milestones updated.');
  };

  const handleToggleMilestone = (id: string) => {
    if (!currentPlan) return;
    const updatedTimeline = currentPlan.timeline.map(m => 
      m.id === id ? { ...m, isCompleted: !m.isCompleted } : m
    );
    handleUpdateTimeline(updatedTimeline);
  };

  const handleUpdateVendors = (newVendors: VendorItem[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, vendors: newVendors };
    saveSingleEvent(updatedPlan);
    setEvents(events.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement('Vendor list updated.');
  };

  const handleUpdateIdeas = (newIdeas: PersonalizedIdea[]) => {
    if (!currentPlan) return;
    const updatedPlan: EventPlan = { ...currentPlan, ideas: newIdeas };
    saveSingleEvent(updatedPlan);
    setEvents(events.map(e => e.details.id === updatedPlan.details.id ? updatedPlan : e));
    setA11yAnnouncement('Ideas updated.');
  };

  const handleAddMilestoneFromIdea = (title: string, desc: string) => {
    if (!currentPlan) return;
    const newM: TimelineMilestone = {
      id: `t-idea-${Date.now()}`,
      title,
      description: desc,
      dueDate: currentPlan.details.date,
      phase: 'day-of-run-of-show',
      isCompleted: false,
      category: 'Inspiration'
    };
    handleUpdateTimeline([...currentPlan.timeline, newM]);
  };

  const handleAddExpenseFromIdea = (name: string, cost: number) => {
    if (!currentPlan) return;
    const newItem: BudgetItem = {
      id: `b-idea-${Date.now()}`,
      category: 'Decor & Experiences',
      name,
      estimatedCost: cost,
      actualCost: 0,
      paidAmount: 0,
      priority: 'nice-to-have',
      notes: 'Added from AI Idea Lab',
      isPaidInFull: false
    };
    handleUpdateBudget({
      ...currentPlan.budget,
      items: [...currentPlan.budget.items, newItem]
    });
  };

  if (!currentPlan) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        Loading PlanVibe AI Studio...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Screen Reader Live Announcements (WCAG) */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          margin: '-1px',
          padding: 0,
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          border: 0
        }}
      >
        {a11yAnnouncement}
      </div>

      {/* Primary Navigation */}
      <Navbar
        events={events}
        activeEvent={currentPlan}
        onSelectEvent={handleSelectEvent}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenAccessibilityModal={() => setIsAccessibilityModalOpen(true)}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        currentRegion={currentRegion}
        onSelectRegion={handleSelectRegion}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1 }}>
        {/* Master Dashboard Overview */}
        <Dashboard
          plan={currentPlan}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleMilestone={handleToggleMilestone}
          onOpenNewMilestoneModal={() => setIsAddMilestoneModalOpen(true)}
          onOpenNewBudgetItemModal={() => setIsAddBudgetItemModalOpen(true)}
        />

        {/* Tab-specific Views */}
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

      {/* Modals */}
      <EventWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onPlanCreated={handlePlanCreated}
      />

      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

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
      />
    </div>
  );
};

export default App;
