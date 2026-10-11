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
    teamValue,
    freeTransfersRemaining,
    deadline,
  } = useFPL();

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('None');
      return;
    }
    const updateCountdown = () => {
      const diff = new Date(deadline.deadlineTime).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Locked');
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        const secs = Math.floor((diff / 1000) % 60);
        setTimeLeft(`${mins}m ${secs}s`);
      }
    };
    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  return (
    <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800 select-none transition-colors">
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

      {/* Main Container */}
      <div className="w-full px-3 pt-2.5 pb-2 space-y-2">
        {/* Row 1: Manager Identity (Left) & Valuation Pills (Right) */}
        <div className="flex items-center justify-between gap-2">
          {/* Left: Crest + Identity + Lineup Status */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Crest Logo */}
            <div
              onClick={() => (isDemoMode ? exitDemoMode() : setIsAuthModalOpen(true))}
              className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center shrink-0 cursor-pointer active:scale-95 transition-all shadow-xs"
            >
              <img
                src="/kcl-logo.png"
                alt="KCL"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Text Hierarchy */}
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 leading-tight">
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

              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[170px] sm:max-w-[220px] leading-tight mt-0.5">
                GW {currentGW} · {authUser?.teamName || squad.teamName}
              </div>
            </div>
          </div>

          {/* Right: VAL & BANK Glass Capsules */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* VAL Capsule */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 min-w-[56px] text-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none">
                VAL
              </span>
              <span className="text-xs sm:text-[13px] font-mono font-bold text-slate-900 dark:text-white tabular-nums leading-tight mt-1">
                £{teamValue.toFixed(1)}m
              </span>
            </div>

            {/* BANK Capsule */}
            <div className="flex flex-col items-center justify-center px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 min-w-[56px] text-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none">
                BANK
              </span>
              <span className="text-xs sm:text-[13px] font-mono font-bold text-slate-900 dark:text-white tabular-nums leading-tight mt-1">
                £{squad.bank.toFixed(1)}m
              </span>
            </div>

            {/* Quick Action Utilities (Rules & Theme) */}
            <div className="flex flex-col gap-1 ml-0.5">
              <button
                onClick={() => openRulesModal('rules')}
                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer relative"
                title="Rules & Updates"
              >
                <BookOpen className="w-3 h-3" />
                {authUser?.id && !hasManagerSeenLatestUpdate(authUser.id) && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
              <button
                onClick={toggleTheme}
                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
                title="Toggle Theme"
              >
                {theme === 'dark' ? (
                  <Sun className="w-3 h-3 text-amber-400" />
                ) : (
                  <Moon className="w-3 h-3 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: FT (Left) & DEADLINE (Right) Full-Width Split Pills */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          {/* FT Capsule */}
          <div className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none">
              FT
            </span>
            <span className="text-sm sm:text-base font-mono font-black text-slate-900 dark:text-white tabular-nums leading-tight mt-1">
              {freeTransfersRemaining}
            </span>
          </div>

          {/* DEADLINE Capsule */}
          <div className="flex flex-col items-center justify-center py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-center">
            <span className="text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider leading-none">
              DEADLINE
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white tabular-nums leading-tight mt-1 truncate max-w-full">
              {timeLeft || 'Locked'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
