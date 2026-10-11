import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from './KitJersey';
import { canSwapPlayers } from '../../engine/formations';
import { ArrowLeftRight, Check, AlertCircle } from 'lucide-react';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import { GameweekCalculationResult, calculatePlayerPoints, POSITION_CHANGED_PLAYERS } from '../../engine/scoring';

interface PlayerCardProps {
  playerId: string;
  isStarter: boolean;
  benchOrder: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  onCardClick: (playerId: string) => void;
  showPoints?: boolean;
  customCalculation?: GameweekCalculationResult;
  selectedGW?: number;
  readOnly?: boolean;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  playerId,
  isStarter,
  benchOrder,
  isCaptain,
  isViceCaptain,
  onCardClick,
  showPoints = false,
  customCalculation,
  selectedGW,
  readOnly = false,
}) => {
  const {
    players,
    squad,
    selectedPlayerForSwap,
    setSelectedPlayerForSwap,
    substitutePlayers,
    calculationResult,
    currentGW,
  } = useFPL();

  const player = players[playerId];
  if (!player) return null;

  const activeCalc = customCalculation || calculationResult;
  const activeGW = selectedGW ?? currentGW;

  const isSwapSource = !readOnly && selectedPlayerForSwap === playerId;
  const isSwapTargetEligible =
    !readOnly &&
    selectedPlayerForSwap &&
    selectedPlayerForSwap !== playerId &&
    canSwapPlayers(selectedPlayerForSwap, playerId, squad.players, players).canSwap;

  // Breakdown for points
  const breakdown = activeCalc.playerPointsBreakdown?.[playerId];
  const isAutoSubIn = breakdown?.isAutoSubIn;
  const isAutoSubOut = breakdown?.isAutoSubOut;
  const isTripleCap = isCaptain && activeCalc.isTripleCaptain;
  const isScoringActive = isStarter || isAutoSubIn || activeCalc.isBenchBoost;
  const pts = breakdown
    ? (isScoringActive ? breakdown.finalPoints : breakdown.rawPoints)
    : (player.gwStats?.[activeGW] ? calculatePlayerPoints(player.position, player.gwStats[activeGW], false, player.id) : 0);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (readOnly) {
      onCardClick(playerId);
      return;
    }

    // If currently in substitution mode
    if (selectedPlayerForSwap) {
      if (isSwapSource) {
        // Cancel swap mode
        setSelectedPlayerForSwap(null);
      } else if (isSwapTargetEligible) {
        // Execute swap!
        const result = substitutePlayers(selectedPlayerForSwap, playerId);
        if (!result.success) {
          alert(result.message || 'Cannot make this substitution');
        }
      } else {
        // Pick new source
        setSelectedPlayerForSwap(playerId);
      }
      return;
    }

    // Normal click: open player action sheet
    onCardClick(playerId);
  };

  const positionChange = POSITION_CHANGED_PLAYERS[playerId];
  const isPositionChanged = Boolean(positionChange);

  const isDimmedDuringSwap =
    !readOnly && selectedPlayerForSwap && !isSwapSource && !isSwapTargetEligible;

  const sourceSp = selectedPlayerForSwap ? squad.players.find((p) => p.playerId === selectedPlayerForSwap) : null;
  const isBenchToBench = sourceSp && !sourceSp.isStarter && !isStarter;

  return (
    <div
      onClick={handleClick}
      title={isPositionChanged ? `${player.name}: პოზიცია შეიცვალა (${positionChange?.oldPosition} → ${positionChange?.newPosition}). აუცილებელია ტრანსფერი!` : 'tip: you can add photos to players now!'}
      className={`relative flex flex-col items-center justify-center cursor-pointer transition-all duration-300 select-none group min-w-[72px] max-w-[82px] sm:max-w-[88px] md:max-w-[96px] ${
        isSwapSource
          ? 'scale-110 z-30 ring-2 ring-yellow-400 rounded-lg shadow-xl'
          : isSwapTargetEligible
          ? 'scale-105 z-20 ring-2 ring-[#00ff87] rounded-lg animate-pulse-sub shadow-glow-green'
          : isPositionChanged
          ? 'ring-2 ring-rose-500 shadow-lg shadow-rose-500/40 rounded-xl hover:scale-105 active:scale-95'
          : isDimmedDuringSwap
          ? 'opacity-40 grayscale-[30%] hover:opacity-70'
          : 'hover:scale-105 active:scale-95'
      }`}
    >
      {/* Position Change Notice Badge */}
      {isPositionChanged && (
        <div
          className="absolute -top-3.5 -left-1.5 bg-gradient-to-br from-rose-500 to-red-600 text-white font-black text-[11px] md:text-[12px] rounded-full w-5 h-5 md:w-5.5 md:h-5.5 flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg shadow-rose-500/60 z-30 animate-bounce"
          title={`${player.name}: პოზიცია შეიცვალა (${positionChange?.oldPosition} → ${positionChange?.newPosition}). აუცილებელია ტრანსფერი! (+1 FT დამატებულია)`}
        >
          !
        </div>
      )}
      {/* Swap Status Overlay Pill */}
      {isSwapSource && (
        <div className="absolute -top-3.5 bg-yellow-400 text-black text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border border-black flex items-center gap-1 z-30 animate-bounce">
          <ArrowLeftRight className="w-2.5 h-2.5 md:w-3 md:h-3" />
          <span>SWAP</span>
        </div>
      )}

      {isSwapTargetEligible && (
        <div className="absolute -top-3.5 bg-[#00ff87] text-[#37003c] text-[8px] md:text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg border border-[#37003c] flex items-center gap-1 z-30 animate-bounce">
          <Check className="w-2.5 h-2.5 md:w-3 md:h-3" />
          <span>{isBenchToBench ? 'SWAP ORDER' : 'TAP HERE'}</span>
        </div>
      )}

      {/* Jersey Container with Captain & Vice Captain Badges */}
      <div className="relative flex items-center justify-center my-0.5">
        <KitJersey
          clubId={player.clubId}
          position={player.position}
          photoUrl={player.photoUrl}
          className="w-10 h-10 sm:w-11 sm:h-11 md:w-13 md:h-13"
        />

        {/* Captaincy Badges */}
        {isCaptain && (
          <div
            className={`absolute -top-1 -right-2 text-white font-black text-[9px] md:text-[10px] rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border shadow-md z-20 ${
              isTripleCap ? 'bg-gradient-to-r from-[#ffe600] to-[#ff9900] text-black border-white' : 'bg-[#111] text-white border-white'
            }`}
            title={isTripleCap ? 'Triple Captain' : 'Captain (2x)'}
          >
            {isTripleCap ? 'TC' : 'C'}
          </div>
        )}

        {isViceCaptain && !isCaptain && (
          <div
            className="absolute -top-1 -right-2 bg-gray-300 text-black font-black text-[9px] md:text-[10px] rounded-full w-4 h-4 md:w-5 md:h-5 flex items-center justify-center border border-black shadow-md z-20"
            title="Vice Captain"
          >
            V
          </div>
        )}

        {/* Bench Order indicator if on bench (Sub 1, Sub 2, Sub 3) */}
        {!isStarter && (
          <div className={`absolute -bottom-1 -right-1 font-black text-[8px] md:text-[9px] rounded px-1.5 py-0.5 border shadow-sm z-20 ${
            benchOrder === 1
              ? 'bg-black/95 text-emerald-400 border-emerald-500/50'
              : benchOrder === 2
              ? 'bg-black/95 text-sky-400 border-sky-500/50'
              : 'bg-black/95 text-amber-400 border-amber-500/50'
          }`}>
            Sub {benchOrder}
          </div>
        )}

        {/* Auto-Sub Arrows */}
        {isAutoSubIn && (
          <span className="absolute -top-1 -left-2 bg-green-500 text-white font-bold text-[8px] md:text-[9px] px-1 rounded-full">
            IN
          </span>
        )}
        {isAutoSubOut && (
          <span className="absolute -top-1 -left-2 bg-red-500 text-white font-bold text-[8px] md:text-[9px] px-1 rounded-full">
            OUT
          </span>
        )}
      </div>

      {/* Unified Compact Player Plate */}
      <div className="w-full rounded-xl overflow-hidden shadow-md border border-black/40 backdrop-blur-xs flex flex-col transition-all">
        {/* Nameplate Badge with Class Shield */}
        <div
          className={`w-full text-center px-1 py-0.5 text-[10.5px] sm:text-[11.5px] font-black tracking-tight truncate transition-colors flex items-center justify-center gap-1 ${
            isSwapSource
              ? 'bg-amber-400 text-slate-950 font-black'
              : isSwapTargetEligible
              ? 'bg-[#00ff87] text-[#37003c] font-black'
              : isPositionChanged
              ? 'bg-rose-600 text-white font-black'
              : 'bg-white text-slate-950'
          }`}
        >
          <ClassShieldBadge clubId={player.clubId} size="xs" className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{player.webName}</span>
          {isPositionChanged && (
            <span className="text-[8.5px] font-black bg-white text-rose-600 px-1 rounded-[3px] leading-none shrink-0 shadow-xs" title="პოზიცია შეიცვალა!">
              !
            </span>
          )}
        </div>

        {/* Value & Points Bar */}
        <div
          className="w-full text-center px-1 py-0.5 text-[8.5px] sm:text-[9.5px] font-extrabold tracking-tight transition-colors bg-slate-950/95 text-slate-200 border-t border-white/10 flex items-center justify-center gap-1"
        >
          <PlayerPriceBadge player={player} stacked={true} className="text-[8.5px] sm:text-[9px]" />
          <span className="text-slate-600 font-normal text-[7.5px] select-none shrink-0">•</span>
          <span className="font-mono text-[#00ff87] font-black shrink-0 leading-none">{pts}pts</span>
        </div>
      </div>
    </div>
  );
};
