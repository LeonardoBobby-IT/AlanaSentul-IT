import React, { useState, useRef } from 'react';
import { 
  X, 
  Volume2, 
  Phone, 
  Mail, 
  Globe, 
  Building2, 
  Check,
  Upload,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';

interface SettingsModalProps {
  isOpen: boolean;
  settings: NotificationSettings;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<NotificationSettings>({ ...settings });
  const [webhookTestStatus, setWebhookTestStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleTestSound = () => {
    notificationService.playAlertSound();
  };

  const handleTestWebhook = async () => {
    if (!formData.webhookUrl) {
      setWebhookTestStatus('Please enter a Webhook URL first.');
      return;
    }
    setWebhookTestStatus('Dispatching test ping...');
    const dummyAlert = {
      id: 'test-ping-001',
      inspectionId: 'test-ping',
      date: new Date().toISOString().split('T')[0],
      itemId: 'test-item',
      itemTitle: 'IT System Notification Diagnostics (Test Ping)',
      category: 'System Diagnostics',
      severity: 'critical' as const,
      notes: 'This is an automated connectivity test ping.',
      timestamp: new Date().toLocaleTimeString(),
      acknowledged: false,
    };

    const ok = await notificationService.sendWebhookAlert(formData.webhookUrl, dummyAlert, formData.propertyName);
    if (ok) {
      setWebhookTestStatus('✅ Test ping dispatched successfully!');
    } else {
      setWebhookTestStatus('❌ Failed to reach Webhook endpoint (Check URL or CORS constraints)');
    }
    setTimeout(() => setWebhookTestStatus(''), 4000);
  };

  // Image Upload Handler
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            logoUrl: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Settings & Property Customization
            </h2>
            <p className="text-xs text-slate-500">
              Customize company logo, IT Manager WhatsApp alert recipient, and webhooks.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 pt-0 space-y-4 text-xs">
          {/* LOGO AREA CONFIGURATION */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>Property Logo (Header & Print Reports)</span>
              </label>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: undefined })}
                  className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
                >
                  Remove Logo
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Preview Box */}
              <div className="w-28 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                {formData.logoUrl ? (
                  <img
                    src={formData.logoUrl}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 text-center font-medium">
                    No Logo Set
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-1.5 flex-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-500" />
                  <span>Upload Logo Image</span>
                </button>
                <p className="text-[10px] text-slate-400">
                  Supports PNG, JPG, or SVG. Displayed in top bar and official PDF reports.
                </p>
              </div>
            </div>
          </div>

          {/* Property Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Property / Facility / Branch Name</span>
            </label>
            <input
              type="text"
              required
              value={formData.propertyName}
              onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs"
            />
          </div>

          {/* WhatsApp Recipient */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>IT Manager / On-Duty WhatsApp Number (International Format)</span>
            </label>
            <input
              type="text"
              placeholder="+6281234567890"
              value={formData.whatsAppRecipient}
              onChange={(e) => setFormData({ ...formData, whatsAppRecipient: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Format: +628... for Indonesia. Direct WhatsApp link is generated when crucial alerts trigger.
            </span>
          </div>

          {/* Email Recipient */}
          <div>
            <label className="block font-medium text-slate-700 mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-500" />
              <span>IT Manager / Escalation Email</span>
            </label>
            <input
              type="email"
              value={formData.managerEmail}
              onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono"
            />
          </div>

          {/* Webhook Endpoint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-medium text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-sky-500" />
                <span>Webhook URL (Discord / Slack / Teams / Custom Endpoint)</span>
              </label>
              <button
                type="button"
                onClick={handleTestWebhook}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Send Test Ping
              </button>
            </div>
            <input
              type="url"
              placeholder="https://discord.com/api/webhooks/... or custom server webhook"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white text-xs font-mono"
            />
            {webhookTestStatus && (
              <span className="text-[11px] font-medium text-indigo-700 block mt-1">
                {webhookTestStatus}
              </span>
            )}
          </div>

          {/* Sound Alert Toggle */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-rose-500" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Audible Alarm on Crucial Failure
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Plays dual-tone browser synthesizer alarm when a crucial parameter fails.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestSound}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
              >
                Test Audio
              </button>
              <input
                type="checkbox"
                checked={formData.soundAlertEnabled}
                onChange={(e) => setFormData({ ...formData, soundAlertEnabled: e.target.checked })}
                className="w-4 h-4 text-rose-600 focus:ring-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
