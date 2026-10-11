import React from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from './KitJersey';
import { canSwapPlayers } from '../../engine/formations';
import { ArrowLeftRight, Check } from 'lucide-react';
import { GameweekCalculationResult, calculatePlayerPoints, POSITION_CHANGED_PLAYERS } from '../../engine/scoring';
import { triggerHaptic } from '../../utils/haptics';

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
        triggerHaptic('light');
        setSelectedPlayerForSwap(null);
      } else if (isSwapTargetEligible) {
        // Execute swap!
        const result = substitutePlayers(selectedPlayerForSwap, playerId);
        if (!result.success) {
          triggerHaptic('warning');
          alert(result.message || 'Cannot make this substitution');
        } else {
          triggerHaptic('success');
        }
      } else {
        // Pick new source
        triggerHaptic('light');
        setSelectedPlayerForSwap(playerId);
      }
      return;
    }

    // Normal click: open player action sheet
    triggerHaptic('light');
    onCardClick(playerId);
  };

  const positionChange = POSITION_CHANGED_PLAYERS[playerId];
  const isPositionChanged = Boolean(positionChange);

  const isDimmedDuringSwap =
    !readOnly && selectedPlayerForSwap && !isSwapSource && !isSwapTargetEligible;

  // On Bench View (inside Drawer / tactical dock)
  if (!isStarter) {
    return (
      <div
        onClick={handleClick}
        className={`w-full relative flex flex-col items-center justify-between p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition-all cursor-pointer active:scale-95 select-none ${
          isSwapSource
            ? 'ring-2 ring-amber-400 bg-amber-500/10'
            : isSwapTargetEligible
            ? 'ring-2 ring-white/80 bg-white/10'
            : isPositionChanged
            ? 'ring-2 ring-rose-500'
            : isDimmedDuringSwap
            ? 'opacity-35'
            : ''
        }`}
      >
        {/* Swap Indicator */}
        {isSwapSource && (
          <div className="absolute -top-2.5 bg-amber-400 text-slate-950 text-[8.5px] font-black px-2 py-0.2 rounded-full shadow-md z-30">
            SWAP
          </div>
        )}
        {isSwapTargetEligible && (
          <div className="absolute -top-2.5 bg-white text-zinc-950 text-[8.5px] font-black px-2 py-0.2 rounded-full shadow-md z-30">
            TAP HERE
          </div>
        )}

        {/* Kit Jersey */}
        <div className="relative my-1">
          <KitJersey
            clubId={player.clubId}
            position={player.position}
            photoUrl={player.photoUrl}
            className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-md"
          />
        </div>

        {/* Player Web Name */}
        <span className="text-[11px] font-bold text-white tracking-tight truncate max-w-full text-center mt-1">
          {player.webName}
        </span>
      </div>
    );
  }

  // Pitch Starter View: Ultra-Glass Rounded Capsule
  return (
    <div
      onClick={handleClick}
      className={`relative flex flex-col items-center justify-between w-[78px] sm:w-[86px] md:w-[96px] min-h-[96px] sm:min-h-[106px] p-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-md border border-white/10 shadow-lg cursor-pointer transition-all duration-200 select-none ${
        isSwapSource
          ? 'scale-105 ring-2 ring-amber-400 bg-amber-500/15 z-30 shadow-xl'
          : isSwapTargetEligible
          ? 'scale-105 ring-2 ring-white/90 bg-white/15 z-20 shadow-xl'
          : isPositionChanged
          ? 'ring-2 ring-rose-500 shadow-rose-500/20'
          : isDimmedDuringSwap
          ? 'opacity-35 grayscale-[20%]'
          : 'hover:scale-[1.03] active:scale-95'
      }`}
    >
      {/* Position Change Alert */}
      {isPositionChanged && (
        <div
          className="absolute -top-2 -left-2 bg-rose-600 text-white font-black text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center border border-white shadow-md z-30"
          title={`${player.name}: პოზიცია შეიცვალა. აუცილებელია ტრანსფერი!`}
        >
          !
        </div>
      )}

      {/* Swap Status Floating Pill */}
      {isSwapSource && (
        <div className="absolute -top-3 bg-amber-400 text-slate-950 text-[8.5px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-30">
          <ArrowLeftRight className="w-2.5 h-2.5" />
          <span>SWAP</span>
        </div>
      )}
      {isSwapTargetEligible && (
        <div className="absolute -top-3 bg-white text-zinc-950 text-[8.5px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-30">
          <Check className="w-2.5 h-2.5" />
          <span>SELECT</span>
        </div>
      )}

      {/* Top: Position Label */}
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300/80 leading-none pt-0.5">
        {player.position}
      </span>

      {/* Center: Kit Jersey */}
      <div className="relative my-0.5 flex items-center justify-center">
        <KitJersey
          clubId={player.clubId}
          position={player.position}
          photoUrl={player.photoUrl}
          className="w-11 h-11 sm:w-12 sm:h-12 md:w-13 md:h-13 drop-shadow-md"
        />

        {/* Captaincy Badges */}
        {isCaptain && (
          <div
            className={`absolute -top-1 -right-2 font-black text-[8.5px] sm:text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center border shadow-md z-20 ${
              isTripleCap
                ? 'bg-amber-400 text-slate-950 border-white'
                : 'bg-zinc-950 text-white border-white/80'
            }`}
            title={isTripleCap ? 'Triple Captain' : 'Captain'}
          >
            {isTripleCap ? 'TC' : 'C'}
          </div>
        )}

        {isViceCaptain && !isCaptain && (
          <div
            className="absolute -top-1 -right-2 bg-slate-300 text-slate-950 font-black text-[8.5px] sm:text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center border border-slate-700 shadow-md z-20"
            title="Vice Captain"
          >
            V
          </div>
        )}

        {/* Auto-Sub Flags */}
        {isAutoSubIn && (
          <span className="absolute -top-1 -left-2 bg-emerald-600 text-white font-bold text-[8px] px-1 rounded-full">
            IN
          </span>
        )}
        {isAutoSubOut && (
          <span className="absolute -top-1 -left-2 bg-rose-600 text-white font-bold text-[8px] px-1 rounded-full">
            OUT
          </span>
        )}
      </div>

      {/* Bottom Info: Player Name + Price/Points */}
      <div className="w-full flex flex-col items-center justify-center text-center pb-0.5">
        {/* Name with subtle class accent dot */}
        <div className="flex items-center justify-center gap-1 max-w-full">
          <span className="text-[10.5px] sm:text-[11.5px] font-bold text-white tracking-tight truncate leading-tight">
            {player.webName}
          </span>
        </div>

        {/* Price & Points Side-by-Side (tabular monospace) */}
        <div className="text-[8.5px] sm:text-[9px] font-mono text-slate-300/80 tabular-nums flex items-center justify-center gap-1.5 mt-0.5 leading-none">
          <span>£{player.cost.toFixed(1)}m</span>
          <span className="opacity-40">•</span>
          <span className="font-bold text-white">{pts}pts</span>
        </div>
      </div>
    </div>
  );
};
