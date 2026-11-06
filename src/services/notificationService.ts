import { CrucialAlert, NotificationSettings } from '../types';

class NotificationService {
  private audioCtx: AudioContext | null = null;

  // Synthesize an alert sound using Web Audio API
  public playAlertSound(): void {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioContextClass();
      }

      const now = this.audioCtx.currentTime;

      // Tone 1: High alert beep
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(1174, now + 0.15); // D6
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2: Warning confirmation beep
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(587, now + 0.2); // D5
      osc2.frequency.setValueAtTime(880, now + 0.35); // A5
      gain2.gain.setValueAtTime(0.2, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio playback not permitted or unavailable yet:', e);
    }
  }

  // Create WhatsApp Direct Link
  public generateWhatsAppUrl(recipient: string, alert: CrucialAlert, propertyName: string): string {
    const cleanNumber = recipient.replace(/[^0-9]/g, '');
    const message = `🚨 *URGENT IT ALERT: CRITICAL NOT COMPLY* 🚨\n\n` +
      `🏨 *Property / Location:* ${propertyName}\n` +
      `📅 *Timestamp:* ${alert.timestamp}\n` +
      `⚠️ *Category:* ${alert.category}\n` +
      `📌 *Checklist Item:* ${alert.itemTitle}\n` +
      `💥 *Severity Level:* ${alert.severity.toUpperCase()}\n` +
      `📝 *Findings:* ${alert.notes || 'No additional notes provided'}\n` +
      (alert.actionPlan ? `🛠️ *Action Plan:* ${alert.actionPlan}\n` : '') +
      `\n_Immediate intervention required by On-Duty IT Team._`;

    const encoded = encodeURIComponent(message);
    if (cleanNumber) {
      return `https://wa.me/${cleanNumber}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  }

  // Create WhatsApp Summary Link for whole inspection
  public generateDailyWhatsAppSummary(
    propertyName: string,
    date: string,
    shift: string,
    inspector: string,
    compliancePercentage: number,
    totalPoints: number,
    possiblePoints: number,
    notComplyItems: { title: string; category: string; notes?: string; isCrucial: boolean }[]
  ): string {
    const statusIcon = compliancePercentage >= 90 ? '✅' : compliancePercentage >= 75 ? '⚠️' : '🚨';
    const statusText = compliancePercentage >= 90 ? 'EXCELLENT / PASS' : compliancePercentage >= 75 ? 'ATTENTION NEEDED' : 'CRITICAL ALERT';

    let msg = `${statusIcon} *DAILY IT CHECKLIST SUMMARY* ${statusIcon}\n\n` +
      `🏨 *Property:* ${propertyName}\n` +
      `📅 *Date:* ${date} | *Shift:* ${shift}\n` +
      `👤 *Inspector:* ${inspector}\n\n` +
      `📊 *Overall Compliance:* ${compliancePercentage.toFixed(1)}% (${statusText})\n` +
      `🏆 *Score:* ${totalPoints} / ${possiblePoints} Points\n` +
      `🔍 *Total Not Comply Items:* ${notComplyItems.length} items\n`;

    if (notComplyItems.length > 0) {
      msg += `\n*Deficiency List (Not Comply):*\n`;
      notComplyItems.forEach((item, idx) => {
        const flag = item.isCrucial ? '💥 [CRUCIAL]' : '⚠️';
        msg += `${idx + 1}. ${flag} *${item.title}* (${item.category})\n   Note: ${item.notes || '-'}\n`;
      });
    } else {
      msg += `\n🎉 All checklist items comply 100%. Infrastructure & PMS operations are nominal.\n`;
    }

    msg += `\n_Official report generated automatically via IT Operations Monitor._`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  }

  // Send Webhook alert if configured
  public async sendWebhookAlert(webhookUrl: string, alert: CrucialAlert, propertyName: string): Promise<boolean> {
    if (!webhookUrl || !webhookUrl.startsWith('http')) return false;

    try {
      const payload = {
        event: 'CRUCIAL_CHECKLIST_FAILED',
        property: propertyName,
        alertId: alert.id,
        timestamp: alert.timestamp,
        severity: alert.severity,
        category: alert.category,
        item: alert.itemTitle,
        notes: alert.notes,
        actionPlan: alert.actionPlan,
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (err) {
      console.warn('Webhook dispatch failed:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
