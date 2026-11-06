import React from 'react';
import { 
  AlertOctagon, 
  Send, 
  X, 
  Volume2
} from 'lucide-react';
import { CrucialAlert, NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface CrucialAlertModalProps {
  alert: CrucialAlert | null;
  settings: NotificationSettings;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
}

export const CrucialAlertModal: React.FC<CrucialAlertModalProps> = ({
  alert,
  settings,
  onClose,
  onAcknowledge,
}) => {
  if (!alert) return null;

  const handleSendWhatsApp = () => {
    const url = notificationService.generateWhatsAppUrl(
      settings.whatsAppRecipient,
      alert,
      settings.propertyName
    );
    window.open(url, '_blank');
    onAcknowledge(alert.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-rose-500 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Banner Header */}
        <div className="bg-rose-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
              <AlertOctagon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                CRITICAL IT SYSTEM ALERT
              </h2>
              <span className="text-xs text-rose-100 font-mono">
                Not Comply Status on Zero-Tolerance Parameter
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-rose-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-100 space-y-1.5">
            <div className="flex items-center gap-2 text-rose-700 font-semibold">
              <span className="uppercase tracking-wider">{alert.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">{alert.timestamp}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {alert.itemTitle}
            </h3>
            {alert.notes && (
              <p className="text-slate-700 pt-1 border-t border-rose-200/60 font-sans">
                <span className="font-semibold text-rose-900">Findings:</span> {alert.notes}
              </p>
            )}
            {alert.actionPlan && (
              <p className="text-indigo-900 font-medium">
                🛠️ <span className="font-semibold">Action Plan:</span> {alert.actionPlan}
              </p>
            )}
          </div>

          <p className="text-slate-600 leading-relaxed">
            This parameter is registered as a <span className="font-semibold text-slate-800">Zero-Tolerance Crucial Item</span>. Operational failure poses an immediate risk of guest service disruption, PMS/POS transactional downtime, or data loss.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Volume2 className="w-4 h-4 text-rose-500" />
              <span>Audible Alarm & Webhook Dispatch</span>
            </div>
            <span className="text-slate-500 font-mono text-[11px]">
              {settings.soundAlertEnabled ? 'Sound Active' : 'Muted'}
            </span>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>Dispatch Instant Alert to IT Manager via WhatsApp</span>
            </button>

            <button
              onClick={() => {
                onAcknowledge(alert.id);
                onClose();
              }}
              className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors text-center"
            >
              Dismiss & Record in Incident Log
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
