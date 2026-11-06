import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckSquare, 
  Eye, 
  Hotel,
  AlertCircle
} from 'lucide-react';
import { SUPERUSERS, AuthorizedUser } from '../services/authService';

interface LoginGateProps {
  onLogin: (email: string) => void;
  logoUrl?: string;
  propertyName?: string;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onLogin,
  logoUrl,
  propertyName = 'The Alana Hotel & Conference Center Sentul',
}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your corporate email address to proceed.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email format (e.g., name@alanahotels.com).');
      return;
    }

    setError('');
    onLogin(email.trim().toLowerCase());
  };

  const handleSelectSuperuser = (suEmail: string) => {
    setEmail(suEmail);
    setError('');
    onLogin(suEmail);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center">
            {logoUrl ? (
              <div className="h-14 max-w-[200px] flex items-center justify-center p-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <img
                  src={logoUrl}
                  alt="Property Logo"
                  className="max-h-10 max-w-full object-contain"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                <CheckSquare className="w-7 h-7" />
              </div>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              IT Daily Checklist
            </h1>
            <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
              <Hotel className="w-3.5 h-3.5 text-slate-500" />
              <span>{propertyName}</span>
            </p>
          </div>
        </div>

        {/* Security Gate Notice */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-2 font-semibold text-white">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Secure Authentication Gate</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Access to this system requires verified hotel email authentication.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Corporate Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. sentulitm@alanahotels.com"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800/80 border border-slate-700 focus:border-emerald-500 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 transition-all font-sans"
                autoFocus
              />
            </div>
            {error && (
              <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
          >
            <span>Authenticate &amp; Enter Portal</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Access for Authorized Superusers */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            Authorized Superusers
          </div>
          <div className="grid grid-cols-1 gap-2">
            {SUPERUSERS.map((su) => (
              <button
                key={su.email}
                type="button"
                onClick={() => handleSelectSuperuser(su.email)}
                className="w-full text-left p-2.5 bg-slate-800/50 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-500/40 rounded-xl transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                      {su.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {su.email}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Superuser
                </span>
              </button>
            ))}
          </div>

          {/* Quick Viewer Mode */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => handleSelectSuperuser('auditor@alanahotels.com')}
              className="w-full text-center text-[11px] text-slate-400 hover:text-amber-300 py-1 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Or sign in as Guest Auditor (Read-Only Mode)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer copyright note */}
      <div className="mt-8 text-center text-xs text-slate-600 relative z-10">
        <span>Information Technology Department · Routine Daily Compliance System</span>
      </div>
    </div>
  );
};
