export type ComplianceStatus = 'comply' | 'not_comply' | 'not_applicable';

export type ItemSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  points: number;
  isCrucial: boolean;
  sopGuide?: string;
  order: number;
}

export interface ChecklistAnswer {
  itemId: string;
  status: ComplianceStatus;
  notes: string;
  severity?: ItemSeverity;
  actionPlan?: string;
  picName?: string;
  targetResolutionDate?: string;
  evidencePhoto?: string; // base64 data url or note
}

export interface InspectionRecord {
  id: string;
  inspectionNumber: string; // Document / Reference Number (No. Pengisian)
  date: string; // YYYY-MM-DD
  inspectionTime: string; // Exact time of inspection (e.g. 08:35:12)
  shift: 'Morning' | 'Middle' | 'Night' | 'Full Day';
  inspectorName: string;
  inspectorRole: string;
  propertyLocation: string;
  answers: Record<string, ChecklistAnswer>;
  status: 'draft' | 'completed' | 'verified';
  totalPossiblePoints: number;
  earnedPoints: number;
  compliancePercentage: number;
  crucialViolationsCount: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
  verifiedBy?: string;
  verificationNotes?: string;
}

export interface CrucialAlert {
  id: string;
  inspectionId: string;
  date: string;
  itemId: string;
  itemTitle: string;
  category: string;
  severity: ItemSeverity;
  notes: string;
  actionPlan?: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface NotificationSettings {
  soundAlertEnabled: boolean;
  whatsAppRecipient: string;
  managerEmail: string;
  webhookUrl: string;
  autoAlertOnCrucial: boolean;
  propertyName: string;
  logoUrl?: string; // Hotel/Company Logo (Data URL or image URL)
}

export interface CategorySummary {
  category: string;
  totalItems: number;
  complyCount: number;
  notComplyCount: number;
  naCount: number;
  earnedPoints: number;
  possiblePoints: number;
  complianceRate: number;
}
