import React, { useState, useEffect, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { PitchView } from '../pitch/PitchView';
import { PlayerActionSheet } from '../pitch/PlayerActionSheet';
import { SubstitutesDrawer } from '../pitch/SubstitutesDrawer';
import { ActionPanel } from '../layout/ActionPanel';
import { getFormationLayout } from '../../engine/formations';
import { validateSquadComposition, calculateGameweekSquadPoints } from '../../engine/scoring';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  CheckCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import confetti from 'canvas-confetti';

export const PickTeamView: React.FC = () => {
  const {
    squad,
    players,
    currentGW,
    fixtures,
    calculationResult,
    saveSquad,
    setActiveTab,
    isSquadLocked,
    isDemoMode,
  } = useFPL();

  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  useEffect(() => {
    setSelectedGW(currentGW);
  }, [currentGW]);

  const isPastGW = selectedGW < currentGW;

  const activeSquadPlayers = useMemo(() => {
    if (!isPastGW) {
      return squad.players;
    }
    return squad.gameweekSquads && squad.gameweekSquads[selectedGW] && squad.gameweekSquads[selectedGW].length > 0
      ? squad.gameweekSquads[selectedGW]
      : [];
  }, [isPastGW, squad.players, squad.gameweekSquads, selectedGW]);

  const activeGWChip = useMemo(() => {
    if (!isPastGW) {
      return squad.activeChip;
    }
    return squad.gameweekChips && squad.gameweekChips[selectedGW] !== undefined
      ? squad.gameweekChips[selectedGW]
      : null;
  }, [isPastGW, squad.activeChip, squad.gameweekChips, selectedGW]);

  const activeCalculation = useMemo(() => {
    if (!isPastGW) {
      return calculationResult;
    }
    return calculateGameweekSquadPoints(
      activeSquadPlayers,
      players,
      selectedGW,
      activeGWChip,
      0,
      1,
      fixtures,
      true
    );
  }, [isPastGW, calculationResult, activeSquadPlayers, players, selectedGW, activeGWChip, fixtures]);

  const [activeSheetPlayerId, setActiveSheetPlayerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const comp = validateSquadComposition(activeSquadPlayers, players, selectedGW);
  const layout = getFormationLayout(activeSquadPlayers, players, selectedGW);
  const benchSlots = [1, 2, 3];

  const handleSaveTeam = async () => {
    if (!comp.isValid) {
      setErrorMessage(comp.message || 'Squad incomplete: Need 1 GK, 3 DEF, 3 MID, 2 FWD!');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveSquad(undefined, true);
      if (res.success) {
        triggerHaptic('success');
        setSaveSuccess(true);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
        });
        setTimeout(() => setSaveSuccess(false), 2500);
      } else {
        triggerHaptic('warning');
        setErrorMessage(res.message || 'Failed to save lineup');
        setTimeout(() => setErrorMessage(null), 4000);
      }
    } catch (err: any) {
      triggerHaptic('warning');
      setErrorMessage(err?.message || 'Failed to save lineup to database');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full min-h-full lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] items-start transition-colors">
      {/* ======================================================== */}
      {/* MIDDLE COLUMN: THE PITCH CANVAS (Visual Hero)            */}
      {/* ======================================================== */}
      <section className="w-full min-w-0 flex flex-col items-center px-0 sm:px-3 md:px-6 py-2 md:py-4">
        {/* Minimalist Tactical Gameweek Stepper Bar */}
        <div className="w-full max-w-4xl px-2 sm:px-0 flex items-center justify-between gap-2 mb-2">
          {/* GW Selector Capsule */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] backdrop-blur-md shadow-xs">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedGW((prev) => Math.max(1, prev - 1));
              }}
              disabled={selectedGW <= 1}
              aria-label="Previous Gameweek"
              className="p-1 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-1.5 min-w-0">
              <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">
                GW {selectedGW}
              </span>
              <span
                className={`text-[8.5px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                  selectedGW === currentGW
                    ? 'bg-slate-100 dark:bg-white/10 text-slate-800 dark:text-zinc-200 border-slate-200 dark:border-white/10'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/10'
                }`}
              >
                {selectedGW === currentGW ? 'LIVE' : 'ARCHIVE'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedGW((prev) => Math.min(currentGW, prev + 1));
              }}
              disabled={selectedGW >= currentGW}
              aria-label="Next Gameweek"
              className="p-1 rounded-lg hover:bg-slate-200/80 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Score Capsule on Middle Column */}
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-xl text-xs font-black font-mono tabular-nums bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 shadow-2xs"
              title="Gameweek Score"
            >
              {activeCalculation.totalPoints} PTS
            </span>

            {isPastGW && (
              <button
                type="button"
                onClick={() => setSelectedGW(currentGW)}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 dark:text-sky-300 border border-sky-400/30 text-[11px] font-bold transition-all cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>Return to GW {currentGW}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Mandatory Position Change Alert */}
        {!isPastGW && comp.hasPositionChangedPlayers && (
          <div className="lg:hidden w-full max-w-4xl px-2 mb-2">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between gap-2 animate-pulse shadow-sm">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate text-[11px]">
                  სავალდებულოა ტრანსფერი ({comp.positionChangedPlayers?.[0]?.name?.split(' ')[0]})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('transfers')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-black shrink-0 cursor-pointer"
              >
                ტრანსფერები →
              </button>
            </div>
          </div>
        )}

        {/* Read-Only Notice for Past Gameweeks without Lineup */}
        {isPastGW && activeSquadPlayers.length === 0 && (
          <div className="w-full max-w-4xl px-2 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-[11px]">No lineup was registered for Gameweek {selectedGW} (0 PTS).</span>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TACTICAL PITCH CANVAS (Full Edge-to-Edge Hero)           */}
        {/* ======================================================== */}
        <div className="w-full max-w-4xl flex flex-col items-center">
          <PitchView
            showPoints={isPastGW}
            renderBench={false}
            onCardClick={(id) => setActiveSheetPlayerId(id)}
            customSquad={activeSquadPlayers}
            customCalculation={activeCalculation}
            selectedGW={selectedGW}
            readOnly={isPastGW}
          />
        </div>

        {/* ======================================================== */}
        {/* SUBSTITUTES: Desktop Tactical Dock & Mobile Bottom Sheet */}
        {/* ======================================================== */}
        <div className="w-full max-w-4xl">
          <SubstitutesDrawer
            layout={layout}
            benchSlots={benchSlots}
            onCardClick={(id) => setActiveSheetPlayerId(id)}
            showPoints={isPastGW}
            activeCalculation={activeCalculation}
            selectedGW={selectedGW}
            readOnly={isPastGW}
          />
        </div>

        {/* Mobile Primary Action Button Dock */}
        <div className="lg:hidden w-full max-w-4xl px-2 mt-3 pb-2">
          {errorMessage && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-bold mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isPastGW ? (
            <button
              type="button"
              onClick={() => setSelectedGW(currentGW)}
              className="w-full py-3 rounded-2xl font-black text-xs uppercase tracking-wider bg-sky-500 text-slate-950 flex items-center justify-center gap-2 shadow-md"
            >
              <Clock className="w-4 h-4" />
              <span>Return to GW {currentGW}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveTeam}
              disabled={isSaving || !comp.isValid || isSquadLocked}
              className={`w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
                isSquadLocked
                  ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed shadow-none'
                  : !comp.isValid
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30 cursor-not-allowed shadow-none'
                  : 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 border border-transparent dark:border-white/20'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isSquadLocked ? (
                <span>Locked for GW {currentGW}</span>
              ) : comp.hasPositionChangedPlayers ? (
                <span>⚠️ სავალდებულოა ტრანსფერი</span>
              ) : saveSuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Team Lineup</span>
              )}
            </button>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: ACTION PANEL (Sports Command Center)       */}
      {/* ======================================================== */}
      <ActionPanel
        selectedGW={selectedGW}
        setSelectedGW={setSelectedGW}
        activeCalculation={activeCalculation}
        comp={comp}
        activeSquadPlayers={activeSquadPlayers}
        isPastGW={isPastGW}
        activeGWChip={activeGWChip}
      />

      {/* Player Action Sheet Modal */}
      {activeSheetPlayerId && (
        <PlayerActionSheet
          playerId={activeSheetPlayerId}
          onClose={() => setActiveSheetPlayerId(null)}
          selectedGW={selectedGW}
          readOnly={isPastGW}
          customCalculation={activeCalculation}
        />
      )}
    </div>
  );
};
