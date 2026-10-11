import React, { useState, useMemo } from 'react';
import { PlayerCard } from './PlayerCard';
import { useFPL } from '../../context/FPLContext';
import { ChevronUp, Users, TrendingUp } from 'lucide-react';
import { CLUBS } from '../../data/clubs';
import { calculatePlayerPoints } from '../../engine/scoring';
import { triggerHaptic } from '../../utils/haptics';
import { motion, PanInfo, useDragControls } from 'framer-motion';

interface SubstitutesDrawerProps {
  layout: any;
  benchSlots: number[];
  onCardClick: (id: string) => void;
  showPoints: boolean;
  activeCalculation: any;
  selectedGW: number;
  readOnly: boolean;
  isPrimaryExpanded?: boolean;
  setIsPrimaryExpanded?: React.Dispatch<React.SetStateAction<boolean>>;
}

// Physical height configuration for iOS-native peek & expand snap behavior
const PRI_HEIGHT = 560; // Total physical height of the sliding hub (px)
const PRI_PEEK_VISIBLE = 148; // Height of drag handle + header + 3 substitute jerseys (px)
const PRI_PEEK_Y = PRI_HEIGHT - PRI_PEEK_VISIBLE; // Offset in resting peek state (~412px)

const SPRING_CONFIG = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

