import React from 'react';
import { Player } from '../../types/fpl';

interface PlayerPriceBadgeProps {
  player: Player;
  showDifference?: boolean;
  className?: string;
}

export const PlayerPriceBadge: React.FC<PlayerPriceBadgeProps> = ({
  player,
  showDifference = false,
  className = '',
}) => {
  const hasPrevious = typeof player.previousCost === 'number' && player.previousCost !== player.cost;
  const isRising = hasPrevious && player.cost > player.previousCost!;
  const isDropping = hasPrevious && player.cost < player.previousCost!;
  const diff = hasPrevious
    ? Math.abs(Math.round((player.cost - player.previousCost!) * 10) / 10)
    : Math.abs(player.priceChange || 0);

  if (isRising) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono flex-wrap ${className}`}>
        <span className="line-through text-slate-400 dark:text-zinc-500 opacity-75 font-semibold text-[0.88em]">
          £{player.previousCost!.toFixed(1)}m
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-0.5">
          £{player.cost.toFixed(1)}m
          <span className="text-[11px] select-none" title={`Rose by +£${diff.toFixed(1)}m`}>📈</span>
        </span>
        {showDifference && (
          <span className="text-[9px] font-black px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            +{diff.toFixed(1)}m
          </span>
        )}
      </span>
    );
  }

  if (isDropping) {
    return (
      <span className={`inline-flex items-center gap-1 font-mono flex-wrap ${className}`}>
        <span className="line-through text-slate-400 dark:text-zinc-500 opacity-75 font-semibold text-[0.88em]">
          £{player.previousCost!.toFixed(1)}m
        </span>
        <span className="text-rose-600 dark:text-rose-400 font-extrabold flex items-center gap-0.5">
          £{player.cost.toFixed(1)}m
          <span className="text-[11px] select-none" title={`Dropped by -£${diff.toFixed(1)}m`}>📉</span>
        </span>
        {showDifference && (
          <span className="text-[9px] font-black px-1 py-0.2 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            -{diff.toFixed(1)}m
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`font-mono font-bold ${className}`}>
      £{player.cost.toFixed(1)}m
    </span>
  );
};
