import React, { useState } from 'react';
import { 
  Printer, 
  Download, 
  Share2, 
  CheckCircle, 
  ShieldCheck, 
  CheckCheck,
  Hash,
  Clock,
  Calendar,
  Building2,
  PieChart,
  BarChart3,
  Lock
} from 'lucide-react';
import { InspectionRecord, ChecklistItem, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';
import { AuthorizedUser } from '../services/authService';

interface ReportsViewProps {
  inspections: InspectionRecord[];
  items: ChecklistItem[];
  settings: NotificationSettings;
  currentUser: AuthorizedUser;
  selectedInspectionId?: string;
  onUpdateInspection: (record: InspectionRecord) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  inspections,
  items,
  settings,
  currentUser,
  selectedInspectionId,
  onUpdateInspection,
}) => {
  const [activeId, setActiveId] = useState<string>(
    selectedInspectionId || inspections[0]?.id || ''
  );
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [verificationNote, setVerificationNote] = useState<string>('');

  const currentInspection = inspections.find((i) => i.id === activeId) || inspections[0];

  if (!currentInspection) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-semibold text-slate-800">No Reports Available</h3>
        <p className="text-xs text-slate-500 mt-1">
          Perform a daily checklist inspection first to generate automated reports.
        </p>
      </div>
    );
  }

  // Not Comply items list
  const notComplyItems = items
    .filter((item) => currentInspection.answers[item.id]?.status === 'not_comply')
    .map((item) => ({
      item,
      answer: currentInspection.answers[item.id],
    }));

  // Comply items count
  const complyCount = items.filter(
    (item) => currentInspection.answers[item.id]?.status === 'comply'
  ).length;

  // Categories breakdown
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const categorySummary = categories.map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    let catPossible = 0;
    let catEarned = 0;
    let comply = 0;
    let notComply = 0;

    catItems.forEach((it) => {
      catPossible += it.points;
      const ans = currentInspection.answers[it.id];
      if (ans?.status === 'comply') {
        catEarned += it.points;
        comply++;
      } else if (ans?.status === 'not_comply') {
        notComply++;
      }
    });

    return {
      category: cat,
      total: catItems.length,
      comply,
      notComply,
      earned: catEarned,
      possible: catPossible,
      rate: catPossible > 0 ? Math.round((catEarned / catPossible) * 100) : 100,
    };
  });

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp Summary Copy
  const handleCopyWhatsApp = () => {
    const notComplySummary = notComplyItems.map((nc) => ({
      title: nc.item.title,
      category: nc.item.category,
      notes: nc.answer.notes,
      isCrucial: nc.item.isCrucial,
    }));

    const url = notificationService.generateDailyWhatsAppSummary(
      settings.propertyName,
      currentInspection.date,
      currentInspection.shift,
      currentInspection.inspectorName,
      currentInspection.compliancePercentage,
      currentInspection.earnedPoints,
      currentInspection.totalPossiblePoints,
      notComplySummary
    );

    window.open(url, '_blank');
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 3000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['No', 'Category', 'Checklist Item', 'Status', 'Points', 'Crucial', 'Remarks / Reading', 'Corrective Action Plan', 'PIC'];
    const rows = items.map((item, idx) => {
      const ans = currentInspection.answers[item.id];
      const statusText = ans ? (ans.status === 'comply' ? 'COMPLY' : ans.status === 'not_comply' ? 'NOT COMPLY' : 'N/A') : 'UNCHECKED';
      return [
        idx + 1,
        `"${item.category}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        statusText,
        ans?.status === 'comply' ? item.points : 0,
        item.isCrucial ? 'YES' : 'NO',
        `"${(ans?.notes || '').replace(/"/g, '""')}"`,
        `"${(ans?.actionPlan || '').replace(/"/g, '""')}"`,
        `"${(ans?.picName || '').replace(/"/g, '""')}"`,
      ];
    });

    const docRef = currentInspection.inspectionNumber || currentInspection.date;
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IT-Daily-Checklist-${docRef}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Manager Verification
  const handleVerifyReport = () => {
    if (!currentUser.isSuperuser) return;
    const updated: InspectionRecord = {
      ...currentInspection,
      status: 'verified',
      verifiedBy: `${currentUser.name} (${currentUser.role})`,
      verificationNotes: verificationNote || `Approved and digitally verified by ${currentUser.name} in accordance with operational SLA.`,
      updatedAt: new Date().toISOString(),
    };
    onUpdateInspection(updated);
  };

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentInspection.compliancePercentage / 100) * circumference;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Toolbar (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        {/* Inspection Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-500 font-medium">Select Report:</div>
          <select
            value={activeId}
            onChange={(e) => setActiveId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white"
          >
            {inspections.map((insp) => (
              <option key={insp.id} value={insp.id}>
                {insp.inspectionNumber || 'ITDC'} · {insp.date} {insp.inspectionTime ? `(${insp.inspectionTime})` : ''} - {insp.shift} ({insp.compliancePercentage.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyWhatsApp}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
            title="Dispatch Formatted Report Summary via WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedSuccess ? 'Opened in WhatsApp!' : 'WhatsApp Executive Summary'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Official Printable Report Canvas */}
      <div 
        id="printable-report"
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Letterhead & Official Header with Logo & Document Reference Number */}
        <div className="border-b-2 border-slate-900 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            {/* Logo + Titles */}
            <div className="flex items-start gap-4">
              {settings.logoUrl && (
                <div className="h-14 max-w-[160px] flex items-center justify-center p-1 bg-white border border-slate-200 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={settings.logoUrl}
                    alt="Property Logo"
                    className="max-h-12 max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <div>
                <span className="text-xs uppercase tracking-widest text-slate-500 font-semibold block mb-0.5">
                  {currentInspection.propertyLocation || settings.propertyName} · IT DEPARTMENT
                </span>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  IT Daily Operational Checklist & Compliance Report
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official Verification of Server Infrastructure, Hospitality PMS, POS & Network Systems
                </p>
              </div>
            </div>

            {/* Compliance Badge & Rating */}
            <div className="flex items-center gap-4 border border-slate-200 rounded-xl p-3 bg-slate-50/50 shrink-0 self-start">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block uppercase font-medium">Compliance Rate</span>
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {currentInspection.compliancePercentage.toFixed(1)}%
                </span>
              </div>
              <div
                className={`w-11 h-11 rounded-lg flex items-center justify-center font-bold text-base font-mono ${
                  currentInspection.compliancePercentage >= 90
                    ? 'bg-emerald-600 text-white'
                    : currentInspection.compliancePercentage >= 75
                    ? 'bg-amber-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {currentInspection.compliancePercentage >= 90
                  ? 'A'
                  : currentInspection.compliancePercentage >= 75
                  ? 'B'
                  : 'C'}
              </div>
            </div>
          </div>

          {/* Audit Metadata Strip with Document Ref No, Date, Time */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-4 border-t border-slate-200 text-xs">
            {/* Document Ref No */}
            <div>
              <span className="text-slate-400 block font-normal flex items-center gap-1">
                <Hash className="w-3 h-3 text-slate-400" />
                <span>Document Ref No.</span>
              </span>
              <span className="font-bold text-slate-900 font-mono">
                {currentInspection.inspectionNumber || 'ITDC-REF-001'}
              </span>
            </div>

            {/* Date & Time */}
            <div>
              <span className="text-slate-400 block font-normal flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Date & Time</span>
              </span>
              <span className="font-semibold text-slate-900 font-mono">
                {currentInspection.date} {currentInspection.inspectionTime ? `· ${currentInspection.inspectionTime}` : ''}
              </span>
            </div>

            {/* Shift */}
            <div>
              <span className="text-slate-400 block font-normal">Operational Shift</span>
              <span className="font-semibold text-slate-900">
                {currentInspection.shift} Shift
              </span>
            </div>

            {/* Inspector */}
            <div>
              <span className="text-slate-400 block font-normal">Assigned Inspector</span>
              <span className="font-semibold text-slate-900">
                {currentInspection.inspectorName} ({currentInspection.inspectorRole})
              </span>
            </div>

            {/* Verification Status */}
            <div>
              <span className="text-slate-400 block font-normal">Status Verifikasi</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                {currentInspection.status === 'verified' ? (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified by IT Manager</span>
                  </>
                ) : (
                  <span className="text-amber-600">Pending Review</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Charts Summary Inside Report */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Circular Visual Gauge */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-slate-600 block">Overall Score</span>
              <div className="text-xl font-bold font-mono text-slate-900">
                {currentInspection.earnedPoints} / {currentInspection.totalPossiblePoints} <span className="text-xs text-slate-500 font-normal">Pts</span>
              </div>
              <span className="text-xs text-slate-500 block">
                {complyCount} Comply · {notComplyItems.length} Deficiencies
              </span>
            </div>

            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} className="stroke-slate-200" strokeWidth="12" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className={currentInspection.compliancePercentage >= 90 ? 'stroke-emerald-600' : 'stroke-amber-500'}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <span className="absolute font-mono font-bold text-xs text-slate-900">
                {currentInspection.compliancePercentage.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Key Summary 2 */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
            <span className="text-xs text-emerald-800 uppercase font-bold block">Compliance Status</span>
            <div className="text-2xl font-bold font-mono text-emerald-700">
              {currentInspection.compliancePercentage >= 90 ? 'PASSED (EXCELLENT)' : 'NEEDS ATTENTION'}
            </div>
            <span className="text-xs text-emerald-700">
              Hospitality SLA target: 90.0%
            </span>
          </div>

          {/* Key Summary 3 */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
            <span className="text-xs text-rose-800 uppercase font-bold block">Crucial Findings (Zero-Tolerance)</span>
            <div className="text-2xl font-bold font-mono text-rose-700">
              {currentInspection.crucialViolationsCount === 0 ? '0 (Nominal)' : `${currentInspection.crucialViolationsCount} Critical`}
            </div>
            <span className="text-xs text-rose-700">
              {currentInspection.crucialViolationsCount === 0 ? 'Core PMS & ISP fully nominal' : 'Active remediation required'}
            </span>
          </div>
        </div>

        {/* Section 1: Category Performance Breakdown Table with Graphical Bars */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-slate-700" />
            <span>1. Category Compliance Summary & Results Chart</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3 border-b border-slate-200">Infrastructure Category</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-center">Total Items</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-center">Comply</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-center">Not Comply</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-right">Points</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 w-36">Results Chart</th>
                  <th className="py-2.5 px-3 border-b border-slate-200 text-right">Compliance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {categorySummary.map((cat) => (
                  <tr key={cat.category} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{cat.category}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums">{cat.total}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-emerald-700 font-semibold">{cat.comply}</td>
                    <td className="py-2 px-3 text-center font-mono tabular-nums text-rose-600 font-semibold">{cat.notComply}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-700">{cat.earned} / {cat.possible}</td>
                    <td className="py-2 px-3">
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div
                          className={`h-full ${
                            cat.rate >= 90 ? 'bg-emerald-500' : cat.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${cat.rate}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold">
                      <span className={cat.rate >= 90 ? 'text-emerald-700' : cat.rate >= 75 ? 'text-amber-700' : 'text-rose-700'}>
                        {cat.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Deficiencies & Corrective Action Matrix */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5 flex items-center justify-between">
            <span>2. Deficiencies & Corrective Action Matrix (Not Comply)</span>
            <span className="text-xs font-mono font-normal text-slate-500">
              {notComplyItems.length} Active Findings
            </span>
          </h2>

          {notComplyItems.length === 0 ? (
            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Zero operational deficiencies. All inspected parameters comply 100% with standard operating procedures.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-rose-200">
                <thead className="bg-rose-50/70 text-rose-950 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3 border-b border-rose-200">Checklist Parameter</th>
                    <th className="py-2.5 px-3 border-b border-rose-200">Severity</th>
                    <th className="py-2.5 px-3 border-b border-rose-200">Findings & Remarks</th>
                    <th className="py-2.5 px-3 border-b border-rose-200">Corrective Action Plan</th>
                    <th className="py-2.5 px-3 border-b border-rose-200">Assigned PIC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100">
                  {notComplyItems.map(({ item, answer }) => (
                    <tr key={item.id} className="hover:bg-rose-50/30">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {item.title}
                        {item.isCrucial && (
                          <span className="block text-[10px] text-rose-600 font-bold uppercase mt-0.5">
                            💥 CRUCIAL / ZERO-TOLERANCE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold uppercase text-[10px] font-mono text-rose-700">
                          {answer.severity || 'HIGH'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {answer.notes || 'Operating parameters deviated from nominal threshold.'}
                      </td>
                      <td className="py-2.5 px-3 text-indigo-900 font-medium">
                        {answer.actionPlan || 'Investigate and dispatch designated vendor / department.'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {answer.picName || 'On-Duty IT Specialist'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Detailed Checklist Audit Sheet with Remarks for EVERY item */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1.5">
            3. Detailed Inspection Parameters & Remarks (Audit Sheet)
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-2.5 border-b border-slate-200 w-8 text-center">No</th>
                  <th className="py-2 px-3 border-b border-slate-200">Parameter Scope</th>
                  <th className="py-2 px-3 border-b border-slate-200">Category</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-center">Weight</th>
                  <th className="py-2 px-3 border-b border-slate-200 text-center">Status</th>
                  <th className="py-2 px-3 border-b border-slate-200">Remarks / Readings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const ans = currentInspection.answers[item.id];
                  const isComply = ans?.status === 'comply';
                  const isNotComply = ans?.status === 'not_comply';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-slate-900 block">{item.title}</span>
                        <span className="text-[11px] text-slate-500 block">{item.description}</span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 whitespace-nowrap">{item.category}</td>
                      <td className="py-2 px-3 text-center font-mono tabular-nums text-slate-700 font-medium">
                        {item.points} pts
                      </td>
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isComply ? (
                          <span className="font-bold text-emerald-700 font-mono text-[11px]">
                            COMPLY
                          </span>
                        ) : isNotComply ? (
                          <span className="font-bold text-rose-700 font-mono text-[11px]">
                            NOT COMPLY
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-800 text-[11px] font-mono">
                        {ans?.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: General Notes */}
        {currentInspection.notes && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
            <span className="font-bold text-slate-900 block mb-1">Operational & Handover Remarks:</span>
            <p className="leading-relaxed">{currentInspection.notes}</p>
          </div>
        )}

        {/* Section 5: Official Sign-Off Block */}
        <div className="pt-6 border-t-2 border-slate-900">
          <div className="grid grid-cols-3 gap-8 text-center text-xs">
            <div>
              <span className="text-slate-500 block mb-12">Prepared By (IT Inspector),</span>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                {currentInspection.inspectorName}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {currentInspection.inspectorRole}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-12">Verified By (IT Manager),</span>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                {currentInspection.verifiedBy || '( ________________________ )'}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Information Technology Manager
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-12">Acknowledged By (GM / Financial Controller),</span>
              <div className="border-b border-slate-400 pb-1 font-bold text-slate-900">
                ( ________________________ )
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                General Manager / FC
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Action Drawer (Hidden in Print) */}
      {currentInspection.status !== 'verified' && (
        <div className="no-print bg-white p-5 rounded-xl border border-indigo-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>Manager Verification Sign-Off</span>
            </h3>
            <p className="text-xs text-slate-500">
              Provide formal digital approval for inspection report <span className="font-mono font-bold text-slate-800">{currentInspection.inspectionNumber}</span>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.isSuperuser ? (
              <button
                onClick={handleVerifyReport}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Verify & Approve Report (as {currentUser.name})</span>
              </button>
            ) : (
              <div className="px-3.5 py-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Verification Sign-Off Restricted to Superusers</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
