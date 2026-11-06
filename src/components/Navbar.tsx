import React from 'react';
import { 
  CheckSquare, 
  LayoutDashboard, 
  FileText, 
  Bell, 
  Settings,
  Image as ImageIcon
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'checklist' | 'reports' | 'alerts';
  setActiveTab: (tab: 'dashboard' | 'checklist' | 'reports' | 'alerts') => void;
  unreadAlertsCount: number;
  openSettings: () => void;
  onNewChecklistClick: () => void;
  logoUrl?: string;
  propertyName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unreadAlertsCount,
  openSettings,
  onNewChecklistClick,
  logoUrl,
  propertyName = 'The Alana Hotel & Conference Center Sentul',
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
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
              <span className="text-[11px] text-slate-400 block font-normal leading-none mt-0.5 truncate max-w-[180px] sm:max-w-xs">
                {propertyName}
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (SOP items & points removed as requested) */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-300">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
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
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'checklist'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'hover:text-white hover:bg-slate-800/60 text-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-sky-400" />
              <span>Run Checklist</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
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
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0 ${
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

          {/* Zone 3: 1 Primary Action + Settings */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openSettings}
              title="Logo, Notification & System Settings"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Settings / Logo</span>
            </button>

            <button
              onClick={onNewChecklistClick}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <CheckSquare className="w-4 h-4" />
              <span>New Checklist</span>
            </button>
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
            Checklist
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
