import React, { useState } from 'react';
import { 
  CheckSquare, 
  LayoutDashboard, 
  FileText, 
  Bell, 
  Settings,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  UserCheck,
  Lock,
  Eye
} from 'lucide-react';
import { AuthorizedUser } from '../services/authService';

interface NavbarProps {
  activeTab: 'dashboard' | 'checklist' | 'reports' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'checklist' | 'reports' | 'alerts') => void;
  unreadAlertsCount: number;
  openSettings: () => void;
  onNewChecklistClick: () => void;
  logoUrl?: string;
  propertyName?: string;
  currentUser: AuthorizedUser;
  onSwitchUser: (email: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertsCount,
  openSettings,
  onNewChecklistClick,
  logoUrl,
  propertyName = 'The Alana Hotel & Conference Center Sentul',
  currentUser,
  onSwitchUser,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [customEmail, setCustomEmail] = useState('');

  const superusers = [
    { name: 'Leonardo Bobby', role: 'Cluster IT Manager', email: 'sentulitm@alanahotels.com' },
    { name: 'Muchammed Adity', role: 'IT Coordinator', email: 'sentulitc@alanahotels.com' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* Zone 1: Logo & Brand title wordmark */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer whitespace-nowrap shrink-0 group"
          >
            {/* Logo Area */}
            {logoUrl ? (
              <div className="h-10 max-w-[140px] flex items-center justify-center p-1 bg-white/5 rounded-lg border border-white/10 group-hover:border-white/20 transition-all overflow-hidden">
                <img
                  src={logoUrl}
                  alt="Property Logo"
                  className="max-h-8 max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                <CheckSquare className="w-5 h-5" />
              </div>
            )}

            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-tight">
                IT Daily Checklist
              </span>
              <span className="text-[11px] text-slate-400 block font-normal leading-none mt-0.5 truncate max-w-[160px] sm:max-w-xs">
                {propertyName}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'checklist'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-sky-400" />
              <span>{currentUser.isSuperuser ? 'Run Checklist' : 'View Checklist'}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Automated Reports</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`relative flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <Bell className="w-4 h-4 text-rose-400" />
              <span>Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full font-mono tabular-nums leading-none animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: RBAC User Indicator + Settings + Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* User Badge / Role Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
                  currentUser.isSuperuser
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:border-emerald-500/70'
                    : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
                title="Account & Role Permissions"
              >
                {currentUser.isSuperuser ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <div className="text-left hidden lg:block max-w-[130px] truncate">
                  <div className="font-semibold text-white leading-tight truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-none mt-0.5 truncate">
                    {currentUser.isSuperuser ? 'Superuser' : 'Read-Only'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5 shrink-0" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 text-slate-900 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      Current Active Account
                    </span>
                    <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
                    <div className="text-slate-500 text-[11px] font-mono">{currentUser.email}</div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {currentUser.isSuperuser ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          SUPERUSER (Full Edit & Audit Access)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Eye className="w-3 h-3 text-amber-600" />
                          VIEWER (Read-Only Mode)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Switch to Authorized Superusers */}
                  <div className="px-3.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Authorized Superusers
                  </div>
                  {superusers.map((su) => (
                    <button
                      key={su.email}
                      type="button"
                      onClick={() => {
                        onSwitchUser(su.email);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start justify-between gap-2 transition-colors ${
                        currentUser.email.toLowerCase() === su.email.toLowerCase() ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{su.name}</div>
                        <div className="text-[10px] text-slate-500">{su.role}</div>
                        <div className="text-[10px] font-mono text-slate-400">{su.email}</div>
                      </div>
                      {currentUser.email.toLowerCase() === su.email.toLowerCase() && (
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />
                      )}
                    </button>
                  ))}

                  {/* Test Read-Only Mode */}
                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchUser('guest.viewer@alanahotels.com');
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-amber-50/70 text-slate-700 flex items-center justify-between transition-colors"
                    >
                      <div>
                        <div className="font-medium text-slate-900">Guest Auditor / Other Staff</div>
                        <div className="text-[10px] text-amber-700 font-medium">Read-Only Mode (Lihat Saja)</div>
                      </div>
                      <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings button */}
            {currentUser.isSuperuser && (
              <button
                onClick={openSettings}
                title="Logo, Notification & System Settings"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Action button */}
            {currentUser.isSuperuser ? (
              <button
                onClick={onNewChecklistClick}
                className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>New Checklist</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-1.5 whitespace-nowrap">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Read-Only Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile secondary tab strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`py-1 px-2.5 rounded ${activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-1 px-2.5 rounded ${activeTab === 'checklist' ? 'text-sky-400 font-semibold' : 'text-slate-400'}`}
          >
            {currentUser.isSuperuser ? 'Checklist' : 'View Checklist'}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-1 px-2.5 rounded ${activeTab === 'reports' ? 'text-indigo-400 font-semibold' : 'text-slate-400'}`}
          >
            Reports
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`relative py-1 px-2.5 rounded ${activeTab === 'alerts' ? 'text-rose-400 font-semibold' : 'text-slate-400'}`}
          >
            Alerts
            {unreadAlertsCount > 0 && (
              <span className="ml-1 text-[10px] text-rose-400 font-bold">
                ({unreadAlertsCount})
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
