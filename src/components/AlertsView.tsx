import React, { useState } from 'react';
import { 
  Trash2, 
  Send, 
  CheckCheck, 
  AlertOctagon, 
  CheckCircle2
} from 'lucide-react';
import { CrucialAlert, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface AlertsViewProps {
  alerts: CrucialAlert[];
  settings: NotificationSettings;
  onAcknowledgeAlert: (id: string) => void;
  onClearAllAlerts: () => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  settings,
  onAcknowledgeAlert,
  onClearAllAlerts,
}) => {
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'active') return !a.acknowledged;
    if (filter === 'resolved') return a.acknowledged;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  const handleSendWhatsApp = (alert: CrucialAlert) => {
    const url = notificationService.generateWhatsAppUrl(
      settings.whatsAppRecipient,
      alert,
      settings.propertyName
    );
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
            <span>Notification Telemetry</span>
            <span aria-hidden="true">·</span>
            <span>Critical IT Operational Incidents</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Alert & Incident Command Center
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {alerts.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all historical alerts and incident logs?')) {
                  onClearAllAlerts();
                }
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear Log</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Alerts ({alerts.length})
        </button>

        <button
          onClick={() => setFilter('active')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filter === 'active'
              ? 'bg-rose-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>Unresolved</span>
          {activeCount > 0 && (
            <span className="bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full font-mono text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter('resolved')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors ${
            filter === 'resolved'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Resolved ({alerts.length - activeCount})
        </button>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">
            No {filter === 'active' ? 'Active' : ''} Critical Alerts
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All crucial infrastructure parameters are operating within nominal thresholds.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                !alert.acknowledged ? 'bg-rose-50/20' : 'bg-white'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className={`font-semibold uppercase tracking-wider text-[10px] ${
                      !alert.acknowledged ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  >
                    {alert.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{alert.date} {alert.timestamp}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-rose-700 uppercase font-semibold">
                    {alert.severity}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <AlertOctagon
                    className={`w-4 h-4 shrink-0 ${
                      !alert.acknowledged ? 'text-rose-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{alert.itemTitle}</span>
                </h3>

                {alert.notes && (
                  <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                    <span className="font-medium text-slate-700">Findings:</span> {alert.notes}
                  </p>
                )}

                {alert.actionPlan && (
                  <p className="text-xs text-indigo-700 font-medium">
                    🛠️ Action Plan: {alert.actionPlan}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleSendWhatsApp(alert)}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>WhatsApp Manager</span>
                </button>

                {!alert.acknowledged ? (
                  <button
                    onClick={() => onAcknowledgeAlert(alert.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded">
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Resolved</span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
