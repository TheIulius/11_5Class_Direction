import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { getFormationLayout } from '../../engine/formations';
import { PlayerCard } from './PlayerCard';
import { PlayerActionSheet } from './PlayerActionSheet';
import { InlineChipSelector } from './InlineChipSelector';
import { X, Sparkles, Shield, UserPlus, Plus } from 'lucide-react';

import { SquadPlayer } from '../../types/fpl';
import { GameweekCalculationResult } from '../../engine/scoring';

interface PitchViewProps {
  showPoints?: boolean;
  renderBench?: boolean;
  onCardClick?: (playerId: string) => void;
  customSquad?: SquadPlayer[];
  customCalculation?: GameweekCalculationResult;
  selectedGW?: number;
  readOnly?: boolean;
}

export const PitchView: React.FC<PitchViewProps> = ({
  showPoints = false,
  renderBench = true,
  onCardClick,
  customSquad,
  customCalculation,
  selectedGW,
  readOnly = false,
}) => {
  const {
    players,
    squad,
    selectedPlayerForSwap,
    setSelectedPlayerForSwap,
    calculationResult,
    setActiveTab,
    currentGW,
    isCurrentGWFinished,
  } = useFPL();

  const [internalSheetPlayerId, setInternalSheetPlayerId] = useState<string | null>(null);

  const handleCardClick = (id: string) => {
    if (onCardClick) {
      onCardClick(id);
    } else {
      setInternalSheetPlayerId(id);
    }
  };

  const activeCalc = customCalculation || calculationResult;
  const activeGW = selectedGW ?? currentGW;

  const activeSquadPlayers = customSquad
    ? customSquad
    : (showPoints && isCurrentGWFinished && squad.gameweekSquads?.[currentGW])
    ? squad.gameweekSquads[currentGW]
    : squad.players;

  const layout = getFormationLayout(activeSquadPlayers, players, activeGW);
  const starters = activeSquadPlayers.filter((p) => p.isStarter);

  // Bench slots (strictly 3 outfield reserves)
  const benchSlots = [1, 2, 3];

  // Calculate missing starter placeholder slots if starters < 6
  const getMissingSlots = () => {
    if (starters.length >= 6) return [];
    const slots: { x: number; y: number; role: string }[] = [];

    if (layout.gks.length === 0) {
      slots.push({ x: 50, y: 12, role: 'GK' });
    }

    if (layout.defs.length === 0) {
      slots.push({ x: 30, y: 32, role: 'DEF' });
      slots.push({ x: 70, y: 32, role: 'DEF' });
    } else if (layout.defs.length === 1 && starters.length < 5) {
      slots.push({ x: 72, y: 32, role: 'DEF' });
    }

    if (layout.mids.length === 0) {
      slots.push({ x: 30, y: 54, role: 'MID' });
      slots.push({ x: 70, y: 54, role: 'MID' });
    } else if (layout.mids.length === 1 && starters.length + slots.length < 6) {
      slots.push({ x: 72, y: 54, role: 'MID' });
    }

    if (layout.fwds.length === 0 && starters.length + slots.length < 6) {
      slots.push({ x: 50, y: 77, role: 'FWD' });
    }

    // Default template slots if starters is completely empty
    if (starters.length === 0) {
      return [
        { x: 50, y: 12, role: 'GK' },
        { x: 30, y: 32, role: 'DEF' },
        { x: 70, y: 32, role: 'DEF' },
        { x: 30, y: 54, role: 'MID' },
        { x: 70, y: 54, role: 'MID' },
        { x: 50, y: 77, role: 'FWD' },
      ];
    }

    // Trim or fill up to (6 - starters.length)
    return slots.slice(0, 6 - starters.length);
  };

  const missingSlots = getMissingSlots();

  // Strict captaincy validation: guaranteed at most 1 captain and 1 vice-captain on the pitch
  const singleCaptainId = useMemo(() => {
    const starterCap = activeSquadPlayers.find((sp) => sp.isStarter && sp.isCaptain);
    return starterCap ? starterCap.playerId : null;
  }, [activeSquadPlayers]);

  const singleViceCaptainId = useMemo(() => {
    const starterVice = activeSquadPlayers.find(
      (sp) => sp.isStarter && sp.isViceCaptain && sp.playerId !== singleCaptainId
    );
    return starterVice ? starterVice.playerId : null;
  }, [activeSquadPlayers, singleCaptainId]);

  return (
    <div className="relative w-full flex-1 overflow-hidden select-none flex flex-col">
      {/* Swap Mode Notification Floating Bar */}
      {!readOnly && selectedPlayerForSwap && (
        <div className="sticky top-2 z-30 mx-2 sm:mx-4 my-1.5 bg-amber-400 text-slate-950 px-3.5 py-2 rounded-2xl shadow-xl flex items-center justify-between border border-amber-300 font-black text-xs ring-2 ring-amber-400/40 backdrop-blur-md">
          <span className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping shrink-0" />
            <Sparkles className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            <span className="truncate">
              აირჩიეთ მეორე მოთამაშე {players[selectedPlayerForSwap]?.webName}-თან გასაცვლელად
            </span>
          </span>
          <button
            onClick={() => setSelectedPlayerForSwap(null)}
            className="p-1 hover:bg-black/15 rounded-full transition-colors ml-2 shrink-0 cursor-pointer"
            title="Cancel substitution"
          >
            <X className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      )}

      {/* Football Pitch Container with Rich Forest Green Natural Turf */}
      <div
        className="relative w-full flex-1 my-0 sm:my-1 rounded-2xl md:rounded-3xl overflow-hidden border border-emerald-950/20 dark:border-white/10 shadow-xl transition-all duration-300 bg-gradient-to-b from-[#225732] via-[#1b4b2a] to-[#153e22] dark:from-[#143d22] dark:via-[#10331b] dark:to-[#0c2815] flex flex-col justify-between"
      >
        {/* Faint Desaturated Center Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <img
            src="/kcl-logo-transparent.png"
            alt="Komarovi Champions League"
            className="w-[240px] sm:w-[280px] md:w-[320px] max-w-[70vw] opacity-[0.06] grayscale object-contain"
          />
        </div>

        {/* Pitch Chalk Lines (SVG) with Crisp Forest Pitch Markings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none fill-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Boundary Border */}
          <rect x="12" y="12" width="calc(100% - 24px)" height="calc(100% - 24px)" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" rx="14" />

          {/* Center Circle & Halfway Line */}
          <line x1="12" y1="50%" x2="calc(100% - 12px)" y2="50%" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="48" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <circle cx="50%" cy="50%" r="3" fill="rgba(255, 255, 255, 0.35)" />

          {/* Top Penalty Area (Goalkeeper Box) */}
          <rect x="24%" y="12" width="52%" height="70" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <rect x="36%" y="12" width="28%" height="30" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <circle cx="50%" cy="54" r="2.5" fill="rgba(255, 255, 255, 0.35)" />
          <path d="M 40% 82 C 45% 96, 55% 96, 60% 82" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />

          {/* Bottom Penalty Area */}
          <rect x="24%" y="calc(100% - 82px)" width="52%" height="70" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <rect x="36%" y="calc(100% - 42px)" width="28%" height="30" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <circle cx="50%" cy="calc(100% - 54px)" r="2.5" fill="rgba(255, 255, 255, 0.35)" />
          <path d="M 40% calc(100% - 82px) C 45% calc(100% - 96px), 55% calc(100% - 96px), 60% calc(100% - 82px)" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />

          {/* Corner Arcs */}
          <path d="M 12 26 A 14 14 0 0 0 26 12" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <path d="M calc(100% - 26px) 12 A 14 14 0 0 0 calc(100% - 12px) 26" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <path d="M 12 calc(100% - 26px) A 14 14 0 0 1 26 calc(100% - 12px)" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
          <path d="M calc(100% - 26px) calc(100% - 12px) A 14 14 0 0 1 calc(100% - 12px) calc(100% - 26px)" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
        </svg>

        {/* Pitch Top Bar: Chip Selector (Upper Left) & Formation (Upper Right) */}
        <div className="relative pt-2 px-3 flex items-center justify-between z-10">
          {/* Upper Left: Horizontal Sliding Chip Selector */}
          <InlineChipSelector
            selectedGW={activeGW}
            isPastGW={readOnly || (showPoints && isCurrentGWFinished)}
          />

          {/* Upper Right: Formation Pill */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`text-[9.5px] font-mono font-bold uppercase px-2 py-0.5 rounded-full backdrop-blur-md border flex items-center gap-1 ${
                layout.isValid
                  ? 'bg-black/40 text-slate-300 border-white/10'
                  : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
              }`}
            >
              <Shield className="w-2.5 h-2.5 opacity-70" />
              {layout.isValid ? layout.formationString : 'Incomplete'}
            </span>
          </div>
        </div>

        {/* Stadium Pitch Canvas with Dynamic Coordinates */}
        <div className="relative z-10 w-full flex-1 overflow-hidden my-0.5 sm:my-1">
          {/* Active Starters */}
          {layout.pitchPositions.map((pos) => {
            const sp = activeSquadPlayers.find((p) => p.playerId === pos.playerId);
            if (!sp) return null;

            return (
              <div
                key={pos.playerId}
                className="absolute transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex flex-col items-center"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-[8px] md:text-[9px] font-black uppercase text-gray-200 bg-black/50 px-1 rounded mb-0.5 tracking-wider border border-white/10 shadow-xs">
                  {pos.roleLabel}
                </span>
                <PlayerCard
                  playerId={sp.playerId}
                  isStarter={sp.isStarter}
                  benchOrder={sp.benchOrder}
                  isCaptain={sp.playerId === singleCaptainId}
                  isViceCaptain={sp.playerId === singleViceCaptainId}
                  onCardClick={handleCardClick}
                  showPoints={showPoints}
                  customCalculation={activeCalc}
                  selectedGW={activeGW}
                  readOnly={readOnly}
                />
              </div>
            );
          })}

          {/* Missing Starter Target Slots (Luminous Pulsing Dotted Rings) */}
          {!readOnly && missingSlots.map((slot, idx) => (
            <div
              key={`missing-${slot.role}-${idx}`}
              onClick={() => setActiveTab('transfers')}
              className="absolute transition-all duration-300 flex flex-col items-center cursor-pointer group"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="text-[8px] md:text-[9px] font-mono font-bold uppercase text-slate-200 bg-black/60 px-1.5 py-0.5 rounded-md mb-1 tracking-wider border border-white/10 shadow-xs">
                {slot.role}
              </span>
              <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-2xl border-2 border-dashed border-white/25 bg-white/[0.04] backdrop-blur-xs flex flex-col items-center justify-center text-white/70 group-hover:border-white/40 group-hover:bg-white/[0.08] group-hover:scale-105 transition-all shadow-inner">
                <Plus className="w-5 h-5 mb-0.5" />
                <span className="text-[8px] font-black uppercase tracking-wider">Add</span>
              </div>
            </div>
          ))}

          {/* Prompt banner if zero starters */}
          {starters.length === 0 && (
            <div className="absolute inset-x-4 bottom-6 z-20 flex justify-center pointer-events-none">
              <div className="bg-[#070b12]/90 backdrop-blur-2xl border border-white/15 rounded-3xl p-4 text-center max-w-sm pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <UserPlus className="w-4 h-4 text-white" />
                  <p className="text-xs font-black text-white uppercase tracking-wider">Starting Lineup Empty</p>
                </div>
                <p className="text-[11px] text-gray-300 mb-2.5">
                  Tap any slot or go to Transfers to build your starting 6.
                </p>
                <button
                  onClick={() => setActiveTab('transfers')}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Open Player Market
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Optional Bench Dugout Bar (rendered when renderBench is true) */}
        {renderBench && (
          <div className="relative z-10 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-700/60 dark:border-slate-800 pt-2 md:pt-2.5 pb-2.5 md:pb-3 px-2 md:px-6">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[10px] md:text-xs uppercase font-bold tracking-wider text-slate-200 flex items-center gap-1.5">
                Substitutes ({layout.bench.length}/3)
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                Auto-subs: Sub 1 → 2 → 3
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-sm sm:max-w-md md:max-w-lg mx-auto">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="flex justify-center">
                      <PlayerCard
                        playerId={sp.playerId}
                        isStarter={sp.isStarter}
                        benchOrder={order}
                        isCaptain={false}
                        isViceCaptain={false}
                        onCardClick={handleCardClick}
                        showPoints={showPoints}
                        customCalculation={activeCalc}
                        selectedGW={activeGW}
                        readOnly={readOnly}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-bench-${order}`}
                    onClick={() => {
                      if (!readOnly) setActiveTab('transfers');
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border border-dashed border-white/20 bg-black/20 text-gray-500 min-h-[90px] transition-all ${
                      readOnly ? 'cursor-default opacity-50' : 'cursor-pointer hover:border-emerald-400/50 hover:bg-emerald-500/5'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-gray-400">Sub {order}</span>
                    <span className="text-[8px] text-gray-500 mt-0.5">{readOnly ? 'Empty' : '+ Empty'}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Internal Player Action Sheet Modal (used when onCardClick is not provided) */}
      {!onCardClick && internalSheetPlayerId && (
        <PlayerActionSheet
          playerId={internalSheetPlayerId}
          onClose={() => setInternalSheetPlayerId(null)}
          selectedGW={activeGW}
          readOnly={readOnly}
          customCalculation={activeCalc}
        />
      )}
    </div>
  );
};
