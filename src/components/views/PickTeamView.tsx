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
  Lock,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

export const PickTeamView: React.FC = () => {
  const {
    squad,
    players,
    currentGW,
    fixtures,
    calculationResult,
    setActiveTab,
    isSquadLocked,
    isDemoMode,
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
  const [isPrimaryExpanded, setIsPrimaryExpanded] = useState(false);

  const comp = validateSquadComposition(activeSquadPlayers, players, selectedGW);
  const layout = getFormationLayout(activeSquadPlayers, players, selectedGW);
  const benchSlots = [1, 2, 3];

  return (
    <div className="w-full flex-1 min-h-0 overflow-hidden overscroll-none flex flex-col lg:h-auto lg:overflow-visible lg:grid lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px] items-start transition-colors">
      {/* ======================================================== */}
      {/* MIDDLE COLUMN: THE PITCH CANVAS (Visual Hero)            */}
      {/* ======================================================== */}
      <section className="w-full min-w-0 flex-1 min-h-0 overflow-hidden flex flex-col justify-between px-0 sm:px-3 md:px-6 py-1 pb-[calc(240px+env(safe-area-inset-bottom,0px))] lg:pb-4 lg:overflow-visible">
        {/* Minimalist Tactical Gameweek Stepper Bar */}
        <div className="w-full max-w-4xl px-2 sm:px-0 flex items-center justify-between gap-2 mb-2">
          {/* Left: GW Selector Capsule */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black border border-white/10 shadow-xs h-9 shrink-0">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setSelectedGW((prev) => Math.max(1, prev - 1));
              }}
              disabled={selectedGW <= 1}
              aria-label="Previous Gameweek"
              className="p-1 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-1 min-w-0">
              <span className="text-xs font-black uppercase tracking-tight text-white whitespace-nowrap">
                GW {selectedGW}
              </span>
              <span
                className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  selectedGW === currentGW
                    ? 'bg-red-950/40 text-red-400 border-red-900/50'
                    : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                }`}
              >
                {selectedGW === currentGW && (
                  <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse shrink-0" />
                )}
                <span>{selectedGW === currentGW ? 'LIVE' : 'ARCHIVE'}</span>
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
              className="p-1 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Gameweek Kickoff Deadline Capsule (Above right corner of pitch) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              className="px-2.5 py-1 rounded-2xl text-xs font-mono font-bold bg-black text-white border border-white/10 shadow-xs h-9 flex items-center gap-1.5"
              title="Gameweek Kickoff Deadline"
            >
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="text-[10px] text-zinc-400 font-sans font-semibold uppercase tracking-wider">
                Deadline:
              </span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">
                {timeLeft || 'Locked'}
              </span>
            </div>

            {isPastGW && (
              <button
                type="button"
                onClick={() => setSelectedGW(currentGW)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-2xl bg-black hover:bg-zinc-900 text-zinc-300 border border-white/10 text-[11px] font-bold transition-all cursor-pointer h-9 shadow-xs"
              >
                <Clock className="w-3 h-3 text-zinc-400" />
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

        {/* Mobile Backdrop Tap-to-Dismiss */}
        <AnimatePresence>
          {isPrimaryExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => {
                setIsPrimaryExpanded(false);
              }}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-xs z-35 pointer-events-auto"
            />
          )}
        </AnimatePresence>

        {/* ======================================================== */}
        {/* TACTICAL PITCH CANVAS (Full Edge-to-Edge Hero with Depth) */}
        {/* ======================================================== */}
        <motion.div
          animate={{
            scale: isPrimaryExpanded ? 0.96 : 1,
            opacity: isPrimaryExpanded ? 0.6 : 1,
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 40, mass: 0.8 }}
          style={{ willChange: 'transform' }}
          className="w-full max-w-4xl flex-1 min-h-0 lg:min-h-[580px] lg:h-[580px] xl:h-[640px] flex flex-col items-center justify-center origin-top transition-none overflow-hidden"
        >
          <PitchView
            showPoints={isPastGW}
            renderBench={false}
            onCardClick={(id) => setActiveSheetPlayerId(id)}
            customSquad={activeSquadPlayers}
            customCalculation={activeCalculation}
            selectedGW={selectedGW}
            readOnly={isPastGW}
          />
        </motion.div>

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
            isPrimaryExpanded={isPrimaryExpanded}
            setIsPrimaryExpanded={setIsPrimaryExpanded}
          />
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