export const SubstitutesDrawer: React.FC<SubstitutesDrawerProps> = ({
  layout,
  benchSlots,
  onCardClick,
  showPoints,
  activeCalculation,
  selectedGW,
  readOnly,
  isPrimaryExpanded: externalPrimary,
  setIsPrimaryExpanded: setExternalPrimary,
}) => {
  const {
    setActiveTab,
    squad,
    fixtures,
    players,
    currentGW,
  } = useFPL();

  const [internalPrimary, setInternalPrimary] = useState(false);
  const isPrimaryExpanded = externalPrimary ?? internalPrimary;
  const setIsPrimaryExpanded = setExternalPrimary ?? setInternalPrimary;
  const dragControls = useDragControls();

  const togglePrimary = () => {
    triggerHaptic('light');
    setIsPrimaryExpanded((prev) => !prev);
  };

  const handlePrimaryDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y < -200 || info.offset.y < -40) {
      triggerHaptic('light');
      setIsPrimaryExpanded(true);
    } else if (info.velocity.y > 200 || info.offset.y > 40) {
      triggerHaptic('light');
      setIsPrimaryExpanded(false);
    }
  };

  // Gameweek History: Shows events, goals, assists and points for the selected GW
  const pointsHistory = useMemo(() => {
    const logs: {
      playerId: string;
      playerName: string;
      clubId: string;
      position: string;
      events: string[];
      matchInfo?: string;
      totalPts: number;
      isCaptain?: boolean;
    }[] = [];

    // Historical squad vs current squad
    const targetSquadPlayers =
      selectedGW < currentGW && squad.gameweekSquads && squad.gameweekSquads[selectedGW]?.length
        ? squad.gameweekSquads[selectedGW]
        : squad.players;

    targetSquadPlayers.forEach((sp) => {
      const p = players[sp.playerId];
      if (!p) return;
      const stats = p.gwStats?.[selectedGW];
      if (!stats) return;

      const isCaptain = sp.isCaptain;
      const isTripleCap = isCaptain && (activeCalculation?.isTripleCaptain ?? false);
      const mult = isCaptain ? (isTripleCap ? 3 : 2) : 1;

      const events: string[] = [];
      if (stats.goals > 0) {
        events.push(`${stats.goals} ${stats.goals === 1 ? 'Goal' : 'Goals'}${mult > 1 ? ` (${mult}x)` : ''}`);
      }
      if (stats.assists > 0) {
        events.push(`${stats.assists} ${stats.assists === 1 ? 'Assist' : 'Assists'}${mult > 1 ? ` (${mult}x)` : ''}`);
      }
      if (stats.cleanSheet) {
        events.push(`Clean Sheet${mult > 1 ? ` (${mult}x)` : ''}`);
      }
      if (stats.isMVP) {
        events.push(`MVP`);
      }
      if (stats.penaltiesSaved > 0) {
        events.push(`${stats.penaltiesSaved} Pen Saved`);
      }
      if (stats.penaltiesMissed > 0) {
        events.push(`${stats.penaltiesMissed} Pen Missed`);
      }
      if (stats.yellowCards > 0) {
        events.push(`${stats.yellowCards} Yellow Card`);
      }
      if (stats.redCards > 0) {
        events.push(`${stats.redCards} Red Card`);
      }
      if (stats.ownGoals > 0) {
        events.push(`${stats.ownGoals} Own Goal`);
      }
      if (stats.minutes > 0) {
        events.push(`${stats.minutes} mins`);
      }

      if (events.length === 0 && stats.minutes === 0) return;

      // Matchup for this player's club in this GW
      const fixture = fixtures.find(
        (f) => f.gameweek === selectedGW && (f.homeClubId === p.clubId || f.awayClubId === p.clubId)
      );
      let matchInfo: string | undefined;
      if (fixture) {
        const homeName = CLUBS[fixture.homeClubId]?.shortName || CLUBS[fixture.homeClubId]?.name || fixture.homeClubId;
        const awayName = CLUBS[fixture.awayClubId]?.shortName || CLUBS[fixture.awayClubId]?.name || fixture.awayClubId;
        if (fixture.homeScore !== null && fixture.awayScore !== null) {
          matchInfo = `${homeName} ${fixture.homeScore}-${fixture.awayScore} ${awayName}`;
        } else {
          matchInfo = `${homeName} vs ${awayName}`;
        }
      }

      const breakdown = activeCalculation?.playerPointsBreakdown?.[p.id];
      let pts = 0;
      if (breakdown) {
        pts = (sp.isStarter || breakdown.isAutoSubIn || activeCalculation?.isBenchBoost)
          ? breakdown.finalPoints
          : breakdown.rawPoints;
      } else {
        const raw = calculatePlayerPoints(p.position, stats, false, p.id);
        pts = raw * mult;
      }

      logs.push({
        playerId: p.id,
        playerName: p.webName,
        clubId: p.clubId,
        position: p.position,
        events,
        matchInfo,
        totalPts: pts,
        isCaptain,
      });
    });

    return logs;
  }, [activeCalculation, squad, players, selectedGW, currentGW, fixtures]);

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP VIEW: Tactical Bench Dock under Pitch         */}
      {/* ======================================================== */}
      <div className="hidden lg:block w-full mt-3 p-3.5 rounded-2xl bg-white/80 dark:bg-[#070b12]/90 border border-slate-200/80 dark:border-white/[0.06] shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
              <Users className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              Substitutes Bench ({layout.bench.length}/3)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          {benchSlots.map((order) => {
            const sp = layout.bench.find((b: any) => b.benchOrder === order) || layout.bench[order - 1];
            if (sp) {
              return (
                <div key={sp.playerId} className="relative flex flex-col items-center">
                  <span className="absolute -top-3 -left-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm z-20">
                    {order === 1 ? '1ST' : order === 2 ? '2ND' : '3RD'}
                  </span>

                  <PlayerCard
                    playerId={sp.playerId}
                    isStarter={false}
                    benchOrder={order}
                    isCaptain={sp.isCaptain}
                    isViceCaptain={sp.isViceCaptain}
                    onCardClick={onCardClick}
                    showPoints={showPoints}
                    customCalculation={activeCalculation}
                    selectedGW={selectedGW}
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
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/15 bg-white/50 dark:bg-white/[0.01] text-slate-400 transition-all min-h-[90px] ${
                  readOnly ? 'cursor-default opacity-50' : 'hover:border-slate-400 cursor-pointer active:scale-95'
                }`}
              >
                <span className="absolute -top-3 -left-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm z-20">
                  {order === 1 ? '1ST' : order === 2 ? '2ND' : '3RD'}
                </span>
                <span className="text-[10px] font-bold mt-2 font-sans">Sub {order}</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-sans">
                  {readOnly ? 'Empty' : '+ Add Player'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. MOBILE VIEW: iOS Hardware-Accelerated Sliding Hub      */}
      {/* ======================================================== */}
      <div className="lg:hidden pointer-events-none">
        <motion.div
          drag="y"
          dragControls={dragControls}
          dragListener={!isPrimaryExpanded}
          dragConstraints={{ top: 0, bottom: PRI_PEEK_Y }}
          dragElastic={{ top: 0.05, bottom: 0.25 }}
          onDragEnd={handlePrimaryDragEnd}
          animate={{
            y: isPrimaryExpanded ? 0 : PRI_PEEK_Y,
          }}
          transition={SPRING_CONFIG}
          style={{ willChange: 'transform' }}
          className="fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom))] inset-x-0 w-full z-40 h-[560px] rounded-t-[28px] bg-[#0c1117]/95 dark:bg-[#070b12]/95 backdrop-blur-2xl border-t border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden select-none pointer-events-auto"
        >
          {/* Header & Drag Handle (Always Fixed at Top of Drawer) */}
          <div
            onClick={togglePrimary}
            onPointerDown={(e) => {
              if (isPrimaryExpanded) {
                dragControls.start(e);
              }
            }}
            className="w-full pt-2 pb-2 px-4 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
            style={{ touchAction: 'none' }}
          >
            {/* iOS Drag Handle Pill */}
            <div
              className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mt-2 mb-4 pointer-events-none touch-none"
              style={{ touchAction: 'none' }}
            />

            <div className="w-full flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                  SUBSTITUTES
                </span>
                <span className="text-xs font-bold text-slate-400 dark:text-zinc-500 font-sans">
                  ({layout.bench.length}/3)
                </span>
              </div>

              <div className="flex items-center gap-1 text-zinc-400 text-xs shrink-0">
                <motion.div
                  animate={{ rotate: isPrimaryExpanded ? 180 : 0 }}
                  transition={SPRING_CONFIG}
                >
                  <ChevronUp className="w-4 h-4 text-zinc-400" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Main Scrollable Drawer Wrapper (The ONLY scrollable element in the drawer) */}
          <div
            className={`flex-1 px-3 pt-2 pb-28 space-y-4 ${
              isPrimaryExpanded ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'
            }`}
          >
            {/* 1. Substitutes 3-Card Row */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {benchSlots.map((order) => {
                const sp = layout.bench.find((b: any) => b.benchOrder === order) || layout.bench[order - 1];
                if (sp) {
                  return (
                    <div key={sp.playerId} className="relative flex flex-col items-center w-full">
                      {/* Priority badge: sleek floating glass pill overlapping top-left corner */}
                      <span className="absolute -top-3 -left-1 bg-zinc-800 text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm z-20">
                        {order === 1 ? '1ST' : order === 2 ? '2ND' : '3RD'}
                      </span>

                      <PlayerCard
                        playerId={sp.playerId}
                        isStarter={false}
                        benchOrder={order}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        onCardClick={onCardClick}
                        showPoints={showPoints}
                        customCalculation={activeCalculation}
                        selectedGW={selectedGW}
                        readOnly={readOnly}
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={`mobile-empty-sub-${order}`}
                    onClick={() => {
                      if (!readOnly) setActiveTab('transfers');
                    }}
                    className="relative w-full p-2.5 rounded-2xl border border-dashed border-slate-300/80 dark:border-white/15 bg-white/50 dark:bg-white/[0.01] text-slate-400 flex flex-col items-center justify-center min-h-[92px] cursor-pointer"
                  >
                    <span className="absolute -top-3 -left-1 bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-700 shadow-sm z-20">
                      {order === 1 ? '1ST' : order === 2 ? '2ND' : '3RD'}
                    </span>
                    <span className="text-[10px] font-bold mt-2 font-sans">Sub {order}</span>
                    <span className="text-[8.5px] text-slate-500 uppercase mt-0.5 font-sans">+ Add</span>
                  </div>
                );
              })}
            </div>

            {/* 2. GW History (Full Natural Height - No Internal Scrollbar) */}
            <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-sans text-xs font-bold tracking-wider text-zinc-400 uppercase">
                    GW History
                  </span>
                </div>
              </div>

              {pointsHistory.length > 0 ? (
                <div className="space-y-2">
                  {pointsHistory.map((item, idx) => (
                    <div
                      key={`${item.playerId}-${idx}`}
                      className="p-2.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: CLUBS[item.clubId]?.primaryColor || '#64748b' }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-white truncate font-sans">
                              {item.playerName}
                            </span>
                            {item.isCaptain && (
                              <span className="text-[9px] font-bold text-amber-400 px-1 py-0.2 rounded bg-amber-400/10 border border-amber-400/20 font-sans">
                                C
                              </span>
                            )}
                            {item.matchInfo && (
                              <span className="text-[10px] text-zinc-400 font-sans">
                                ({item.matchInfo})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-400 truncate mt-0.5 font-sans">
                            {item.events.join(' • ')}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`font-mono font-bold shrink-0 text-xs ${
                          item.totalPts > 0 ? 'text-emerald-400' : item.totalPts < 0 ? 'text-rose-400' : 'text-zinc-500'
                        }`}
                      >
                        {item.totalPts > 0 ? `+${item.totalPts}` : item.totalPts} pts
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-xs text-zinc-500 font-sans">
                  empty
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};
