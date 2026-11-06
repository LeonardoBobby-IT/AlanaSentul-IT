import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertOctagon, 
  HelpCircle, 
  FileCheck, 
  Check, 
  Search, 
  Clock, 
  Hash, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Send,
  RotateCcw,
  Lock,
  Eye,
  ShieldCheck,
  Sun,
  Sunset,
  Calendar,
  UserPlus,
  Users
} from 'lucide-react';
import { ChecklistItem, ChecklistAnswer, InspectionRecord, ComplianceStatus, CrucialAlert, NotificationSettings, InspectorProfile } from '../types';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { AuthorizedUser } from '../services/authService';

interface ChecklistExecutionViewProps {
  items: ChecklistItem[];
  settings: NotificationSettings;
  currentUser: AuthorizedUser;
  onSaveInspection: (record: InspectionRecord) => void;
  onTriggerCrucialAlert: (alert: CrucialAlert) => void;
  onUpdateItems: (newItems: ChecklistItem[]) => void;
  onResetItemsToDefault?: () => void;
  initialDraft?: Partial<InspectionRecord> | null;
  onViewReport: (id: string) => void;
}

export const ChecklistExecutionView: React.FC<ChecklistExecutionViewProps> = ({
  items,
  settings,
  currentUser,
  onSaveInspection,
  onTriggerCrucialAlert,
  onUpdateItems,
  onResetItemsToDefault,
  initialDraft,
  onViewReport,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const defaultDocNumber = `ITDC-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

  // Shift state: strictly Morning Shift, Afternoon Shift, All Day Routine
  const [shift, setShift] = useState<'Morning Shift' | 'Afternoon Shift' | 'All Day Routine'>(
    (initialDraft?.shift as any) || 'Morning Shift'
  );

  // Inspectors management state
  const [inspectors, setInspectors] = useState<InspectorProfile[]>(() => storageService.getInspectors());
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [newInspName, setNewInspName] = useState('');
  const [newInspRole, setNewInspRole] = useState('IT Operations Specialist');

  // Inspection Header state
  const [inspectionNumber, setInspectionNumber] = useState<string>(
    initialDraft?.inspectionNumber || defaultDocNumber
  );
  const [date, setDate] = useState<string>(
    initialDraft?.date || todayStr
  );
  const [inspectionTime, setInspectionTime] = useState<string>(
    initialDraft?.inspectionTime || currentTimeStr
  );

  // Default inspector to active user if they match one of our superusers, else Leonardo Bobby
  const initialInspectorName = initialDraft?.inspectorName || (
    currentUser.email.toLowerCase().includes('itc') || currentUser.name.includes('Aditya')
      ? 'Muchammed Aditya'
      : 'Leonardo Bobby'
  );
  const initialInspectorRole = initialDraft?.inspectorRole || (
    currentUser.email.toLowerCase().includes('itc') || currentUser.name.includes('Aditya')
      ? 'IT Coordinator'
      : 'Cluster IT Manager'
  );

  const [inspectorName, setInspectorName] = useState<string>(initialInspectorName);
  const [inspectorRole, setInspectorRole] = useState<string>(initialInspectorRole);

  const [summaryNotes, setSummaryNotes] = useState<string>(
    initialDraft?.notes || ''
  );

  // Answers State: map itemId -> ChecklistAnswer
  const [answers, setAnswers] = useState<Record<string, ChecklistAnswer>>(() => {
    if (initialDraft?.answers) return initialDraft.answers;
    const initial: Record<string, ChecklistAnswer> = {};
    return initial;
  });

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyUnchecked, setShowOnlyUnchecked] = useState<boolean>(false);
  const [expandedSop, setExpandedSop] = useState<Record<string, boolean>>({});

  // Item Modal State (For manually editing or adding items right here)
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [isAddingItem, setIsAddingItem] = useState<boolean>(false);

  // Form states for manual item modification
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPoints, setItemPoints] = useState<number>(10);
  const [itemIsCrucial, setItemIsCrucial] = useState<boolean>(false);
  const [itemSopGuide, setItemSopGuide] = useState('');

  // Categories list
  const existingCategories = Array.from(new Set(items.map((i) => i.category)));
  const categories = ['all', ...existingCategories];

  // Dynamic Score Calculation
  const calculateScores = () => {
    let earned = 0;
    let possible = 0;
    let crucialViolations = 0;
    let answeredCount = 0;

    items.forEach((item) => {
      const ans = answers[item.id];
      if (ans && ans.status !== 'not_applicable') {
        possible += item.points;
        if (ans.status === 'comply') {
          earned += item.points;
        } else if (ans.status === 'not_comply') {
          if (item.isCrucial) {
            crucialViolations++;
          }
        }
        answeredCount++;
      }
    });

    const percentage = possible > 0 ? (earned / possible) * 100 : 100;
    return {
      earned,
      possible,
      percentage: Math.round(percentage * 10) / 10,
      crucialViolations,
      answeredCount,
      totalCount: items.length,
    };
  };

  const scores = calculateScores();

  // Status Change Handler
  const handleStatusChange = (item: ChecklistItem, status: ComplianceStatus) => {
    const existing = answers[item.id] || {
      itemId: item.id,
      status: 'comply',
      notes: '',
    };

    const newAnswer: ChecklistAnswer = {
      ...existing,
      status,
      severity: status === 'not_comply' ? (item.isCrucial ? 'critical' : 'medium') : undefined,
    };

    setAnswers((prev) => ({
      ...prev,
      [item.id]: newAnswer,
    }));

    // If marked Not Comply on a CRUCIAL item: Trigger alert!
    if (status === 'not_comply' && item.isCrucial) {
      if (settings.soundAlertEnabled) {
        notificationService.playAlertSound();
      }

      const alert: CrucialAlert = {
        id: `alert-${Date.now()}-${item.id}`,
        inspectionId: `insp-${date}-${shift.toLowerCase()}`,
        date,
        itemId: item.id,
        itemTitle: item.title,
        category: item.category,
        severity: 'critical',
        notes: existing.notes || 'Status Not Comply detected during daily checklist.',
        actionPlan: existing.actionPlan || 'Immediate investigation by On-Duty IT Personnel.',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        acknowledged: false,
      };

      onTriggerCrucialAlert(alert);

      if (settings.webhookUrl) {
        notificationService.sendWebhookAlert(settings.webhookUrl, alert, settings.propertyName);
      }
    }
  };

  // Direct Remarks / Note change for any item
  const handleRemarksChange = (itemId: string, text: string) => {
    setAnswers((prev) => {
      const existing = prev[itemId] || {
        itemId,
        status: 'comply',
        notes: '',
      };
      return {
        ...prev,
        [itemId]: {
          ...existing,
          notes: text,
        },
      };
    });
  };

  // Additional detail change (action plan, severity, etc.)
  const handleAnswerDetailChange = (itemId: string, field: keyof ChecklistAnswer, value: any) => {
    setAnswers((prev) => {
      const existing = prev[itemId] || {
        itemId,
        status: 'comply',
        notes: '',
      };
      return {
        ...prev,
        [itemId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  // Quick Action: Mark all remaining in current category as Comply
  const handleMarkCategoryAllComply = (category: string) => {
    const targetItems = category === 'all' 
      ? items 
      : items.filter((i) => i.category === category);

    setAnswers((prev) => {
      const updated = { ...prev };
      targetItems.forEach((item) => {
        if (!updated[item.id]) {
          updated[item.id] = {
            itemId: item.id,
            status: 'comply',
            notes: 'Verified compliant.',
          };
        }
      });
      return updated;
    });
  };

  // INSPECTORS MANAGEMENT HANDLERS (Fixed Leonardo Bobby, Muchammed Aditya + Custom)
  const handleAddInspector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspName.trim()) return;
    const created = storageService.addCustomInspector(newInspName.trim(), newInspRole.trim());
    const updated = storageService.getInspectors();
    setInspectors(updated);
    setInspectorName(created.name);
    setInspectorRole(created.role);
    setNewInspName('');
    setIsInspectorModalOpen(false);
  };

  const handleDeleteCustomInspector = (id: string, name: string) => {
    if (window.confirm(`Remove inspector "${name}" from the active selection list?\n\n(Important: Historical checklist records that were conducted by ${name} will NOT be deleted).`)) {
      storageService.deleteCustomInspector(id);
      const updated = storageService.getInspectors();
      setInspectors(updated);
      if (inspectorName === name) {
        setInspectorName('Leonardo Bobby');
        setInspectorRole('Cluster IT Manager');
      }
    }
  };

  // MANUAL ITEM MANAGEMENT HANDLERS (Add, Edit, Delete right on the checklist)
  const handleOpenEditItem = (item: ChecklistItem) => {
    setEditingItem(item);
    setItemTitle(item.title);
    setItemCategory(item.category);
    setItemDescription(item.description);
    setItemPoints(item.points);
    setItemIsCrucial(item.isCrucial);
    setItemSopGuide(item.sopGuide || '');
    setIsAddingItem(false);
  };

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemTitle('');
    setItemCategory(existingCategories[0] || 'Server Room & Power');
    setNewCustomCategory('');
    setItemDescription('');
    setItemPoints(10);
    setItemIsCrucial(false);
    setItemSopGuide('');
    setIsAddingItem(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim()) return;

    const finalCategory = itemCategory === '__custom__' && newCustomCategory.trim()
      ? newCustomCategory.trim()
      : itemCategory;

    if (isAddingItem) {
      const newItem: ChecklistItem = {
        id: `item-custom-${Date.now()}`,
        title: itemTitle.trim(),
        category: finalCategory,
        description: itemDescription.trim() || 'Custom checklist inspection parameter.',
        points: Number(itemPoints) || 10,
        isCrucial: itemIsCrucial,
        sopGuide: itemSopGuide.trim() || undefined,
        order: items.length + 1,
      };
      onUpdateItems([...items, newItem]);
    } else if (editingItem) {
      const updated = items.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              title: itemTitle.trim(),
              category: finalCategory,
              description: itemDescription.trim(),
              points: Number(itemPoints) || 10,
              isCrucial: itemIsCrucial,
              sopGuide: itemSopGuide.trim() || undefined,
            }
          : it
      );
      onUpdateItems(updated);
    }

    setIsAddingItem(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (window.confirm(`Delete item "${title}" from the checklist?`)) {
      const updated = items.filter((it) => it.id !== id);
      onUpdateItems(updated);
      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  // Submit & Save Inspection
  const handleCompleteInspection = () => {
    const unanswered = items.filter((i) => !answers[i.id]);
    if (unanswered.length > 0) {
      const proceed = window.confirm(
        `There are ${unanswered.length} unchecked items. Would you like to automatically mark them as Comply?`
      );
      if (proceed) {
        unanswered.forEach((item) => {
          answers[item.id] = {
            itemId: item.id,
            status: 'comply',
            notes: 'Verified compliant.',
          };
        });
      } else {
        return;
      }
    }

    const inspectionId = `insp-${date}-${shift.toLowerCase()}-${Date.now().toString().slice(-4)}`;
    const finalScores = calculateScores();

    const record: InspectionRecord = {
      id: inspectionId,
      inspectionNumber,
      date,
      inspectionTime,
      shift,
      inspectorName,
      inspectorRole,
      propertyLocation: settings.propertyName,
      answers,
      status: 'completed',
      totalPossiblePoints: finalScores.possible,
      earnedPoints: finalScores.earned,
      compliancePercentage: finalScores.percentage,
      crucialViolationsCount: finalScores.crucialViolations,
      notes: summaryNotes || 'Daily IT checklist executed in compliance with operational SOP.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      verifiedBy: inspectorRole.includes('Manager') ? inspectorName : undefined,
    };

    onSaveInspection(record);
    onViewReport(record.id);
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUnchecked = !showOnlyUnchecked || !answers[item.id];
    return matchesCategory && matchesSearch && matchesUnchecked;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* RBAC Read-Only Alert Banner if not superuser */}
      {!currentUser.isSuperuser && (
        <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>Read-Only Mode Active</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded font-semibold">
                  LIHAT SAJA
                </span>
              </div>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                You are currently signed in as <span className="font-semibold text-amber-950">{currentUser.name}</span> ({currentUser.email}).
                Editing SOP items, altering status switches, and submitting audit reports are restricted to authorized Superusers (<span className="font-semibold">Leonardo Bobby</span> &amp; <span className="font-semibold">Muchammed Adity</span>).
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-amber-700 font-semibold text-[11px] px-2.5 py-1 bg-amber-100/80 rounded-md border border-amber-200 self-start sm:self-center">
            <Eye className="w-3.5 h-3.5" />
            <span>Viewer Access</span>
          </div>
        </div>
      )}

      {/* 1. Header Information & Shift Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <span>{settings.propertyName}</span>
              <span aria-hidden="true">·</span>
              <span>Daily Routine Inspection Form</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Execute IT Daily Checklist
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {currentUser.isSuperuser ? (
              <>
                {/* MANUAL ITEM ACTION BUTTONS (Superuser Only) */}
                <button
                  onClick={handleOpenAddItem}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Add Checklist Item</span>
                </button>

                <button
                  onClick={() => handleMarkCategoryAllComply(selectedCategory)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Mark Remaining as Comply</span>
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Modification Locked (Superuser Only)</span>
              </div>
            )}
          </div>
        </div>

        {/* PINNED SHIFT SELECTION BAR (Pinned to Top) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Operational Shift (Pinned to Top)</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Active Shift: <strong className="text-slate-900">{shift}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              disabled={!currentUser.isSuperuser}
              onClick={() => currentUser.isSuperuser && setShift('Morning Shift')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                shift === 'Morning Shift'
                  ? 'bg-amber-500/10 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              } ${!currentUser.isSuperuser ? 'cursor-not-allowed opacity-85' : ''}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${shift === 'Morning Shift' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-amber-600'}`}>
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Morning Shift</div>
                <div className="text-[10px] text-slate-500 mt-0.5">07:00 – 16:00 (Opening &amp; Core Systems)</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!currentUser.isSuperuser}
              onClick={() => currentUser.isSuperuser && setShift('Afternoon Shift')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                shift === 'Afternoon Shift'
                  ? 'bg-sky-500/10 border-sky-500 text-sky-950 font-bold ring-2 ring-sky-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              } ${!currentUser.isSuperuser ? 'cursor-not-allowed opacity-85' : ''}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${shift === 'Afternoon Shift' ? 'bg-sky-600 text-white' : 'bg-slate-100 text-sky-600'}`}>
                <Sunset className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">Afternoon Shift</div>
                <div className="text-[10px] text-slate-500 mt-0.5">14:00 – 23:00 (Peak Operations &amp; Events)</div>
              </div>
            </button>

            <button
              type="button"
              disabled={!currentUser.isSuperuser}
              onClick={() => currentUser.isSuperuser && setShift('All Day Routine')}
              className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                shift === 'All Day Routine'
                  ? 'bg-indigo-500/10 border-indigo-500 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
              } ${!currentUser.isSuperuser ? 'cursor-not-allowed opacity-85' : ''}`}
            >
              <div className={`p-2 rounded-lg shrink-0 ${shift === 'All Day Routine' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-600'}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">All Day Routine</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Full Day 24h Summary Audit</div>
              </div>
            </button>
          </div>
        </div>

        {/* Input Parameters Form with Document No & Exact Time & Inspector Picker */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs">
          {/* Checklist Reference Number */}
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>Checklist Ref No. (Document ID)</span>
            </label>
            <input
              type="text"
              readOnly={!currentUser.isSuperuser}
              value={inspectionNumber}
              onChange={(e) => setInspectionNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Checklist Date */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Checklist Date
            </label>
            <input
              type="date"
              readOnly={!currentUser.isSuperuser}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden font-mono"
            />
          </div>

          {/* Checklist Time */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Checklist Time</span>
            </label>
            <input
              type="text"
              readOnly={!currentUser.isSuperuser}
              value={inspectionTime}
              onChange={(e) => setInspectionTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white font-mono"
            />
          </div>

          {/* Inspector Name Picker with Fixed Superusers & Add New */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Inspector Name</span>
              </label>
              {currentUser.isSuperuser && (
                <button
                  type="button"
                  onClick={() => setIsInspectorModalOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ New Inspector</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <select
                disabled={!currentUser.isSuperuser}
                value={inspectorName}
                onChange={(e) => {
                  const selected = inspectors.find((i) => i.name === e.target.value);
                  if (selected) {
                    setInspectorName(selected.name);
                    setInspectorRole(selected.role);
                  } else {
                    setInspectorName(e.target.value);
                  }
                }}
                className={`w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white font-medium ${
                  !currentUser.isSuperuser ? 'cursor-not-allowed opacity-85' : ''
                }`}
              >
                <optgroup label="Fixed Designated Superusers">
                  <option value="Leonardo Bobby">Leonardo Bobby (Cluster IT Manager)</option>
                  <option value="Muchammed Aditya">Muchammed Aditya (IT Coordinator)</option>
                </optgroup>
                {inspectors.filter((i) => i.isCustom).length > 0 && (
                  <optgroup label="Additional Registered Inspectors">
                    {inspectors.filter((i) => i.isCustom).map((i) => (
                      <option key={i.id} value={i.name}>
                        {i.name} ({i.role})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              <div className="text-[10px] text-slate-500 font-medium px-1 flex items-center justify-between">
                <span>Role: <strong>{inspectorRole}</strong></span>
                {inspectors.some((i) => i.name === inspectorName && i.isCustom) && (
                  <span className="text-amber-600">Custom Profile</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Floating Live Compliance Score Bar */}
      <div className="sticky top-16 z-20 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider">
                Live Compliance Rate
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono tabular-nums text-white">
                  {scores.percentage}%
                </span>
                <span className="text-xs text-slate-400 font-mono tabular-nums">
                  ({scores.earned} / {scores.possible} Pts)
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-800 hidden sm:block" />

            <div>
              <span className="text-[11px] text-slate-400 block uppercase font-medium tracking-wider">
                Progress Checked
              </span>
              <span className="text-base font-bold font-mono tabular-nums text-slate-200">
                {scores.answeredCount} / {scores.totalCount} Items
              </span>
            </div>

            {scores.crucialViolations > 0 && (
              <>
                <div className="h-8 w-px bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-2 text-rose-400">
                  <AlertOctagon className="w-5 h-5 animate-bounce shrink-0" />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">
                      {scores.crucialViolations} Crucial Not Comply!
                    </span>
                    <span className="text-[11px] text-rose-300">
                      Instant alerts dispatched
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentUser.isSuperuser ? (
              <button
                onClick={handleCompleteInspection}
                className="px-5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
              >
                <FileCheck className="w-4 h-4" />
                <span>Submit & Generate Report</span>
              </button>
            ) : (
              <div className="px-4 py-2 text-xs font-medium text-amber-900 bg-amber-100/90 border border-amber-300 rounded-lg flex items-center gap-2 whitespace-nowrap">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Read-Only: Submission Restricted to Superusers</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Category Filter & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <button
              onClick={() => setShowOnlyUnchecked(!showOnlyUnchecked)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                showOnlyUnchecked
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {showOnlyUnchecked ? 'Showing Unchecked' : 'Filter Unchecked'}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Checklist Items List with Direct Manual Edit & Delete Buttons */}
      <div className="space-y-3.5">
        {filteredItems.map((item) => {
          const ans = answers[item.id];
          const isComply = ans?.status === 'comply';
          const isNotComply = ans?.status === 'not_comply';
          const isNA = ans?.status === 'not_applicable';
          const isExpanded = expandedSop[item.id];

          return (
            <div
              key={item.id}
              className={`bg-white rounded-xl border transition-all ${
                isNotComply
                  ? item.isCrucial
                    ? 'border-rose-400 shadow-xs ring-1 ring-rose-300/50'
                    : 'border-amber-300 shadow-xs'
                  : isComply
                  ? 'border-emerald-200/90'
                  : 'border-slate-200'
              } p-4 sm:p-5 space-y-3`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Left: Item Information & Manual Edit trigger */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-600 font-semibold">
                      +{item.points} Pts
                    </span>
                    {item.isCrucial && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-rose-600 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          Crucial
                        </span>
                      </>
                    )}

                    {/* Manual Edit & Delete Buttons (Superuser Only) */}
                    {currentUser.isSuperuser && (
                      <>
                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => handleOpenEditItem(item)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-0.5 text-[11px] hover:underline"
                          title="Edit this checklist item title, points, or category"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit Item</span>
                        </button>

                        <span aria-hidden="true">·</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.title)}
                          className="text-slate-400 hover:text-rose-600 text-[11px] flex items-center gap-0.5 hover:underline"
                          title="Delete this checklist item"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* SOP Guide Toggle */}
                  {item.sopGuide && (
                    <div className="pt-0.5">
                      <button
                        onClick={() =>
                          setExpandedSop((prev) => ({ ...prev, [item.id]: !isExpanded }))
                        }
                        className="text-[11px] text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 transition-colors"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isExpanded ? 'Hide SOP Guide' : 'SOP Safe Threshold Guide'}</span>
                      </button>
                      {isExpanded && (
                        <div className="mt-1.5 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
                          <span className="font-semibold text-slate-900 block mb-0.5">Standard Parameter:</span>
                          {item.sopGuide}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Status Toggle Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <button
                    disabled={!currentUser.isSuperuser}
                    onClick={() => currentUser.isSuperuser && handleStatusChange(item, 'comply')}
                    title={!currentUser.isSuperuser ? 'Read-only mode: only authorized superusers can change status' : 'Mark as Comply'}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      !currentUser.isSuperuser ? 'cursor-not-allowed opacity-85 ' : ''
                    }${
                      isComply
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isComply ? 'text-white' : 'text-emerald-500'}`} />
                    <span>Comply</span>
                  </button>

                  <button
                    disabled={!currentUser.isSuperuser}
                    onClick={() => currentUser.isSuperuser && handleStatusChange(item, 'not_comply')}
                    title={!currentUser.isSuperuser ? 'Read-only mode: only authorized superusers can change status' : 'Mark as Not Comply'}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      !currentUser.isSuperuser ? 'cursor-not-allowed opacity-85 ' : ''
                    }${
                      isNotComply
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${isNotComply ? 'text-white' : 'text-rose-500'}`} />
                    <span>Not Comply</span>
                  </button>

                  <button
                    disabled={!currentUser.isSuperuser}
                    onClick={() => currentUser.isSuperuser && handleStatusChange(item, 'not_applicable')}
                    title={!currentUser.isSuperuser ? 'Read-only mode' : 'Not Applicable'}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      !currentUser.isSuperuser ? 'cursor-not-allowed opacity-85 ' : ''
                    }${
                      isNA
                        ? 'bg-slate-700 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span>N/A</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED REMARKS BOX FOR EVERY ITEM */}
              <div className="pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                    Remarks / Notes:
                  </span>
                  <input
                    type="text"
                    readOnly={!currentUser.isSuperuser}
                    value={ans?.notes || ''}
                    onChange={(e) => currentUser.isSuperuser && handleRemarksChange(item.id, e.target.value)}
                    placeholder={
                      currentUser.isSuperuser
                        ? "Enter observation / parameter reading (e.g. 20.4°C / 14ms latency / Backup size 42GB / Normal)"
                        : "Observation parameter (Read-only mode)"
                    }
                    className={`flex-1 px-3 py-1.5 text-xs rounded-lg border text-slate-900 transition-colors ${
                      !currentUser.isSuperuser
                        ? 'bg-slate-100/70 border-slate-200 cursor-not-allowed text-slate-600'
                        : 'bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10'
                    }`}
                  />
                </div>
              </div>

              {/* Additional Action Plan Drawer if marked Not Comply */}
              {isNotComply && (
                <div className="mt-2 pt-3 border-t border-rose-200/60 bg-rose-50/40 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-rose-600" />
                      Corrective Action & Severity Detail
                    </span>
                    {item.isCrucial && (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full font-mono">
                        CRITICAL ALERT ACTIVE
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-medium text-slate-700 mb-0.5">
                        Corrective Action Plan
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dispatched technician / switched to backup circuit / opened ticket #1029"
                        value={ans?.actionPlan || ''}
                        onChange={(e) => handleAnswerDetailChange(item.id, 'actionPlan', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-0.5">
                        Severity
                      </label>
                      <select
                        value={ans?.severity || (item.isCrucial ? 'critical' : 'medium')}
                        onChange={(e) => handleAnswerDetailChange(item.id, 'severity', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-slate-900 font-medium"
                      >
                        <option value="critical">Critical (Immediate Outage)</option>
                        <option value="high">High (Service Risk)</option>
                        <option value="medium">Medium (Substandard)</option>
                        <option value="low">Low (Minor Advisory)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. Summary & Submit Footer Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Operational Handover & General Notes
        </h3>
        <div>
          <textarea
            rows={3}
            placeholder="Record general operational observations, room condition, power stability, or handover notes for incoming shift..."
            value={summaryNotes}
            onChange={(e) => setSummaryNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500 font-mono">
            Document No: <span className="font-bold text-slate-800">{inspectionNumber}</span> · {date} {inspectionTime}
          </div>
          <div className="flex items-center gap-3">
            {currentUser.isSuperuser ? (
              <button
                onClick={handleCompleteInspection}
                className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4 text-emerald-400" />
                <span>Submit & Generate Official Report</span>
              </button>
            ) : (
              <div className="px-5 py-2.5 text-xs font-semibold text-amber-900 bg-amber-100/90 border border-amber-300 rounded-lg flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Read-Only: Submission Restricted to Superusers</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 6. MODAL FOR MANUALLY EDITING OR ADDING A CHECKLIST ITEM */}
      {(isAddingItem || editingItem) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  {isAddingItem ? 'Add New Checklist Item' : 'Edit Checklist Item'}
                </h2>
                <p className="text-xs text-slate-500">
                  Manually customize the item title, category, points weighting, or crucial alert status.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setEditingItem(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Item Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Room Temperature & Humidity"
                  value={itemTitle}
                  onChange={(e) => setItemTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    System Category *
                  </label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-medium"
                  >
                    {existingCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="__custom__">+ Create New Category...</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Points Weighting *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={itemPoints}
                    onChange={(e) => setItemPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono tabular-nums"
                  />
                </div>
              </div>

              {itemCategory === '__custom__' && (
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    New Category Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Audio Visual & Conference Rooms"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Item Description / Scope
                </label>
                <textarea
                  rows={2}
                  placeholder="Clear instructions on what needs to be inspected..."
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  SOP / Safe Threshold Guide
                </label>
                <textarea
                  rows={2}
                  placeholder="Standard operating parameters and corrective steps if non-compliant..."
                  value={itemSopGuide}
                  onChange={(e) => setItemSopGuide(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
                />
              </div>

              {/* Crucial Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="modalCrucialCheck"
                  checked={itemIsCrucial}
                  onChange={(e) => setItemIsCrucial(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="modalCrucialCheck" className="cursor-pointer">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                    Crucial Item (Zero-Tolerance Alert)
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 leading-relaxed">
                    If marked Not Comply during daily checks, an audible alarm sounds and an instant alert is dispatched to WhatsApp & Webhook.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingItem(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Save Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL FOR REGISTERING NEW INSPECTOR / MANAGING INSPECTORS */}
      {isInspectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Register New Inspector
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage IT inspectors for daily checklist sign-off.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInspectorModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add New Inspector Form */}
            <form onSubmit={handleAddInspector} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Inspector Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bayu Pratama"
                  value={newInspName}
                  onChange={(e) => setNewInspName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Role / Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IT Operations Specialist"
                  value={newInspRole}
                  onChange={(e) => setNewInspRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Save New Inspector</span>
              </button>
            </form>

            {/* Current Inspectors List & Deletion */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Current Registered Inspectors
              </span>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                {inspectors.map((insp) => (
                  <div key={insp.id} className="py-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span>{insp.name}</span>
                        {!insp.isCustom ? (
                          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">
                            Designated Superuser
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{insp.role}</div>
                    </div>

                    {insp.isCustom && (
                      <button
                        type="button"
                        onClick={() => handleDeleteCustomInspector(insp.id, insp.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete inspector from dropdown (Past checklist records are kept safe)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                🛡️ <em>Safety Guarantee:</em> Deleting a custom inspector only removes them from the dropdown list. Historical inspection records and reports previously saved will never be deleted.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
