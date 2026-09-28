import React, { useState, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import { CLUBS } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { calculatePlayerPoints } from '../../engine/scoring';
import { Player, Fixture, Position } from '../../types/fpl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trophy,
  Zap,
  Shield,
  Crown,
  Clock,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const formatFixtureDate = (dateStr?: string): string => {
  if (!dateStr) return 'Date TBD';
  const parts = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (parts) {
    const year = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const day = parseInt(parts[3], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return dateStr;
};

export const sortFixturesByDate = (list: Fixture[]): Fixture[] => {
  return [...list].sort((a, b) => {
    const hasA = Boolean(a.date && !isNaN(Date.parse(a.date)));
    const hasB = Boolean(b.date && !isNaN(Date.parse(b.date)));
    if (hasA && !hasB) return -1;
    if (!hasA && hasB) return 1;
    if (hasA && hasB) {
      const timeA = new Date(a.date!).getTime();
      const timeB = new Date(b.date!).getTime();
      if (timeA !== timeB) return timeA - timeB;
    }
    return a.id.localeCompare(b.id);
  });
};

interface PlayerContribution {
  player: Player;
  minutes: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  yellowCards: number;
  redCards: number;
  penaltiesSaved: number;
  penaltiesMissed: number;
  ownGoals: number;
  isMVP: boolean;
  gamePoints: number;
}

export const FixturesView: React.FC = () => {
  const { fixtures, clubs, players, currentGW, setActiveTab } = useFPL();
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  const [expandedFixtureId, setExpandedFixtureId] = useState<string | null>(null);
  const [activeTeamTab, setActiveTeamTab] = useState<Record<string, 'home' | 'away'>>({});

  const gwFixtures = useMemo(() => {
    const filtered = fixtures.filter((f) => f.gameweek === selectedGW);
    return sortFixturesByDate(filtered);
  }, [fixtures, selectedGW]);

  const toggleFixture = (fixtureId: string) => {
    setExpandedFixtureId((prev) => (prev === fixtureId ? null : fixtureId));
  };

  const getTeamTab = (fixtureId: string): 'home' | 'away' => {
    return activeTeamTab[fixtureId] || 'home';
  };

  const setTeamTab = (fixtureId: string, tab: 'home' | 'away') => {
    setActiveTeamTab((prev) => ({ ...prev, [fixtureId]: tab }));
  };

  // Helper to calculate contributions and fantasy points for players of a club in a fixture
  const getTeamContributions = (
    clubId: string,
    fix: Fixture
  ): { contributions: PlayerContribution[]; totalPoints: number } => {
    const isOnePrice = fix.venue === 'one_price';
    const teamPlayers = Object.values(players).filter((p) => p.clubId === clubId);

    const contributions: PlayerContribution[] = teamPlayers.map((p) => {
      const stats = p.gwStats?.[fix.gameweek] || {
        minutes: 0,
        goals: 0,
        assists: 0,
        cleanSheet: false,
        goalsConceded: 0,
        ownGoals: 0,
        penaltiesSaved: 0,
        penaltiesMissed: 0,
        yellowCards: 0,
        redCards: 0,
        saves: 0,
        bonus: 0,
        isMVP: false,
      };

      const gamePoints = calculatePlayerPoints(p.position, stats, isOnePrice);
      const isMVP = Boolean(stats.isMVP || (stats.bonus != null && stats.bonus > 0));

      return {
        player: p,
        minutes: stats.minutes || 0,
        goals: stats.goals || 0,
        assists: stats.assists || 0,
        cleanSheet: Boolean(stats.cleanSheet),
        yellowCards: stats.yellowCards || 0,
        redCards: stats.redCards || 0,
        penaltiesSaved: stats.penaltiesSaved || 0,
        penaltiesMissed: stats.penaltiesMissed || 0,
        ownGoals: stats.ownGoals || 0,
        isMVP,
        gamePoints,
      };
    });

    // Sort: players who played (>0 min) first, then by gamePoints desc, then by name
    contributions.sort((a, b) => {
      if (a.minutes > 0 && b.minutes === 0) return -1;
      if (a.minutes === 0 && b.minutes > 0) return 1;
      if (b.gamePoints !== a.gamePoints) return b.gamePoints - a.gamePoints;
      return a.player.name.localeCompare(b.player.name);
    });

    const totalPoints = contributions.reduce((sum, c) => sum + c.gamePoints, 0);

    return { contributions, totalPoints };
  };

  const getPositionBadge = (pos: Position) => {
    switch (pos) {
      case 'GKP':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'DEF':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'MID':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'FWD':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="flex flex-col space-y-3 pb-24 md:pb-12 px-2 sm:px-4 md:px-6 pt-1 md:pt-3 select-none max-w-4xl lg:max-w-5xl mx-auto w-full transition-colors duration-200">
      {/* Gameweek Navigator Header */}
      <div className="p-2.5 md:p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <button
          onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
          disabled={selectedGW <= 1}
          className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-25 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Previous Gameweek"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm md:text-base font-black text-slate-900 dark:text-white">
              Gameweek {selectedGW}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
              {gwFixtures.length} Games
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Tap any match to view goals, player contributions & points
          </p>
        </div>

        <button
          onClick={() => setSelectedGW((prev) => prev + 1)}
          className="p-1.5 md:p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          title="Next Gameweek"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      {/* Fixtures List */}
      <div className="flex flex-col space-y-2.5">
        {gwFixtures.length === 0 ? (
          <div className="p-8 md:p-10 text-center text-xs md:text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
            No fixtures scheduled for Gameweek {selectedGW}.
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('dev')}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                + Add Games in Dev Mode
              </button>
            </div>
          </div>
        ) : (
          gwFixtures.map((fix) => {
            const homeClub =
              clubs[fix.homeClubId] ||
              CLUBS[fix.homeClubId] || {
                name: fix.homeClubId,
                shortName: fix.homeClubId,
                primaryColor: '#10b981',
              };
            const awayClub =
              clubs[fix.awayClubId] ||
              CLUBS[fix.awayClubId] || {
                name: fix.awayClubId,
                shortName: fix.awayClubId,
                primaryColor: '#3b82f6',
              };

            const homeDisplayName = homeClub.shortName || homeClub.name.replace(/^Team\s+/i, '');
            const awayDisplayName = awayClub.shortName || awayClub.name.replace(/^Team\s+/i, '');

            const isExpanded = expandedFixtureId === fix.id;
            const currentTab = getTeamTab(fix.id);

            const homeData = getTeamContributions(fix.homeClubId, fix);
            const awayData = getTeamContributions(fix.awayClubId, fix);

            // Goal scorers summary
            const goalScorersList = fix.goalScorers || [];
            // If goalScorers array is empty but goals exist in player stats, build from players
            const derivedGoalScorers: { name: string; clubId: string; goals: number; isOwnGoal?: boolean }[] = [];
            if (goalScorersList.length === 0 && ((fix.homeScore || 0) > 0 || (fix.awayScore || 0) > 0)) {
              [...homeData.contributions, ...awayData.contributions].forEach((c) => {
                if (c.goals > 0) {
                  derivedGoalScorers.push({
                    name: c.player.name,
                    clubId: c.player.clubId,
                    goals: c.goals,
                  });
                }
              });
            }

            return (
              <div
                key={fix.id}
                className={`rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 overflow-hidden shadow-xs ${
                  isExpanded
                    ? 'border-emerald-500/50 shadow-md ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Clickable Header Card */}
                <div
                  onClick={() => toggleFixture(fix.id)}
                  className="p-3 sm:p-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* Home Team */}
                    <div className="flex-1 flex items-center justify-end space-x-2 text-right">
                      <div className="min-w-0">
                        <span className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {homeDisplayName}
                        </span>
                        {isExpanded && (
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ⚡ {homeData.totalPoints} pts
                          </span>
                        )}
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: homeClub.primaryColor }}
                        title={homeClub.name}
                      />
                    </div>

                    {/* Score / Status Center */}
                    <div className="mx-2 sm:mx-4 min-w-[76px] sm:min-w-[90px] text-center flex flex-col items-center justify-center">
                      {fix.isFinished ? (
                        <div className="flex flex-col items-center">
                          <div className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-black text-sm md:text-base text-emerald-600 dark:text-emerald-400 shadow-2xs">
                            {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                          </div>
                          <span className="text-[8px] font-black text-slate-400 mt-0.5 uppercase tracking-wider">
                            FT • {fix.date ? formatFixtureDate(fix.date) : 'Full Time'}
                          </span>
                        </div>
                      ) : fix.isLive ? (
                        <div className="flex flex-col items-center">
                          <div className="px-3 py-1 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 font-mono font-black text-sm md:text-base text-rose-600 dark:text-rose-400">
                            {fix.homeScore ?? 0} - {fix.awayScore ?? 0}
                          </div>
                          <span className="text-[8px] font-black text-rose-500 mt-0.5 animate-pulse uppercase tracking-wider flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                            LIVE
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-xs font-black">
                            vs
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                            {fix.date ? formatFixtureDate(fix.date) : (fix.kickoffTime || 'Upcoming')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex-1 flex items-center justify-start space-x-2 text-left">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/20 flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: awayClub.primaryColor }}
                        title={awayClub.name}
                      />
                      <div className="min-w-0">
                        <span className="block text-xs md:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                          {awayDisplayName}
                        </span>
                        {isExpanded && (
                          <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                            ⚡ {awayData.totalPoints} pts
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expand Chevron */}
                    <div className="pl-1 sm:pl-2 shrink-0">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 group-hover:text-slate-600">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Match Sub-header: Venue and Quick Indicator */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {fix.date ? (
                        <span className="flex items-center gap-1 font-bold text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-2xs">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          {formatFixtureDate(fix.date)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/10">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Date TBD
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {fix.kickoffTime || 'Kickoff TBD'}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] ${
                        fix.venue === 'one_price'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                      }`}
                    >
                      {fix.venue === 'one_price' ? '🏢 One Price Stadium' : '🏟️ Delisi Stadium'}
                    </span>
                  </div>
                </div>

                {/* ================================================================= */}
                {/* EXPANDED ACCORDION: MATCH EVENTS & PLAYER CONTRIBUTIONS           */}
                {/* ================================================================= */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070c14]/70"
                    >
                      <div className="p-3 sm:p-4 space-y-3.5">
                        {/* 1. Goals Log & Key Events Banner */}
                        {(goalScorersList.length > 0 || derivedGoalScorers.length > 0) && (
                          <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xs">
                            <span className="block text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1.5 flex items-center gap-1">
                              ⚽ Match Goals
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {goalScorersList.length > 0
                                ? goalScorersList.map((g, idx) => {
                                    const scorer = players[g.playerId];
                                    const assist = g.assistPlayerId ? players[g.assistPlayerId] : null;
                                    return (
                                      <div
                                        key={idx}
                                        className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 font-medium"
                                      >
                                        <span className="text-sm">⚽</span>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white truncate">
                                            <span>{scorer?.name || 'Player'}</span>
                                            {g.minute != null && (
                                              <span className="text-[10px] font-mono text-slate-400">
                                                {g.minute}'
                                              </span>
                                            )}
                                            {g.isOwnGoal && (
                                              <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 font-bold">
                                                OG
                                              </span>
                                            )}
                                          </div>
                                          {assist && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                              Assist: <span className="font-semibold">{assist.name}</span>
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                : derivedGoalScorers.map((dg, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 font-medium"
                                    >
                                      <span className="text-sm">⚽</span>
                                      <div className="min-w-0 flex-1">
                                        <span className="font-bold text-slate-800 dark:text-white truncate">
                                          {dg.name} {dg.goals > 1 ? `(${dg.goals})` : ''}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        )}

                        {/* 2. Team Contribution Breakdown */}
                        <div>
                          {/* Mobile Tab Selector & Desktop Header */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-emerald-500" />
                              Player Contributions & Points
                            </span>

                            {/* Mobile Team Toggle */}
                            <div className="sm:hidden flex items-center p-0.5 rounded-xl bg-slate-200/80 dark:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] font-bold">
                              <button
                                type="button"
                                onClick={() => setTeamTab(fix.id, 'home')}
                                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                                  currentTab === 'home'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {homeDisplayName}
                              </button>
                              <button
                                type="button"
                                onClick={() => setTeamTab(fix.id, 'away')}
                                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                                  currentTab === 'away'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-black'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {awayDisplayName}
                              </button>
                            </div>
                          </div>

                          {/* Desktop: Side-by-Side 2 Columns. Mobile: Tabbed View */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Home Team Column */}
                            <div
                              className={`${
                                currentTab === 'home' ? 'block' : 'hidden sm:block'
                              } p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2`}
                            >
                              {/* Home Team Summary Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20"
                                    style={{ backgroundColor: homeClub.primaryColor }}
                                  />
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                    {homeClub.name}
                                  </h4>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono font-black text-[11px]">
                                  Total: +{homeData.totalPoints} pts
                                </div>
                              </div>

                              {/* Home Player Contribution Rows */}
                              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                                {homeData.contributions.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic py-2 text-center">
                                    No players registered for this club.
                                  </p>
                                ) : (
                                  homeData.contributions.map((c) => (
                                    <div
                                      key={c.player.id}
                                      className="p-1.5 sm:p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs"
                                    >
                                      {/* Left: Player Avatar + Name + Badges */}
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                                          {c.player.photoUrl ? (
                                            <img
                                              src={c.player.photoUrl}
                                              alt={c.player.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <KitJersey
                                              clubId={c.player.clubId}
                                              position={c.player.position}
                                              className="w-6 h-6"
                                            />
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                              className={`text-[9px] font-black px-1 rounded uppercase border ${getPositionBadge(
                                                c.player.position
                                              )}`}
                                            >
                                              {c.player.position}
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px] sm:text-xs">
                                              {c.player.name}
                                            </span>
                                            {c.isMVP && (
                                              <span
                                                className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black flex items-center gap-0.5"
                                                title="Match MVP"
                                              >
                                                <Crown className="w-2.5 h-2.5" /> MVP
                                              </span>
                                            )}
                                          </div>

                                          {/* Key Contribution Badges */}
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex-wrap">
                                            <span>⏱️ {c.minutes}'</span>
                                            {c.goals > 0 && (
                                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ⚽ x{c.goals}
                                              </span>
                                            )}
                                            {c.assists > 0 && (
                                              <span className="font-bold text-sky-600 dark:text-sky-400">
                                                🅰️ x{c.assists}
                                              </span>
                                            )}
                                            {c.cleanSheet && (
                                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                🛡️ CS
                                              </span>
                                            )}
                                            {c.yellowCards > 0 && (
                                              <span className="text-amber-500 font-bold">
                                                🟨 x{c.yellowCards}
                                              </span>
                                            )}
                                            {c.redCards > 0 && (
                                              <span className="text-rose-500 font-bold">
                                                🟥
                                              </span>
                                            )}
                                            {c.penaltiesSaved > 0 && (
                                              <span className="text-emerald-500 font-bold">
                                                🧤 x{c.penaltiesSaved}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: Fantasy Points Earned (+X) */}
                                      <div className="ml-2 shrink-0 text-right">
                                        <span
                                          className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs ${
                                            c.gamePoints > 0
                                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                              : c.gamePoints < 0
                                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                          }`}
                                        >
                                          {c.gamePoints > 0 ? `+${c.gamePoints}` : c.gamePoints} pts
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Away Team Column */}
                            <div
                              className={`${
                                currentTab === 'away' ? 'block' : 'hidden sm:block'
                              } p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xs space-y-2`}
                            >
                              {/* Away Team Summary Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20"
                                    style={{ backgroundColor: awayClub.primaryColor }}
                                  />
                                  <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                    {awayClub.name}
                                  </h4>
                                </div>
                                <div className="px-2 py-0.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 font-mono font-black text-[11px]">
                                  Total: +{awayData.totalPoints} pts
                                </div>
                              </div>

                              {/* Away Player Contribution Rows */}
                              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-0.5">
                                {awayData.contributions.length === 0 ? (
                                  <p className="text-[11px] text-slate-400 italic py-2 text-center">
                                    No players registered for this club.
                                  </p>
                                ) : (
                                  awayData.contributions.map((c) => (
                                    <div
                                      key={c.player.id}
                                      className="p-1.5 sm:p-2 rounded-xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between text-xs"
                                    >
                                      {/* Left: Player Avatar + Name + Badges */}
                                      <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
                                          {c.player.photoUrl ? (
                                            <img
                                              src={c.player.photoUrl}
                                              alt={c.player.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <KitJersey
                                              clubId={c.player.clubId}
                                              position={c.player.position}
                                              className="w-6 h-6"
                                            />
                                          )}
                                        </div>

                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span
                                              className={`text-[9px] font-black px-1 rounded uppercase border ${getPositionBadge(
                                                c.player.position
                                              )}`}
                                            >
                                              {c.player.position}
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-slate-100 truncate text-[11px] sm:text-xs">
                                              {c.player.name}
                                            </span>
                                            {c.isMVP && (
                                              <span
                                                className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-500 border border-amber-500/30 font-black flex items-center gap-0.5"
                                                title="Match MVP"
                                              >
                                                <Crown className="w-2.5 h-2.5" /> MVP
                                              </span>
                                            )}
                                          </div>

                                          {/* Key Contribution Badges */}
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex-wrap">
                                            <span>⏱️ {c.minutes}'</span>
                                            {c.goals > 0 && (
                                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                ⚽ x{c.goals}
                                              </span>
                                            )}
                                            {c.assists > 0 && (
                                              <span className="font-bold text-sky-600 dark:text-sky-400">
                                                🅰️ x{c.assists}
                                              </span>
                                            )}
                                            {c.cleanSheet && (
                                              <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                                🛡️ CS
                                              </span>
                                            )}
                                            {c.yellowCards > 0 && (
                                              <span className="text-amber-500 font-bold">
                                                🟨 x{c.yellowCards}
                                              </span>
                                            )}
                                            {c.redCards > 0 && (
                                              <span className="text-rose-500 font-bold">
                                                🟥
                                              </span>
                                            )}
                                            {c.penaltiesSaved > 0 && (
                                              <span className="text-emerald-500 font-bold">
                                                🧤 x{c.penaltiesSaved}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Right: Fantasy Points Earned (+X) */}
                                      <div className="ml-2 shrink-0 text-right">
                                        <span
                                          className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs ${
                                            c.gamePoints > 0
                                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                              : c.gamePoints < 0
                                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                              : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10'
                                          }`}
                                        >
                                          {c.gamePoints > 0 ? `+${c.gamePoints}` : c.gamePoints} pts
                                        </span>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
