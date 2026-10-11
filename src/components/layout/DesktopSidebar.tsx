import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import {
  Shirt,
  ArrowLeftRight,
  Users,
  Trophy,
  Calendar,
  Shield,
  Award,
  BookOpen,
  Sun,
  Moon,
  Eye,
  UserCheck,
  Zap,
} from 'lucide-react';
import { hasManagerSeenLatestUpdate } from '../../data/updateNotes';

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'team', label: 'My Squad', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'players', label: 'Player Stats', icon: Users },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'fixtures', label: 'Match Center', icon: Calendar },
];

export const DesktopSidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentGW,
    squad,
    authUser,
    isModerator,
    isReferee,
    isDevAuthenticated,
    isDemoMode,
    exitDemoMode,
    setIsAuthModalOpen,
    openRulesModal,
    theme,
    toggleTheme,
  } = useFPL();

  return (
    <aside className="hidden lg:flex flex-col w-[240px] xl:w-[260px] h-screen sticky top-0 border-r border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 backdrop-blur-2xl z-40 select-none overflow-y-auto justify-between p-4 transition-colors">
      {/* Top Branding & Team Status */}
      <div className="space-y-4">
        {/* Header Branding */}
        <div className="flex items-center gap-3 px-1">
          <div className="relative">
            <img
              src="/kcl-logo.png"
              alt="KCL Logo"
              className="w-10 h-10 rounded-xl object-contain border border-slate-200 dark:border-slate-800 shadow-xs"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-display">
                KCL Fantasy
              </h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                GW{currentGW}
              </span>
            </div>
            <p className="text-[9px] font-mono tracking-widest text-slate-400 dark:text-slate-500 font-bold uppercase mt-0.5">
              Command Center
            </p>
          </div>
        </div>

        {/* Manager Profile Capsule */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md transition-all">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Manager
              </p>
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                {authUser?.managerName || authUser?.username || 'Guest Manager'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
              className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-sky-500/40 transition-all cursor-pointer shrink-0 shadow-2xs"
            >
              {isDemoMode ? 'Exit Demo' : authUser ? 'Switch' : 'Login'}
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
              {authUser?.teamName || squad.teamName}
            </span>
            {squad.activeChip && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-400/30">
                <Zap className="w-2.5 h-2.5" />
                <span>{squad.activeChip === 'triple_captain' ? 'TC' : squad.activeChip === 'bench_boost' ? 'BB' : 'WC'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Global Navigation Links */}
        <nav className="space-y-1">
          <div className="px-2 pb-1 text-[9.5px] uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500">
            Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 border border-blue-200/80 dark:border-sky-500/20 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-sky-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-105 ${
                      isActive ? 'text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-sky-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-sky-400" />
                )}
              </button>
            );
          })}

          {/* Dedicated Managers Portal (Admins) */}
          {isModerator && (
            <button
              onClick={() => setActiveTab('managers')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                activeTab === 'managers'
                  ? 'bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30 font-black shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-300 hover:bg-amber-500/10 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-amber-500" />
                <span>Managers Portal</span>
              </div>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-500">
                ADMIN
              </span>
            </button>
          )}

          {/* Dev / Match Console (Moderators & Referees) */}
          {(isModerator || isReferee) && (
            <button
              onClick={() => setActiveTab('dev')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer group ${
                activeTab === 'dev'
                  ? 'bg-blue-50 text-blue-600 dark:bg-sky-500/10 dark:text-sky-400 border border-blue-200/80 dark:border-sky-500/20 font-black shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isModerator ? <Shield className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                <span>{isModerator ? 'Mod Console' : 'Match Console'}</span>
              </div>
              {(isDevAuthenticated || isReferee) && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Bottom Utility Controls */}
      <div className="space-y-2 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Demo Mode</span>
            </span>
            <button
              onClick={exitDemoMode}
              className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 text-[10px] font-black cursor-pointer"
            >
              Exit
            </button>
          </div>
        )}

        {/* Rules & Updates Button */}
        <button
          onClick={() => openRulesModal('rules')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/20 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Rules & Scoring</span>
          </div>
          {authUser?.id && !hasManagerSeenLatestUpdate(authUser.id) && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 hover:border-blue-200 dark:hover:border-sky-500/20 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
            <span>{theme === 'dark' ? 'Light Appearance' : 'Dark Appearance'}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
            {theme}
          </span>
        </button>

        {/* Watermark */}
        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-mono text-center pt-2">
          KCL • Theiulius & Chaga
        </p>
      </div>
    </aside>
  );
};
