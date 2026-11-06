import { ChecklistItem, InspectionRecord, NotificationSettings, CrucialAlert, InspectorProfile } from '../types';
import { DEFAULT_CHECKLIST_ITEMS } from '../data/defaultChecklist';

const STORAGE_KEYS = {
  ITEMS: 'it_checklist_items_v2',
  INSPECTIONS: 'it_checklist_inspections_v2',
  SETTINGS: 'it_checklist_settings_v2',
  ALERTS: 'it_checklist_alerts_v2',
  ACTIVE_DRAFT: 'it_checklist_active_draft_v2',
  CUSTOM_INSPECTORS: 'it_checklist_custom_inspectors_v2',
};

export const FIXED_INSPECTORS: InspectorProfile[] = [
  {
    id: 'fixed-leonardo',
    name: 'Leonardo Bobby',
    role: 'Cluster IT Manager',
    email: 'sentulitm@alanahotels.com',
    isCustom: false,
  },
  {
    id: 'fixed-aditya',
    name: 'Muchammed Aditya',
    role: 'IT Coordinator',
    email: 'sentulitc@alanahotels.com',
    isCustom: false,
  },
];

const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 48" fill="none"><rect width="48" height="48" rx="10" fill="%230F172A"/><path d="M14 24L20 30L34 16" stroke="%2334D399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><text x="56" y="24" fill="%230F172A" font-family="system-ui, sans-serif" font-size="14" font-weight="800" letter-spacing="-0.3">THE ALANA</text><text x="56" y="38" fill="%2364748B" font-family="system-ui, sans-serif" font-size="9" font-weight="600" letter-spacing="0.5">HOTEL &amp; CONFERENCE</text></svg>`;

const DEFAULT_SETTINGS: NotificationSettings = {
  soundAlertEnabled: true,
  whatsAppRecipient: '+6281234567890',
  managerEmail: 'sentulITM@alanahotels.com',
  webhookUrl: '',
  autoAlertOnCrucial: true,
  propertyName: 'The Alana Hotel & Conference Center Sentul',
  logoUrl: DEFAULT_LOGO_SVG,
};

// Seed realistic historical data in English
function generateSeedInspections(items: ChecklistItem[]): InspectionRecord[] {
  const seedRecords: InspectionRecord[] = [];
  const today = new Date();

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  // 1. Yesterday (Completed, 96.2% score)
  const d1 = new Date(today);
  d1.setDate(d1.getDate() - 1);
  const answers1: Record<string, any> = {};
  let totalPts1 = 0;
  let earnedPts1 = 0;

  items.forEach((item) => {
    totalPts1 += item.points;
    if (item.id === 'item-srv-04') {
      answers1[item.id] = {
        itemId: item.id,
        status: 'not_comply',
        notes: 'Physical visitor logbook sheet ran out of blank rows; new sheets being printed.',
        severity: 'low',
        actionPlan: 'Replenish blank visitor logbook sheets at security station.',
      };
    } else {
      earnedPts1 += item.points;
      answers1[item.id] = {
        itemId: item.id,
        status: 'comply',
        notes: 'Verified nominal parameters.',
      };
    }
  });

  seedRecords.push({
    id: `insp-${formatDate(d1)}-morning`,
    inspectionNumber: `ITDC-${formatDate(d1).replace(/-/g, '')}-001`,
    date: formatDate(d1),
    inspectionTime: '08:30:24',
    shift: 'Morning Shift',
    inspectorName: 'Muchammed Aditya',
    inspectorRole: 'IT Coordinator',
    propertyLocation: 'The Alana Hotel Sentul',
    answers: answers1,
    status: 'completed',
    totalPossiblePoints: totalPts1,
    earnedPoints: earnedPts1,
    compliancePercentage: Math.round((earnedPts1 / totalPts1) * 1000) / 10,
    crucialViolationsCount: 0,
    notes: 'Overall server room and PMS core infrastructure fully operational during morning shift.',
    createdAt: `${formatDate(d1)}T08:30:00.000Z`,
    updatedAt: `${formatDate(d1)}T09:15:00.000Z`,
    verifiedBy: 'Leonardo Bobby (Cluster IT Manager)',
  });

  // 2. 2 days ago (Completed, 100% score)
  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 2);
  const answers2: Record<string, any> = {};
  let totalPts2 = 0;
  let earnedPts2 = 0;

  items.forEach((item) => {
    totalPts2 += item.points;
    earnedPts2 += item.points;
    answers2[item.id] = {
      itemId: item.id,
      status: 'comply',
      notes: 'All checks passed standard parameters.',
    };
  });

  seedRecords.push({
    id: `insp-${formatDate(d2)}-morning`,
    inspectionNumber: `ITDC-${formatDate(d2).replace(/-/g, '')}-001`,
    date: formatDate(d2),
    inspectionTime: '08:15:40',
    shift: 'All Day Routine',
    inspectorName: 'Leonardo Bobby',
    inspectorRole: 'Cluster IT Manager',
    propertyLocation: 'The Alana Hotel Sentul',
    answers: answers2,
    status: 'verified',
    totalPossiblePoints: totalPts2,
    earnedPoints: earnedPts2,
    compliancePercentage: 100,
    crucialViolationsCount: 0,
    notes: 'Weekly audit across all server racks and switch closets 100% compliant. Cloud replication verified.',
    createdAt: `${formatDate(d2)}T08:15:00.000Z`,
    updatedAt: `${formatDate(d2)}T09:00:00.000Z`,
    verifiedBy: 'Leonardo Bobby (Cluster IT Manager)',
  });

  // 3. 3 days ago (Completed, 91.5% score)
  const d3 = new Date(today);
  d3.setDate(d3.getDate() - 3);
  const answers3: Record<string, any> = {};
  let totalPts3 = 0;
  let earnedPts3 = 0;

  items.forEach((item) => {
    totalPts3 += item.points;
    if (item.id === 'item-srv-02') {
      answers3[item.id] = {
        itemId: item.id,
        status: 'not_comply',
        notes: 'Backup AC indoor blower unit vibrating louder than normal during failover test.',
        severity: 'high',
        actionPlan: 'Scheduled technician overhaul with Engineering team.',
        picName: 'Engineering On-Duty',
      };
    } else {
      earnedPts3 += item.points;
      answers3[item.id] = {
        itemId: item.id,
        status: 'comply',
        notes: 'Pass.',
      };
    }
  });

  seedRecords.push({
    id: `insp-${formatDate(d3)}-morning`,
    inspectionNumber: `ITDC-${formatDate(d3).replace(/-/g, '')}-001`,
    date: formatDate(d3),
    inspectionTime: '14:45:12',
    shift: 'Afternoon Shift',
    inspectorName: 'Muchammed Aditya',
    inspectorRole: 'IT Coordinator',
    propertyLocation: 'The Alana Hotel Sentul',
    answers: answers3,
    status: 'completed',
    totalPossiblePoints: totalPts3,
    earnedPoints: earnedPts3,
    compliancePercentage: Math.round((earnedPts3 / totalPts3) * 1000) / 10,
    crucialViolationsCount: 1,
    notes: 'Server room temperature maintained at 20.2°C by primary AC unit. Backup AC serviced.',
    createdAt: `${formatDate(d3)}T14:45:00.000Z`,
    updatedAt: `${formatDate(d3)}T15:30:00.000Z`,
    verifiedBy: 'Leonardo Bobby (Cluster IT Manager)',
  });

  return seedRecords;
}

export const storageService = {
  // Checklist Items
  getItems(): ChecklistItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ITEMS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to load items from storage:', e);
    }
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_CHECKLIST_ITEMS));
    return DEFAULT_CHECKLIST_ITEMS;
  },

  saveItems(items: ChecklistItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
  },

  resetItemsToDefault(): ChecklistItem[] {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(DEFAULT_CHECKLIST_ITEMS));
    return DEFAULT_CHECKLIST_ITEMS;
  },

  // Inspections History
  getInspections(): InspectionRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.INSPECTIONS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load inspections:', e);
    }

    const items = this.getItems();
    const seeded = generateSeedInspections(items);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(seeded));
    return seeded;
  },

  saveInspection(inspection: InspectionRecord): void {
    const list = this.getInspections();
    const existingIndex = list.findIndex((i) => i.id === inspection.id);
    if (existingIndex >= 0) {
      list[existingIndex] = inspection;
    } else {
      list.unshift(inspection);
    }
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
  },

  deleteInspection(id: string): void {
    const list = this.getInspections().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(list));
  },

  // Active Draft
  getActiveDraft(): Partial<InspectionRecord> | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading draft:', e);
    }
    return null;
  },

  saveActiveDraft(draft: Partial<InspectionRecord>): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT, JSON.stringify(draft));
  },

  clearActiveDraft(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT);
  },

  // Crucial Alerts
  getAlerts(): CrucialAlert[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Failed reading alerts:', e);
    }
    return [];
  },

  addAlert(alert: CrucialAlert): void {
    const list = this.getAlerts();
    list.unshift(alert);
    if (list.length > 100) list.pop();
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(list));
  },

  acknowledgeAlert(id: string): void {
    const list = this.getAlerts().map((a) => (a.id === id ? { ...a, acknowledged: true } : a));
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(list));
  },

  clearAllAlerts(): void {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
  },

  // Settings
  getSettings(): NotificationSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.warn('Failed reading settings:', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: NotificationSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  // Inspectors Management (Fixed Leonardo Bobby & Muchammed Aditya + Custom)
  getInspectors(): InspectorProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_INSPECTORS);
      const customList: InspectorProfile[] = data ? JSON.parse(data) : [];
      return [...FIXED_INSPECTORS, ...customList];
    } catch (e) {
      console.warn('Failed reading custom inspectors:', e);
      return [...FIXED_INSPECTORS];
    }
  },

  getCustomInspectors(): InspectorProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOM_INSPECTORS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addCustomInspector(name: string, role: string): InspectorProfile {
    const customList = this.getCustomInspectors();
    const newInspector: InspectorProfile = {
      id: `custom-insp-${Date.now()}`,
      name: name.trim(),
      role: role.trim() || 'IT Operations Specialist',
      isCustom: true,
    };
    const updated = [...customList, newInspector];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_INSPECTORS, JSON.stringify(updated));
    return newInspector;
  },

  deleteCustomInspector(id: string): void {
    // Crucial requirement: only removes from selection list, NEVER deletes any past checklist records!
    const customList = this.getCustomInspectors().filter((i) => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_INSPECTORS, JSON.stringify(customList));
  },

  // Export / Import
  exportAllData(): string {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      items: this.getItems(),
      inspections: this.getInspections(),
      alerts: this.getAlerts(),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.items) localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(parsed.items));
      if (parsed.inspections) localStorage.setItem(STORAGE_KEYS.INSPECTIONS, JSON.stringify(parsed.inspections));
      if (parsed.alerts) localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(parsed.alerts));
      if (parsed.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(parsed.settings));
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  },
};
