import React, { useState, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import { BookOpen, Sun, Moon, Eye } from 'lucide-react';
import { hasManagerSeenLatestUpdate } from '../../data/updateNotes';
import { triggerHaptic } from '../../utils/haptics';

export const TopHeader: React.FC = () => {
  const {
    currentGW,
    squad,
    players,
    authUser,
    setIsAuthModalOpen,
    openRulesModal,
    theme,
    toggleTheme,
    isDemoMode,
    exitDemoMode,
    calculationResult,
    leagues,
  } = useFPL();

  const userLeagueMember = leagues
    .find((l) => l.isGlobal)
    ?.members.find((m) => m.id === authUser?.id);
  const totalUserPoints = userLeagueMember ? userLeagueMember.totalPoints : (calculationResult?.totalPoints || 0);

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/10 select-none transition-colors">
      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="w-full bg-amber-500/20 border-b border-amber-500/30 text-amber-200 px-3 py-1 text-[11px] flex items-center justify-between font-bold">
          <div className="flex items-center gap-1.5">
            <Eye className="w-3 h-3 text-amber-400 shrink-0" />
            <span>Demo Mode (Sample Squad)</span>
          </div>
          <button
            onClick={exitDemoMode}
            className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.2 rounded font-black cursor-pointer"
          >
            Sign In
          </button>
        </div>
      )}

      {/* Main Container: Single Compact Row */}
      <div className="w-full px-3 py-2 flex items-center justify-between gap-2">
        {/* Left: Crest + Identity + Lineup Status */}
        <div className="flex items-center gap-2 min-w-0">
          {/* Crest Logo */}
          <div
            onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
            className="relative w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 p-1 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
          >
            <img
              src="/kcl-logo.png"
              alt="KCL"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Text Hierarchy */}
          <div className="min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-1 leading-tight">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                KCL
              </span>
              <span
                onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
                className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate cursor-pointer hover:text-slate-800 dark:hover:text-slate-200"
              >
                @{authUser?.username || 'theiulius'}
              </span>
            </div>

            <div className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[160px] leading-tight mt-0.5">
              GW {currentGW} · {authUser?.teamName || squad.teamName}
            </div>
          </div>
        </div>

        {/* Right: Rules ('წესები') + Theme Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rules Button with "წესები (icon)" */}
          <button
            onClick={() => openRulesModal('rules')}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs relative"
            title="ტურნირის წესები & სიახლეები"
          >
            <span>წესები</span>
            <BookOpen className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
            {authUser?.id && !hasManagerSeenLatestUpdate(authUser.id) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* Row 2: GW PTS (Left) & TOTAL (Right) Split Boxes */}
      <div className="px-3 pb-2 pt-0">
        <div className="grid grid-cols-2 gap-2">
          {/* GW PTS Capsule */}
          <div className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-center">
            <span className="text-[9.5px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">
              GW PTS
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums leading-tight mt-1">
              {calculationResult?.totalPoints ?? 0}
            </span>
          </div>

          {/* TOTAL Points Capsule */}
          <div className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-center">
            <span className="text-[9.5px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">
              TOTAL
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums leading-tight mt-1">
              {totalUserPoints}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
