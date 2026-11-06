/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { ChecklistExecutionView } from './components/ChecklistExecutionView';
import { ReportsView } from './components/ReportsView';
import { AlertsView } from './components/AlertsView';
import { SettingsModal } from './components/SettingsModal';
import { CrucialAlertModal } from './components/CrucialAlertModal';
import { storageService } from './services/storageService';
import { authService, AuthorizedUser } from './services/authService';
import { ChecklistItem, InspectionRecord, NotificationSettings, CrucialAlert } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'checklist' | 'reports' | 'alerts'>('dashboard');
  const [items, setItems] = useState<ChecklistItem[]>(() => storageService.getItems());
  const [inspections, setInspections] = useState<InspectionRecord[]>(() => storageService.getInspections());
  const [alerts, setAlerts] = useState<CrucialAlert[]>(() => storageService.getAlerts());
  const [settings, setSettings] = useState<NotificationSettings>(() => storageService.getSettings());
  const [currentUser, setCurrentUser] = useState<AuthorizedUser>(() => authService.getCurrentUser());

  // Deep linking for reports
  const [selectedReportId, setSelectedReportId] = useState<string>('');

  // Crucial Alert Popup state
  const [activeCrucialPopup, setActiveCrucialPopup] = useState<CrucialAlert | null>(null);

  // Settings modal state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Handle switching active authenticated user / role
  const handleSwitchUser = (email: string) => {
    const updated = authService.switchUserByEmail(email);
    setCurrentUser(updated);
  };

  // Save checklist items
  const handleSaveItems = (newItems: ChecklistItem[]) => {
    if (!currentUser.isSuperuser) return;
    setItems(newItems);
    storageService.saveItems(newItems);
  };

  // Reset items to default
  const handleResetToDefault = () => {
    if (!currentUser.isSuperuser) return;
    const defaultItems = storageService.resetItemsToDefault();
    setItems(defaultItems);
  };

  // Save Inspection
  const handleSaveInspection = (record: InspectionRecord) => {
    if (!currentUser.isSuperuser) return;
    storageService.saveInspection(record);
    const updatedInspections = storageService.getInspections();
    setInspections(updatedInspections);
    setSelectedReportId(record.id);
  };

  // Update existing Inspection (e.g., manager verification)
  const handleUpdateInspection = (record: InspectionRecord) => {
    if (!currentUser.isSuperuser) return;
    storageService.saveInspection(record);
    const updatedInspections = storageService.getInspections();
    setInspections(updatedInspections);
  };

  // Trigger Crucial Alert
  const handleTriggerCrucialAlert = (alert: CrucialAlert) => {
    storageService.addAlert(alert);
    setAlerts(storageService.getAlerts());
    setActiveCrucialPopup(alert);
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = (id: string) => {
    if (!currentUser.isSuperuser) return;
    storageService.acknowledgeAlert(id);
    setAlerts(storageService.getAlerts());
  };

  // Clear all alerts
  const handleClearAllAlerts = () => {
    if (!currentUser.isSuperuser) return;
    storageService.clearAllAlerts();
    setAlerts([]);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: NotificationSettings) => {
    if (!currentUser.isSuperuser) return;
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
  };

  // Navigation callbacks
  const handleViewReport = (id: string) => {
    setSelectedReportId(id);
    setActiveTab('reports');
  };

  const unreadAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Bar with Logo & IT Daily Checklist Title */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadAlertsCount={unreadAlertsCount}
        openSettings={() => setIsSettingsOpen(true)}
        onNewChecklistClick={() => setActiveTab('checklist')}
        logoUrl={settings.logoUrl}
        propertyName={settings.propertyName}
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            inspections={inspections}
            items={items}
            activeAlerts={alerts.filter((a) => !a.acknowledged)}
            settings={settings}
            currentUser={currentUser}
            onStartChecklist={() => setActiveTab('checklist')}
            onViewReport={handleViewReport}
            onAcknowledgeAlert={handleAcknowledgeAlert}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistExecutionView
            items={items}
            settings={settings}
            currentUser={currentUser}
            onSaveInspection={handleSaveInspection}
            onTriggerCrucialAlert={handleTriggerCrucialAlert}
            onUpdateItems={handleSaveItems}
            onResetItemsToDefault={handleResetToDefault}
            onViewReport={handleViewReport}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            inspections={inspections}
            items={items}
            settings={settings}
            currentUser={currentUser}
            selectedInspectionId={selectedReportId}
            onUpdateInspection={handleUpdateInspection}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertsView
            alerts={alerts}
            settings={settings}
            currentUser={currentUser}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onClearAllAlerts={handleClearAllAlerts}
          />
        )}
      </main>

      {/* Crucial Alert Popup */}
      <CrucialAlertModal
        alert={activeCrucialPopup}
        settings={settings}
        onClose={() => setActiveCrucialPopup(null)}
        onAcknowledge={handleAcknowledgeAlert}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {settings.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-5 max-w-[80px] object-contain opacity-75"
              />
            )}
            <span className="font-semibold text-slate-700">{settings.propertyName}</span>
            <span aria-hidden="true">·</span>
            <span>IT Operational Standards & Daily Compliance</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>IT Daily Checklist</span>
            <span aria-hidden="true">·</span>
            <span>Production Release</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
