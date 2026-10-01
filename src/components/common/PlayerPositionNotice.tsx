import React from 'react';
import { Position } from '../../types/fpl';
import { SCORING_POSITION_OVERRIDES } from '../../engine/scoring';
import { AlertCircle, Zap } from 'lucide-react';

interface PlayerPositionBadgeProps {
  playerId?: string;
  position: Position;
  className?: string;
  badgeSize?: 'xs' | 'sm' | 'md';
}

export const PlayerPositionBadge: React.FC<PlayerPositionBadgeProps> = ({
  playerId,
  position,
  className = '',
  badgeSize = 'sm',
}) => {
  const overridePos = playerId ? SCORING_POSITION_OVERRIDES[playerId] : undefined;

  const sizeClasses =
    badgeSize === 'xs'
      ? 'px-1.5 py-0.5 text-[9px]'
      : badgeSize === 'md'
      ? 'px-2.5 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]';

  if (overridePos && overridePos !== position) {
    return (
      <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
        <span
          className={`${sizeClasses} rounded-md font-bold line-through text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 opacity-80`}
          title={`Registered as ${position} for GW1 lineup compatibility`}
        >
          {position}
        </span>
        <span className="text-[10px] text-amber-500 font-bold">→</span>
        <span
          className={`${sizeClasses} rounded-md font-black uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 shadow-xs flex items-center gap-1`}
          title={`Scoring system treats this player as ${overridePos}`}
        >
          <Zap className="w-2.5 h-2.5 text-rose-500" />
          <span>{overridePos}</span>
        </span>
      </div>
    );
  }

  const defaultColor =
    position === 'GKP'
      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
      : position === 'DEF'
      ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30'
      : position === 'MID'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';

  return (
    <span
      className={`${sizeClasses} rounded-md font-black uppercase border ${defaultColor} ${className}`}
    >
      {position}
    </span>
  );
};

interface PlayerPositionOverrideNoticeProps {
  playerId?: string;
  position: Position;
  className?: string;
}

export const PlayerPositionOverrideNotice: React.FC<PlayerPositionOverrideNoticeProps> = ({
  playerId,
  position,
  className = '',
}) => {
  const overridePos = playerId ? SCORING_POSITION_OVERRIDES[playerId] : undefined;
  if (!overridePos || overridePos === position) return null;

  return (
    <div
      className={`p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-xs ${className}`}
    >
      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
      <div className="leading-snug space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-black text-[11px] uppercase tracking-wide text-amber-800 dark:text-amber-300">
            ⚡ Effectively {overridePos}
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold border border-amber-500/30">
            Scoring Rule
          </span>
        </div>
        <p className="text-[11.5px] text-slate-700 dark:text-slate-300">
          This player is effectively a <strong className="font-black text-rose-600 dark:text-rose-400">{overridePos}</strong> in the scoring engine (goals award 4 pts, clean sheet awards 0 pts, conceded goals do not deduct points). However, because manager lineups are locked, they are still called <span className="line-through font-bold text-slate-500 dark:text-slate-400">{position}</span> to prevent breaking existing squads until GW2.
        </p>
      </div>
    </div>
  );
};
