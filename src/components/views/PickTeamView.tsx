import React, { useState, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { PlayerCard } from '../pitch/PlayerCard';
import { PlayerActionSheet } from '../pitch/PlayerActionSheet';
import { getFormationLayout } from '../../engine/formations';
import { ChipType } from '../../types/fpl';
import { Zap, CheckCircle, Loader2, AlertCircle, ChevronDown, ChevronUp, Lock, ArrowLeft, ArrowRight, Clock, Award } from 'lucide-react';
import { validateSquadComposition } from '../../engine/scoring';
import confetti from 'canvas-confetti';
import { TripleCaptainIcon, BenchBoostIcon, WildcardIcon } from '../icons/ChipIcons';

export const PickTeamView: React.FC = () => {
  const {
    squad,
    players,
    activateChip,
    teamValue,
    freeTransfersRemaining,
    saveSquad,
    setActiveTab,
    isSquadLocked,
    isReferee,
    isDemoMode,
    currentGW,
    reorderBenchPlayer,
    deadline,
  } = useFPL();

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!deadline) {
      setTimeLeft('');
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

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(squad.players, players);
  const [showCompDetails, setShowCompDetails] = useState<boolean>(!comp.isValid && squad.players.length > 0);

  const layout = getFormationLayout(squad.players, players);
  const benchSlots = [1, 2, 3];

  const chips: { id: ChipType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'triple_captain', label: 'Triple Captain', icon: TripleCaptainIcon },
    { id: 'bench_boost', label: 'Bench Boost', icon: BenchBoostIcon },
    { id: 'wildcard', label: 'Wildcard', icon: WildcardIcon },
  ];

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Squad incomplete: Need 1 GK, 3 DEF, 3 MID, 2 FWD!');
      setShowCompDetails(true);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveSquad(undefined, true);
      if (res.success) {
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
        });
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        setErrorMessage(res.message || 'Failed to save lineup');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save lineup to database');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = squad.players.filter((sp) => Boolean(players[sp.playerId])).length;

  return (
    <div className="flex flex-col pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-2 md:pt-4 max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* ======================================================== */}
      {/* SECTION 1: UPPER CANVAS (Tactical Pitch & Quick Metrics) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-2.5">
        {/* Tournament Brand Header */}
        <div className="flex flex-col items-center justify-center pt-1 pb-1">
          <img
            src="/kcl-logo.png"
            alt="Komarovi Champions League"
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border border-white/10 shadow-md object-contain"
          />
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.2em] text-slate-200">
              Komarovi Champions League
            </span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300 border border-white/10">
              GW {currentGW}
            </span>
          </div>
        </div>

        {/* Trusted Referee Prompt Banner */}
        {isReferee && (
          <div className="p-3 md:p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 flex-shrink-0 text-amber-400" />
              <div>
                <span className="font-black text-amber-300 mr-1.5 uppercase tracking-wide">
                  მსაჯის პანელი (Referee):
                </span>
                <span>თქვენ გაქვთ მატჩების შედეგების და სტატისტიკის შეყვანის უფლება.</span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('dev')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 ml-2 flex items-center gap-1"
            >
              <span>Match Console</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Lineup Locked Notification Banner */}
        {isSquadLocked && (
          <div className="p-2.5 md:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                {isDemoMode
                  ? 'Demo Mode: Browsing sample squad. Sign in or register to pick and customize your own squad.'
                  : `Lineups are locked for Gameweek ${currentGW}. Team changes are prohibited.`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-amber-500 text-slate-950">
              {isDemoMode ? 'Demo' : 'Locked'}
            </span>
          </div>
        )}

        {/* Monospace Quick Metrics Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 rounded-xl bg-white/95 dark:bg-zinc-950/80 border border-slate-200/90 dark:border-white/10 shadow-xs backdrop-blur-xs">
          <div className="flex items-center flex-wrap gap-2.5 sm:gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">VAL</span>
              <span className="font-bold text-slate-800 dark:text-slate-100">£{teamValue.toFixed(1)}m</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/15" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">BANK</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">£{squad.bank.toFixed(1)}m</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/15" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">FREE FT</span>
              <span className="font-bold text-sky-600 dark:text-cyan-400">{freeTransfersRemaining}</span>
            </div>
            {deadline && (
              <>
                <div className="h-3 w-[1px] bg-slate-200 dark:bg-white/15" />
                <div
                  className="flex items-center gap-1.5"
                  title={`Deadline: ${new Date(deadline.deadlineTime).toLocaleString()}`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">DEADLINE</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      isSquadLocked ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 text-amber-500/90" />
                    <span>{isSquadLocked ? 'Locked' : timeLeft}</span>
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Squad Status Toggle */}
          <button
            onClick={() => setShowCompDetails((prev) => !prev)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold border transition-colors flex items-center gap-1.5 ${
              comp.isValid
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            {comp.isValid ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                <span>Lineup Ready</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Squad Incomplete ({validCount}/9)</span>
              </>
            )}
            {showCompDetails ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>
        </div>

        {/* Collapsible Squad Composition Matrix */}
        {showCompDetails && (
          <div className="p-3 rounded-xl bg-white/95 dark:bg-zinc-950/60 border border-slate-200/90 dark:border-white/10 shadow-xs animate-fade-in space-y-2">
            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className={`p-1.5 rounded-lg border text-xs ${comp.gkCount === 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">GK</span>
                <span className="font-mono font-black text-xs">{comp.gkCount}/1</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.defCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">DEF</span>
                <span className="font-mono font-black text-xs">{comp.defCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.midCount === 3 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">MID</span>
                <span className="font-mono font-black text-xs">{comp.midCount}/3</span>
              </div>
              <div className={`p-1.5 rounded-lg border text-xs ${comp.fwdCount === 2 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'}`}>
                <span className="text-[9px] uppercase font-bold block text-slate-500 dark:text-slate-400">FWD</span>
                <span className="font-mono font-black text-xs">{comp.fwdCount}/2</span>
              </div>
            </div>

            {comp.exceededClubs && comp.exceededClubs.length > 0 && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between">
                <span>Max 2 players per class exceeded: {comp.exceededClubs.map((ec) => ec.clubId.replace('SCH_', '')).join(', ')}</span>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                >
                  Adjust
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tactical Pitch Surface (Bench decoupled to Section 2) */}
        <PitchView
          showPoints={false}
          renderBench={false}
          onCardClick={(id) => setActiveSheetPlayerId(id)}
        />
      </section>

      {/* Fine Dashed Divider between Sections */}
      <div className="w-full border-b border-dashed border-slate-200 dark:border-white/15 my-4" />

      {/* ======================================================== */}
      {/* SECTION 2: BOTTOM RIBBON (Unified Substitutes & Chips Dock) */}
      {/* ======================================================== */}
      <section className="flex flex-col space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 rounded-2xl bg-white/95 dark:bg-zinc-950/90 border border-slate-200/90 dark:border-white/10 backdrop-blur-md shadow-lg shadow-sky-950/5">
          {/* Left Column: Substitutes (Strictly 3 Reserves) */}
          <div className="md:col-span-7 flex flex-col justify-between md:border-r border-dashed border-slate-200 dark:border-white/15 md:pr-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                Substitutes ({layout.bench.length}/3)
              </span>
              <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
                Priority: Sub 1 enters 1st
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="flex flex-col items-center">
                      {/* Priority Tag Header & Reorder Controls */}
                      <div className="w-full flex items-center justify-between mb-1 px-1">
                        <span className={`text-[9px] font-black uppercase tracking-tight px-1.5 py-0.5 rounded-md ${
                          order === 1
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40'
                            : order === 2
                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        }`}>
                          {order === 1 ? '1st Sub ★' : order === 2 ? '2nd Sub' : '3rd Sub'}
                        </span>
                        {/* Quick Reorder Arrow Buttons */}
                        {!isSquadLocked && layout.bench.length > 1 && (
                          <div className="flex items-center gap-1">
                            {order > 1 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderBenchPlayer(sp.playerId, order - 1);
                                }}
                                title={`Promote to Sub ${order - 1}`}
                                className="p-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {order < layout.bench.length && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  reorderBenchPlayer(sp.playerId, order + 1);
                                }}
                                title={`Demote to Sub ${order + 1}`}
                                className="p-1 rounded bg-slate-200/80 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <PlayerCard
                        playerId={sp.playerId}
                        isStarter={false}
                        benchOrder={order}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        onCardClick={(id) => setActiveSheetPlayerId(id)}
                        showPoints={false}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-bench-${order}`}
                    onClick={() => setActiveTab('transfers')}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-slate-400 hover:border-sky-400 hover:bg-sky-50/50 cursor-pointer transition-all min-h-[90px]"
                  >
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Sub {order}</span>
                    <span className="text-[8px] text-sky-600 dark:text-emerald-400 mt-1 font-mono uppercase tracking-wider">+ Empty</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Available Chips with Metallic Shine */}
          <div className="md:col-span-5 flex flex-col justify-between pt-3 md:pt-0 border-t md:border-t-0 border-dashed border-slate-200 dark:border-white/15 md:pl-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Available Chips
              </span>
              {squad.activeChip && !squad.usedChips?.[squad.activeChip] && (
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 animate-pulse">
                  Active
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 md:grid-cols-1 gap-2 flex-1 items-stretch">
              {chips.map((chip) => {
                const Icon = chip.icon;
                const isUsed = Boolean(
                  squad.usedChips?.[chip.id] ||
                  (squad.gameweekChips && Object.values(squad.gameweekChips).includes(chip.id))
                );
                const isActive = !isUsed && squad.activeChip === chip.id;

                return (
                  <button
                    key={chip.id}
                    disabled={isUsed || isSquadLocked}
                    onClick={() => activateChip(chip.id)}
                    className={`group relative overflow-hidden flex flex-col md:flex-row items-center md:justify-between p-2 md:px-3 md:py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-sky-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                        : isUsed
                        ? 'bg-slate-100/80 dark:bg-black/40 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-white/5 opacity-50 cursor-not-allowed'
                        : isSquadLocked
                        ? 'bg-slate-100 dark:bg-black/30 text-slate-400 dark:text-slate-500 border-slate-200/80 dark:border-white/5 opacity-60 cursor-not-allowed'
                        : 'bg-slate-50/80 hover:bg-sky-50/70 text-slate-700 dark:bg-black/40 dark:hover:bg-black/60 dark:text-slate-200 border-slate-200/90 dark:border-white/10 hover:border-sky-400/60 dark:hover:border-emerald-500/40 shadow-xs active:scale-98'
                    }`}
                  >
                    {/* Metallic sweep shine */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none transition-transform" />
                    <div className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 relative z-10">
                      <div className={`p-1 rounded-lg ${isActive ? 'bg-white/20 text-white' : isUsed ? 'bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-slate-500' : 'bg-sky-500/10 text-sky-600 dark:bg-white/5 dark:text-slate-300'}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[10px] md:text-xs text-center md:text-left leading-tight">{chip.label}</span>
                    </div>
                    <span className={`text-[8px] md:text-[10px] font-mono mt-1 md:mt-0 relative z-10 font-bold ${
                      isUsed ? 'text-rose-500 dark:text-rose-400' : isActive ? 'text-white' : 'text-sky-600 dark:text-slate-400'
                    }`}>
                      {isUsed ? '🔒 USED' : isActive ? 'ACTIVE' : 'READY'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error notification if save fails or squad invalid */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tactile Lineup Save Action */}
        <button
          onClick={handleSaveTeam}
          disabled={isSaving || !comp.isValid || isSquadLocked}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg ${
            !comp.isValid || isSquadLocked
              ? 'bg-slate-200 text-slate-500 border border-slate-300/80 dark:bg-slate-800 dark:text-slate-500 dark:border-white/5 cursor-not-allowed shadow-none'
              : 'bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
          }`}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Lineup...</span>
            </>
          ) : isSquadLocked ? (
            <span>Lineups Locked for GW {currentGW}</span>
          ) : saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Squad Saved Successfully!</span>
            </>
          ) : (
            <span>Save Team Lineup</span>
          )}
        </button>
      </section>

      {/* Modal Action Sheet for Selected Player */}
      {activeSheetPlayerId && (
        <PlayerActionSheet
          playerId={activeSheetPlayerId}
          onClose={() => setActiveSheetPlayerId(null)}
        />
      )}
    </div>
  );
};
