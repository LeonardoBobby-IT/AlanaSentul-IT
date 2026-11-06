import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  FileText, 
  Send, 
  ExternalLink,
  Plus,
  TrendingUp,
  BarChart3,
  PieChart,
  Eye,
  Lock
} from 'lucide-react';
import { InspectionRecord, ChecklistItem, CrucialAlert, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';
import { AuthorizedUser } from '../services/authService';

interface DashboardViewProps {
  inspections: InspectionRecord[];
  items: ChecklistItem[];
  activeAlerts: CrucialAlert[];
  settings: NotificationSettings;
  currentUser: AuthorizedUser;
  onStartChecklist: () => void;
  onViewReport: (inspectionId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inspections,
  items,
  activeAlerts,
  settings,
  currentUser,
  onStartChecklist,
  onViewReport,
  onAcknowledgeAlert,
}) => {
  const latestInspection = inspections[0];

  const compliance = latestInspection ? latestInspection.compliancePercentage : 100;
  const earnedPts = latestInspection ? latestInspection.earnedPoints : 0;
  const possiblePts = latestInspection ? latestInspection.totalPossiblePoints : items.reduce((acc, i) => acc + i.points, 0);
  const crucialViolations = latestInspection ? latestInspection.crucialViolationsCount : 0;
  const crucialItemsCount = items.filter((i) => i.isCrucial).length;

  const isCritical = crucialViolations > 0 || activeAlerts.filter(a => !a.acknowledged).length > 0;
  const isWarning = !isCritical && compliance < 90;

  // Status Distribution (Comply, Not Comply, NA)
  let complyCount = 0;
  let notComplyCount = 0;
  let naCount = 0;

  if (latestInspection) {
    items.forEach((item) => {
      const ans = latestInspection.answers[item.id];
      if (ans?.status === 'comply') complyCount++;
      else if (ans?.status === 'not_comply') notComplyCount++;
      else if (ans?.status === 'not_applicable') naCount++;
      else complyCount++;
    });
  } else {
    complyCount = items.length;
  }

  // Category breakdown calculation
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const categoryStats = categories.map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    let catEarned = 0;
    let catPossible = 0;
    let catComply = 0;
    let catNotComply = 0;

    catItems.forEach((item) => {
      catPossible += item.points;
      const ans = latestInspection?.answers[item.id];
      if (ans) {
        if (ans.status === 'comply') {
          catEarned += item.points;
          catComply++;
        } else if (ans.status === 'not_comply') {
          catNotComply++;
        }
      } else {
        catEarned += item.points;
        catComply++;
      }
    });

    const rate = catPossible > 0 ? Math.round((catEarned / catPossible) * 100) : 100;
    return {
      category: cat,
      totalItems: catItems.length,
      complyCount: catComply,
      notComplyCount: catNotComply,
      earned: catEarned,
      possible: catPossible,
      rate,
    };
  });

  // Trend history calculation (up to 7 inspections)
  const trendData = [...inspections].reverse().slice(-7);

  // SVG Gauge calculations
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (compliance / 100) * circumference;

  const handleShareWhatsAppAlert = (alert: CrucialAlert) => {
    const url = notificationService.generateWhatsAppUrl(settings.whatsAppRecipient, alert, settings.propertyName);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>{settings.propertyName}</span>
            <span aria-hidden="true">·</span>
            <span>IT Operational Health</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Real-Time Metrics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            IT Daily Operations Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {currentUser.isSuperuser ? (
            <button
              onClick={onStartChecklist}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>New Daily Checklist</span>
            </button>
          ) : (
            <button
              onClick={onStartChecklist}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <Eye className="w-4 h-4 text-amber-500" />
              <span>View Checklist Form</span>
            </button>
          )}
          {latestInspection && (
            <button
              onClick={() => onViewReport(latestInspection.id)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>View Report ({latestInspection.inspectionNumber || latestInspection.date})</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-time Status Card */}
      <div
        className={`p-5 rounded-xl border transition-all ${
          isCritical
            ? 'bg-rose-50/70 border-rose-200 text-rose-950'
            : isWarning
            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
            : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
                isCritical
                  ? 'bg-rose-100 text-rose-700'
                  : isWarning
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isCritical ? (
                <XCircle className="w-6 h-6" />
              ) : isWarning ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider">
                  {isCritical
                    ? 'Status: Critical / Immediate Attention Required'
                    : isWarning
                    ? 'Status: Warning / Attention Needed'
                    : 'Status: All Core Systems Nominal'}
                </span>
                <span className="text-xs opacity-75 font-mono tabular-nums">
                  · {latestInspection ? `${latestInspection.inspectionNumber || 'ITDC'} (${latestInspection.date} ${latestInspection.inspectionTime || ''})` : 'No checklist recorded'}
                </span>
              </div>
              <p className="text-sm font-medium mt-0.5">
                {isCritical
                  ? `Identified ${crucialViolations} crucial parameter(s) marked Not Comply! Immediate remediation required.`
                  : isWarning
                  ? 'Checklist compliance is below targeted 90% SLA baseline. Review pending deficiencies.'
                  : 'Core hospitality systems (Server Room, PMS, POS, Network ISP, and Daily Backups) are fully compliant.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
            <div className="text-right">
              <span className="text-xs text-slate-500 block leading-tight">Overall Compliance</span>
              <span className="text-2xl font-bold font-mono tabular-nums">
                {compliance.toFixed(1)}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center font-mono text-xs font-bold shrink-0 border-current">
              {compliance >= 90 ? 'A' : compliance >= 75 ? 'B' : 'C'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. VISUAL CHARTS SECTION (Requested: "bikin menjadi chart dari hasilnya") */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Circular Gauge Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-500" />
              <h2 className="text-sm font-bold text-slate-900">Compliance Rate Gauge</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {earnedPts}/{possiblePts} Pts
            </span>
          </div>

          {/* SVG Circular Donut Gauge */}
          <div className="py-6 flex flex-col items-center justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-slate-100"
                  strokeWidth="10"
                  fill="transparent"
                />
                {/* Value arc */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className={`transition-all duration-700 ${
                    compliance >= 90
                      ? 'stroke-emerald-500'
                      : compliance >= 75
                      ? 'stroke-amber-500'
                      : 'stroke-rose-500'
                  }`}
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 leading-none">
                  {compliance.toFixed(1)}%
                </span>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">
                  {compliance >= 90 ? 'Grade A (Pass)' : compliance >= 75 ? 'Grade B' : 'Grade C'}
                </span>
              </div>
            </div>

            {/* Distribution legend */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-slate-100 text-center text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Comply</span>
                <span className="font-bold text-emerald-600 font-mono">{complyCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Not Comply</span>
                <span className="font-bold text-rose-600 font-mono">{notComplyCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Crucial Alerts</span>
                <span className="font-bold text-rose-700 font-mono">{crucialViolations}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Category Compliance Horizontal Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <h2 className="text-sm font-bold text-slate-900">Category Compliance Breakdown Chart</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">5 System Pillars</span>
          </div>

          <div className="space-y-3.5 pt-1">
            {categoryStats.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono tabular-nums">
                      {cat.earned} / {cat.possible} Pts
                    </span>
                    <span
                      className={`font-bold font-mono tabular-nums ${
                        cat.rate >= 90
                          ? 'text-emerald-600'
                          : cat.rate >= 75
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {cat.rate}%
                    </span>
                  </div>
                </div>

                {/* Styled Bar with Fill animation */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    className={`h-full transition-all duration-500 ${
                      cat.rate >= 90
                        ? 'bg-emerald-500'
                        : cat.rate >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${cat.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Historical Audit Compliance Trend Chart */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Inspection Compliance Trend</h2>
                <span className="text-xs text-slate-500">Multi-day historical compliance tracking</span>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500">Last {trendData.length} Audits</span>
          </div>

          {/* SVG Trend Sparkline Chart */}
          <div className="pt-2">
            <div className="h-36 w-full flex items-end gap-3 sm:gap-6 pt-4 px-2">
              {trendData.map((t, idx) => {
                const heightPercent = Math.max(15, (t.compliancePercentage / 100) * 100);
                return (
                  <div
                    key={t.id}
                    onClick={() => onViewReport(t.id)}
                    className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Tooltip & Score */}
                    <span className="text-[11px] font-bold font-mono tabular-nums text-slate-700 group-hover:text-indigo-600 transition-colors mb-1">
                      {t.compliancePercentage.toFixed(1)}%
                    </span>

                    {/* Bar visual */}
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-24">
                      <div
                        className={`w-full rounded-t-md transition-all group-hover:opacity-85 ${
                          t.compliancePercentage >= 90
                            ? 'bg-emerald-500'
                            : t.compliancePercentage >= 75
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* Date label */}
                    <span className="text-[10px] text-slate-500 font-mono mt-2 truncate w-full text-center">
                      {t.date.slice(5)}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate">
                      {t.shift}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Crucial Alerts Section (If any) */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-xl border border-rose-200 shadow-xs overflow-hidden">
          <div className="px-5 py-3.5 bg-rose-50/50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-bold text-rose-950">
                Active Critical Alerts: Crucial Not Comply ({activeAlerts.length})
              </h2>
            </div>
            <span className="text-xs text-rose-700 font-mono">
              Instant Dispatch Active
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-rose-600 uppercase tracking-wide">
                      {alert.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{alert.timestamp}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{alert.severity} Severity</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {alert.itemTitle}
                  </h3>
                  {alert.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 mt-1">
                      <span className="font-medium text-slate-700">Findings:</span> {alert.notes}
                    </p>
                  )}
                  {alert.actionPlan && (
                    <p className="text-xs text-indigo-700 font-medium">
                      🛠️ Action Plan: {alert.actionPlan}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleShareWhatsAppAlert(alert)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                    title="Notify IT Manager via WhatsApp"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp Manager</span>
                  </button>
                  {currentUser.isSuperuser ? (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Mark Resolved
                    </button>
                  ) : (
                    <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200 font-medium">
                      Pending Resolution
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Recent Inspections Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Checklist History Archive
            </h2>
            <span className="text-xs text-slate-500">
              Audit logs with document reference numbers and time stamps
            </span>
          </div>
          <button
            onClick={() => onViewReport(latestInspection?.id || '')}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 transition-colors"
          >
            <span>All Reports</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {inspections.slice(0, 5).map((insp) => (
            <div
              key={insp.id}
              onClick={() => onViewReport(insp.id)}
              className="py-3 flex items-center justify-between hover:bg-slate-50/80 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-900 font-mono">
                    {insp.inspectionNumber || 'ITDC-REF'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{insp.date} {insp.inspectionTime ? `at ${insp.inspectionTime}` : ''}</span>
                  <span aria-hidden="true">·</span>
                  <span>{insp.shift.includes('Shift') || insp.shift.includes('Routine') ? insp.shift : `${insp.shift} Shift`}</span>
                  <span aria-hidden="true">·</span>
                  <span>{insp.inspectorName}</span>
                </div>
                <p className="text-xs text-slate-600 truncate max-w-md">
                  {insp.notes || 'Routine daily checklist verified.'}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span
                    className={`text-sm font-bold font-mono tabular-nums block leading-tight ${
                      insp.compliancePercentage >= 90
                        ? 'text-emerald-600'
                        : insp.compliancePercentage >= 75
                        ? 'text-amber-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {insp.compliancePercentage.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                    {insp.earnedPoints} pts
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
