import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertOctagon, 
  HelpCircle, 
  FileCheck, 
  Check, 
  Search, 
  MessageSquare,
  Send,
  Clock,
  Hash,
  FileSpreadsheet
} from 'lucide-react';
import { ChecklistItem, ChecklistAnswer, InspectionRecord, ComplianceStatus, CrucialAlert, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface ChecklistExecutionViewProps {
  items: ChecklistItem[];
  settings: NotificationSettings;
  onSaveInspection: (record: InspectionRecord) => void;
  onTriggerCrucialAlert: (alert: CrucialAlert) => void;
  initialDraft?: Partial<InspectionRecord> | null;
  onViewReport: (id: string) => void;
}

export const ChecklistExecutionView: React.FC<ChecklistExecutionViewProps> = ({
  items,
  settings,
  onSaveInspection,
  onTriggerCrucialAlert,
  initialDraft,
  onViewReport,
}) => {
  // Current date & generated Document/Inspection Number
  const todayStr = new Date().toISOString().split('T')[0];
  const currentTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB';

  const defaultDocNumber = `ITDC-${todayStr.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

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
  const [shift, setShift] = useState<'Morning' | 'Middle' | 'Night' | 'Full Day'>(
    initialDraft?.shift || 'Morning'
  );
  const [inspectorName, setInspectorName] = useState<string>(
    initialDraft?.inspectorName || 'Bayu Pratama'
  );
  const [inspectorRole, setInspectorRole] = useState<string>(
    initialDraft?.inspectorRole || 'IT Operations Specialist'
  );
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

  // Categories
  const categories = ['all', ...Array.from(new Set(items.map((i) => i.category)))];

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

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkCategoryAllComply(selectedCategory)}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Mark Remaining as Comply</span>
            </button>
          </div>
        </div>

        {/* Input Parameters Form with Document No & Exact Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 text-xs">
          {/* No. Pengisian / Reference Number */}
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-800 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-indigo-500" />
              <span>No. Pengisian (Inspection Ref No.)</span>
            </label>
            <input
              type="text"
              value={inspectionNumber}
              onChange={(e) => setInspectionNumber(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Audit Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-hidden font-mono"
            />
          </div>

          {/* Time (Jam Pengisian) */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Time (Jam)</span>
            </label>
            <input
              type="text"
              value={inspectionTime}
              onChange={(e) => setInspectionTime(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white font-mono"
            />
          </div>

          {/* Operational Shift */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white font-medium"
            >
              <option value="Morning">Morning Shift</option>
              <option value="Middle">Middle Shift</option>
              <option value="Night">Night Shift</option>
              <option value="Full Day">Full Day Routine</option>
            </select>
          </div>

          {/* Inspector Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Inspector Name
            </label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="e.g. Bayu Pratama"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
            />
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
            <button
              onClick={handleCompleteInspection}
              className="px-5 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>Submit & Generate Report</span>
            </button>
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

      {/* 4. Checklist Items List with Dedicated Remarks Box for EVERY item */}
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
                {/* Left: Item Information */}
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
                    onClick={() => handleStatusChange(item, 'comply')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      isComply
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isComply ? 'text-white' : 'text-emerald-500'}`} />
                    <span>Comply</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(item, 'not_comply')}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                      isNotComply
                        ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-rose-300 hover:bg-rose-50/50'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${isNotComply ? 'text-white' : 'text-rose-500'}`} />
                    <span>Not Comply</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(item, 'not_applicable')}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                      isNA
                        ? 'bg-slate-700 border-slate-700 text-white'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                    title="Not Applicable"
                  >
                    <span>N/A</span>
                  </button>
                </div>
              </div>

              {/* DEDICATED REMARKS BOX FOR EVERY ITEM (Requested for easy logging) */}
              <div className="pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 shrink-0">
                    Remarks / Catatan:
                  </span>
                  <input
                    type="text"
                    value={ans?.notes || ''}
                    onChange={(e) => handleRemarksChange(item.id, e.target.value)}
                    placeholder="Enter observation / parameter reading (e.g. 20.4°C / 14ms latency / Backup size 42GB / Normal)"
                    className="flex-1 px-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900/10 transition-colors"
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
                        Corrective Action Plan (Rencana Tindakan)
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
            <button
              onClick={handleCompleteInspection}
              className="px-6 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Submit & Generate Official Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
