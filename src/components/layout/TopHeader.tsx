import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Sparkles, Wrench, Shirt, ArrowLeftRight, Zap, Trophy, Calendar, Sun, Moon, Eye, Shield, BookOpen, Users, UserCheck, Award } from 'lucide-react';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DESKTOP_TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev Mode', icon: Wrench },
];

import { hasManagerSeenLatestUpdate } from '../../data/updateNotes';

export const TopHeader: React.FC = () => {
  const {
    currentGW,
    calculationResult,
    squad,
    setActiveTab,
    activeTab,
    isDevAuthenticated,
    isModerator,
    isReferee,
    authUser,
    setIsAuthModalOpen,
    setIsRulesModalOpen,
    openRulesModal,
    leagues,
    currentManager,
    theme,
    toggleTheme,
    isDemoMode,
    exitDemoMode,
  } = useFPL();

  const userLeagueMember = leagues.flatMap((l) => l.members).find(
    (m) => m.id === currentManager?.id || m.id === 'user' || (authUser && m.id === authUser.id)
  );
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (calculationResult.totalPoints || 0);
  const overallRank = userLeagueMember ? `#${userLeagueMember.rank}` : '-';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0c121e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 shadow-xs select-none transition-colors duration-200">
      {/* Demo Mode Sticky Caption Bar */}
      {isDemoMode && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-3 py-1.5 text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Eye className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-[11px] md:text-xs">
              <strong className="text-amber-300 uppercase tracking-wide mr-1 font-black">Demo Mode:</strong>
              Browsing locked sample squad. All mutations disabled.
            </span>
          </div>
          <button
            onClick={exitDemoMode}
            className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/30 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-2"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Top branding line */}
      <div className="w-full max-w-6xl mx-auto px-3.5 md:px-6 pt-2.5 pb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 md:space-x-3">
          <img
            src="/kcl-logo.png"
            alt="KCL Logo"
            className="w-9 h-9 md:w-10 md:h-10 rounded-xl object-contain shadow-xs flex-shrink-0 border border-slate-200 dark:border-white/10"
          />
          <div>
            <div className="flex items-center space-x-1.5 md:space-x-2">
              <h1 className="text-sm md:text-base font-black tracking-wider text-slate-900 dark:text-white uppercase font-display leading-tight">
                KCL
              </h1>
              <button
                type="button"
                onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
                className="text-[9px] md:text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.10] hover:border-emerald-500/50 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all cursor-pointer shrink-0"
                title="Click to switch account"
              >
                {isDemoMode ? 'Demo' : authUser ? `@${authUser.username}` : 'Sign In'}
              </button>
            </div>

            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                GW {currentGW}
              </span>
              <span className="text-slate-300 dark:text-slate-700 text-[10px]">•</span>
              <span className="truncate max-w-[120px] sm:max-w-[200px] md:max-w-[320px] text-[11px] md:text-xs font-semibold text-slate-700 dark:text-slate-300">
                {authUser?.teamName || squad.teamName}
              </span>
              {squad.activeChip && (
                <span className="px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-400/30 flex items-center gap-0.5 shrink-0 shadow-xs">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>{squad.activeChip.replace('_', ' ')}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Rules & Scoring System Modal Button */}
          <button
            onClick={() => openRulesModal('rules')}
            className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.09] cursor-pointer relative"
            title="ტურნირის წესები და ქულები / Official Rules & Scoring"
            aria-label="Tournament Rules"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <span className="font-bold text-[11px] sm:text-xs">წესები</span>
            {authUser?.id && !hasManagerSeenLatestUpdate(authUser.id) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-slate-900 animate-pulse shrink-0" title="ახალი განახლება!" />
            )}
          </button>

          {/* Dedicated Managers Portal Button (Admins Only) */}
          {isModerator && (
            <button
              onClick={() => setActiveTab('managers')}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'managers'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.09] text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/[0.09]'
              }`}
              title="მენეჯერების მართვა / Registered Managers & Approvals"
              aria-label="Managers"
            >
              <UserCheck className={`w-3.5 h-3.5 flex-shrink-0 ${activeTab === 'managers' ? 'text-slate-950' : 'text-amber-500'}`} />
              <span className="font-bold">managers</span>
            </button>
          )}

          {/* Dedicated Match Console Button (Referees Only) */}
          {isReferee && !isModerator && (
            <button
              onClick={() => setActiveTab('dev')}
              className={`p-1.5 md:px-3 md:py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'dev'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs ring-2 ring-amber-400/50'
                  : 'bg-amber-500/15 dark:bg-amber-500/15 border-amber-500/30 text-amber-500 dark:text-amber-400 hover:bg-amber-500/25'
              }`}
              title="მატჩის კონსოლი (მსაჯი) / Matchday Referee Console"
              aria-label="Match Console"
            >
              <Award className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 dark:text-amber-400" />
              <span className="hidden sm:inline font-bold">Match Console</span>
            </button>
          )}

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 md:p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 md:w-4 md:h-4 text-slate-700" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop Navigation Tabs Bar */}
      <nav className="hidden md:flex items-center justify-center bg-white/80 dark:bg-[#070b12] border-t border-sky-100 dark:border-slate-800/80 select-none">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-center gap-1.5 px-6 py-1.5">
          {DESKTOP_TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee).map((tab) => {
            const isDev = tab.id === 'dev';
            const Icon = isDev ? (isModerator ? Shield : Award) : tab.icon;
            const isActive = activeTab === tab.id;
            const displayLabel = isDev ? (isModerator ? 'Mod Console' : 'Match Console') : tab.label;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isActive
                    ? 'bg-sky-500 text-white border-sky-400 font-bold shadow-md shadow-sky-500/25 dark:bg-white/[0.09] dark:text-white dark:border-white/[0.14]'
                    : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-sky-50/70 hover:text-sky-700 dark:hover:bg-white/[0.04] dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? (isDev ? 'text-amber-300' : 'text-white') : 'text-slate-400'}`} />
                <span>{displayLabel}</span>
                {isDev && (isDevAuthenticated || isReferee) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Gameweek Quick Metric Bar - sleek frosted glass strip (hidden on mobile when on team tab to eliminate container duplication) */}
      {activeTab !== 'transfers' && (
        <div className={`w-full bg-slate-100/70 dark:bg-white/[0.02] backdrop-blur-md border-t border-slate-200/60 dark:border-white/5 py-1 text-center text-xs ${activeTab === 'team' ? 'hidden md:block' : ''}`}>
          <div className="max-w-6xl mx-auto grid grid-cols-4 divide-x divide-slate-200/50 dark:divide-white/5 px-1 md:px-6">
            <div>
              <span className="block text-[8px] md:text-[9px] text-slate-400 uppercase font-bold tracking-wider">GW</span>
              <span className="text-[11px] md:text-xs font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                {calculationResult.totalPoints}
              </span>
            </div>
            <div>
              <span className="block text-[8px] md:text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</span>
              <span className="text-[11px] md:text-xs font-black font-mono tabular-nums text-slate-900 dark:text-white">
                {totalUserPoints}
              </span>
            </div>
            <div>
              <span className="block text-[8px] md:text-[9px] text-slate-400 uppercase font-bold tracking-wider">Rank</span>
              <span className="text-[11px] md:text-xs font-black font-mono tabular-nums text-sky-600 dark:text-sky-400">
                {overallRank}
              </span>
            </div>
            <div>
              <span className="block text-[8px] md:text-[9px] text-slate-400 uppercase font-bold tracking-wider">Bank</span>
              <span className="text-[11px] md:text-xs font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
                £{squad.bank.toFixed(1)}m
              </span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
