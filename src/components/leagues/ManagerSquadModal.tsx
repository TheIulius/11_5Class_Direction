import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFPL } from '../../context/FPLContext';
import { fetchManagerSquadApi } from '../../services/api';
import { Squad } from '../../types/fpl';
import { GameweekCalculationResult, calculateGameweekSquadPoints, getEffectiveScoringPosition } from '../../engine/scoring';
import { getFormationLayout } from '../../engine/formations';
import { KitJersey } from '../pitch/KitJersey';
import { PlayerPositionBadge, PlayerPositionOverrideNotice } from '../common/PlayerPositionNotice';
import { CLUBS } from '../../data/clubs';
import { ArrowLeft, Award, Activity, Sparkles, X, AlertCircle, Loader2, ChevronLeft, ChevronRight, Lock, Users, ChevronDown } from 'lucide-react';

interface ManagerSquadModalProps {
  managerId: string | null;
  onClose: () => void;
}

export const ManagerSquadModal: React.FC<ManagerSquadModalProps> = ({ managerId, onClose }) => {
  const { players, currentGW, playerOwnership, isLineupsVisible, authUser, fixtures, isCurrentGWFinished, isModerator } = useFPL();
  const [loading, setLoading] = useState(true);
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  const [managerData, setManagerData] = useState<{
    id: string;
    managerName: string;
    teamName: string;
    squad: Squad;
  } | null>(null);
  const [calcResult, setCalcResult] = useState<GameweekCalculationResult | null>(null);
  const [selectedPlayerForSheet, setSelectedPlayerForSheet] = useState<string | null>(null);
  const [isLineupHidden, setIsLineupHidden] = useState<boolean>(false);
  const [showOwnershipList, setShowOwnershipList] = useState<boolean>(false);

  useEffect(() => {
    setSelectedGW(currentGW);
  }, [currentGW, managerId]);

  useEffect(() => {
    if (!managerId) return;
    setLoading(true);
    setIsLineupHidden(false);
    fetchManagerSquadApi(managerId)
      .then((data) => {
        setManagerData(data.manager);
        setCalcResult(data.calculationResult);
        setIsLineupHidden(Boolean(data.isLineupHidden));
      })
      .catch((err) => {
        console.error('Failed to load manager squad:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [managerId]);

  // Recalculate if user selects a past Gameweek
  useEffect(() => {
    if (managerData && !isLineupHidden && selectedGW && managerData.squad?.players?.length > 0) {
      const isPastGW = selectedGW < currentGW;
      const isThisGWFinished = isPastGW || (selectedGW === currentGW ? isCurrentGWFinished : false);
      const gwSquad = (managerData.squad.gameweekSquads && managerData.squad.gameweekSquads[selectedGW])
        ? managerData.squad.gameweekSquads[selectedGW]
        : (isPastGW ? [] : managerData.squad.players);
      const gwChip = (managerData.squad.gameweekChips && managerData.squad.gameweekChips[selectedGW] !== undefined)
        ? managerData.squad.gameweekChips[selectedGW]
        : (selectedGW === currentGW ? managerData.squad.activeChip : null);

      const pastCalc = calculateGameweekSquadPoints(
        gwSquad,
        players,
        selectedGW,
        gwChip,
        0,
        1,
        fixtures,
        isThisGWFinished
      );
      setCalcResult(pastCalc);
    }
  }, [selectedGW, managerData, players, currentGW, isLineupHidden, fixtures, isCurrentGWFinished]);

  if (!managerId) return null;

  const isSelf = Boolean(authUser?.id && managerId === authUser.id);
  const shouldHideLineup = !isModerator && ((!isSelf && !isLineupsVisible) || isLineupHidden);

  const activeGwSquad = (managerData?.squad.gameweekSquads && managerData?.squad.gameweekSquads[selectedGW])
    ? managerData.squad.gameweekSquads[selectedGW]
    : (selectedGW < currentGW ? [] : (managerData?.squad.players || []));
  const squadPlayers = shouldHideLineup ? [] : activeGwSquad;
  const layout = getFormationLayout(squadPlayers, players, selectedGW);

  // Top performer
  const squadPointsList = squadPlayers
    .map((sp) => {
      const p = players[sp.playerId];
      const bd = calcResult?.playerPointsBreakdown[sp.playerId];
      return {
        player: p,
        points: bd ? bd.finalPoints : 0,
        isCaptain: sp.isCaptain,
      };
    })
    .filter((item) => !!item.player);

  squadPointsList.sort((a, b) => b.points - a.points);
  const topPerformer = squadPointsList[0];

  const sheetPlayer = selectedPlayerForSheet ? players[selectedPlayerForSheet] : null;
  const sheetStats = sheetPlayer ? sheetPlayer.gwStats[currentGW] : null;
  const sheetBreakdown = selectedPlayerForSheet && calcResult ? calcResult.playerPointsBreakdown[selectedPlayerForSheet] : null;
  const sheetSquadPlayer = squadPlayers.find((sp) => sp.playerId === selectedPlayerForSheet);
  const ownership = selectedPlayerForSheet && playerOwnership ? playerOwnership[selectedPlayerForSheet] : null;
  const ownershipPercent = ownership?.percent ?? (sheetPlayer?.selectedByPercent ?? 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-2 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[460px] md:max-w-2xl h-full sm:h-[92vh] sm:max-h-[860px] bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Navigation Header */}
        <div className="px-4 py-3 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Standings</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/10 rounded-xl px-2 py-0.5">
            <button
              type="button"
              disabled={selectedGW <= 1}
              onClick={() => setSelectedGW((prev) => Math.max(1, prev - 1))}
              className="p-0.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-800 dark:text-slate-200">
              GW {selectedGW} {selectedGW === currentGW ? '(Live)' : ''}
            </span>
            <button
              type="button"
              disabled={selectedGW >= currentGW}
              onClick={() => setSelectedGW((prev) => Math.min(currentGW, prev + 1))}
              className="p-0.5 rounded text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Admin Access Indicator if Lineups are Private to Others */}
        {isModerator && !isSelf && !isLineupsVisible && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs">
            <span>🛡️ ადმინისტრატორის წვდომა: შემადგენლობა ხილვადია მხოლოდ თქვენთვის</span>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading squad...</p>
          </div>
        ) : shouldHideLineup ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            {managerData && (
              <div className="p-4 w-full max-w-sm rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs mb-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {managerData.teamName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manager: <strong className="text-slate-800 dark:text-slate-200">{managerData.managerName}</strong>
                </p>
              </div>
            )}
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="max-w-xs space-y-1.5">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Lineup is Hidden
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                სასტარტო შემადგენლობა დედლაინის დასრულებამდე დაფარულია.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Opponent lineups become visible once the gameweek transfer deadline locks.
              </p>
            </div>
          </div>
        ) : managerData && calcResult ? (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
            {/* Manager Info & GW Points Card */}
            <div className="p-3.5 mx-2 mt-2 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {managerData.teamName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Manager: <strong className="text-slate-800 dark:text-slate-200">{managerData.managerName}</strong>
                  </p>
                </div>

                <div className="text-right border-l border-slate-200/80 dark:border-white/10 pl-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">
                    GW {selectedGW}
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                      {calcResult.totalPoints}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">PTS</span>
                  </div>
                </div>
              </div>

              {/* Badges / Chips */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-xs gap-1">
                {topPerformer && topPerformer.points > 0 ? (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Top: <strong className="text-slate-900 dark:text-white">{topPerformer.player.webName}</strong> ({topPerformer.points} pts)
                  </span>
                ) : <span />}

                <div className="flex items-center gap-1.5">
                  {(() => {
                    const activeChipForSelectedGW = (managerData.squad.gameweekChips && managerData.squad.gameweekChips[selectedGW] !== undefined)
                      ? managerData.squad.gameweekChips[selectedGW]
                      : (selectedGW === currentGW ? managerData.squad.activeChip : null);
                    return activeChipForSelectedGW ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        {activeChipForSelectedGW.replace('_', ' ').toUpperCase()}
                      </span>
                    ) : null;
                  })()}
                  {calcResult.transferCost > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      -{calcResult.transferCost} pts
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Auto Subs Banner */}
            {calcResult.autoSubstitutions.length > 0 && (
              <div className="mx-2 mt-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 text-xs">
                <span className="font-bold text-sky-700 dark:text-sky-300 flex items-center gap-1.5 mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  Auto-Substitutions
                </span>
                <div className="space-y-1">
                  {calcResult.autoSubstitutions.map((sub: { outPlayerId: string; inPlayerId: string }, idx: number) => (
                    <div key={idx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <span className="text-rose-500 line-through">{players[sub.outPlayerId]?.webName} (0m)</span>
                      <span>➔</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{players[sub.inPlayerId]?.webName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Football Pitch Container with Rich Forest Green Natural Turf */}
            <div
              className="relative mx-2 my-2 rounded-2xl overflow-hidden border border-emerald-950/20 dark:border-white/10 shadow-xl bg-gradient-to-b from-[#225732] via-[#1b4b2a] to-[#153e22] dark:from-[#143d22] dark:via-[#10331b] dark:to-[#0c2815]"
            >
              {/* Faint Desaturated Center Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <img
                  src="/kcl-logo-transparent.png"
                  alt="Komarovi Champions League"
                  className="w-[200px] max-w-[60vw] opacity-[0.06] grayscale object-contain"
                />
              </div>

              {/* Pitch White Chalk Lines (SVG) with Crisp Forest Pitch Markings */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none fill-none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="10" y="10" width="calc(100% - 20px)" height="calc(100% - 20px)" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" rx="10" />
                <line x1="10" y1="50%" x2="calc(100% - 10px)" y2="50%" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
                <circle cx="50%" cy="50%" r="48" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
                <rect x="25%" y="10" width="50%" height="70" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
                <rect x="25%" y="calc(100% - 80px)" width="50%" height="70" stroke="rgba(255, 255, 255, 0.24)" strokeWidth="1" />
              </svg>

              {/* Pitch Formation Header */}
              <div className="relative pt-2 px-3 flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-black/40 text-gray-200 backdrop-blur-xs border border-white/10">
                  {layout.formationString}
                </span>
                <span className="text-[10px] text-gray-300 bg-black/40 px-2 py-0.5 rounded-full border border-white/5">
                  Tap player for stats
                </span>
              </div>

              {/* Pitch Rows */}
              <div className="relative z-10 flex flex-col justify-around min-h-[420px] py-3 px-1.5 space-y-3">
                {/* Row 1: Goalkeeper */}
                <div className="flex justify-center items-center">
                  {layout.gks.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 2: Defenders */}
                <div className="flex justify-around items-center px-1">
                  {layout.defs.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 3: Midfielders */}
                <div className="flex justify-around items-center px-1">
                  {layout.mids.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>

                {/* Row 4: Forwards */}
                <div className="flex justify-around items-center px-2">
                  {layout.fwds.map((sp) => {
                    const p = players[sp.playerId];
                    if (!p) return null;
                    const bd = calcResult.playerPointsBreakdown[sp.playerId];
                    const pts = bd ? bd.finalPoints : (p.gwStats[currentGW] ? p.gwPoints : 0);
                    return (
                      <OpponentPlayerCard
                        key={sp.playerId}
                        player={p}
                        points={pts}
                        isCaptain={sp.isCaptain}
                        isViceCaptain={sp.isViceCaptain}
                        isTripleCaptain={sp.isCaptain && calcResult.isTripleCaptain}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bench Area */}
            <div className="mx-2 p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10">
              <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2 tracking-wide">
                Substitutes
              </span>
              <div className="flex items-center justify-around">
                {layout.bench.map((sp, idx) => {
                  const p = players[sp.playerId];
                  if (!p) return null;
                  const bd = calcResult.playerPointsBreakdown[sp.playerId];
                  const isScoringActive = bd?.isAutoSubIn || calcResult.isBenchBoost;
                  const pts = bd ? (isScoringActive ? bd.finalPoints : bd.rawPoints) : (p.gwStats[currentGW] ? p.gwPoints : 0);
                  return (
                    <div key={sp.playerId} className="flex flex-col items-center text-center">
                      <span className="text-[9px] text-slate-400 font-bold mb-0.5">
                        {idx === 0 ? 'GK' : `${idx}`}
                      </span>
                      <OpponentPlayerCard
                        player={p}
                        points={pts}
                        isCaptain={false}
                        isViceCaptain={false}
                        isTripleCaptain={false}
                        onClick={() => setSelectedPlayerForSheet(sp.playerId)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Could not find manager details.</p>
          </div>
        )}

        {/* Player Match Stats Popup Sheet */}
        {sheetPlayer && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 md:p-4 select-none"
            onClick={() => {
              setSelectedPlayerForSheet(null);
              setShowOwnershipList(false);
            }}
          >
            <div
              className="w-full max-w-[460px] md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl animate-slide-up select-none safe-bottom text-slate-900 dark:text-white max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle (mobile only) */}
              <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

              {/* Player Header */}
              <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  {sheetPlayer.photoUrl ? (
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <img
                        src={sheetPlayer.photoUrl}
                        alt={sheetPlayer.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                      <KitJersey clubId={sheetPlayer.clubId} position={sheetPlayer.position} className="w-8 h-8 drop-shadow-xs" />
                    </div>
                  ) : (
                    <KitJersey clubId={sheetPlayer.clubId} position={sheetPlayer.position} className="w-12 h-12 shrink-0" />
                  )}
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PlayerPositionBadge playerId={sheetPlayer.id} position={sheetPlayer.position} />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {CLUBS[sheetPlayer.clubId]?.name || sheetPlayer.clubId}
                      </span>
                      {sheetSquadPlayer?.isCaptain && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                          {calcResult?.isTripleCaptain ? 'TRIPLE C (3x)' : 'CAPTAIN (2x)'}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                      {sheetPlayer.name}
                    </h2>
                    <span className="text-xs text-slate-400">£{sheetPlayer.cost.toFixed(1)}m</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlayerForSheet(null);
                    setShowOwnershipList(false);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Position Override Notice (if effectively FWD) */}
              <PlayerPositionOverrideNotice playerId={sheetPlayer.id} position={sheetPlayer.position} className="my-2.5" />

              {/* Performance Stats */}
              <div className="my-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">GW {currentGW} Score</span>
                  <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {sheetBreakdown
                      ? ((sheetSquadPlayer?.isStarter || sheetBreakdown.isAutoSubIn || calcResult?.isBenchBoost)
                          ? sheetBreakdown.finalPoints
                          : sheetBreakdown.rawPoints)
                      : (sheetStats ? sheetPlayer.gwPoints : 0)} PTS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Minutes:</span>
                    <strong className="text-slate-900 dark:text-white">{sheetStats?.minutes || 0}'</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Goals:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">{sheetStats?.goals || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Assists:</span>
                    <strong className="text-sky-500">{sheetStats?.assists || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Clean Sheet:</span>
                    <strong className="text-slate-900 dark:text-white">
                      {sheetStats?.cleanSheet
                        ? `Yes (+${getEffectiveScoringPosition(sheetPlayer.position, sheetPlayer.id) === 'FWD' ? 0 : getEffectiveScoringPosition(sheetPlayer.position, sheetPlayer.id) === 'MID' ? 1 : 4})`
                        : 'No'}
                    </strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Bonus:</span>
                    <strong className="text-amber-500">+{sheetStats?.bonus || 0}</strong>
                  </div>
                  <div className="flex justify-between p-1.5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                    <span>Multiplier:</span>
                    <strong className="text-slate-900 dark:text-white">{sheetBreakdown?.multiplier || 1}x</strong>
                  </div>
                </div>
              </div>

              {/* Ownership Breakdown */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Manager Ownership</span>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {ownershipPercent}% ({ownership?.count || 0} managers)
                  </span>
                </div>

                {ownership && ownership.managers && ownership.managers.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setShowOwnershipList(!showOwnershipList)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1 transition-colors"
                    >
                      <span>View Managers ({ownership.managers.length})</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showOwnershipList ? 'rotate-180' : ''}`} />
                    </button>

                    {showOwnershipList && (
                      <div className="mt-2 max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/50">
                        {ownership.managers.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between pt-1.5 text-xs"
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{m.teamName}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{m.managerName}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {m.isCaptain && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white shadow-xs">
                                  (C)
                                </span>
                              )}
                              {m.isViceCaptain && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-600 text-white">
                                  (V)
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};

// Sub-component for individual card on the opponent's pitch
const OpponentPlayerCard: React.FC<{
  player: any;
  points: number;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isTripleCaptain: boolean;
  onClick: () => void;
}> = ({ player, points, isCaptain, isViceCaptain, isTripleCaptain, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-between w-[68px] sm:w-[78px] min-h-[86px] sm:min-h-[96px] p-1.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-md border border-white/10 shadow-lg cursor-pointer transition-all duration-200 select-none hover:scale-[1.03] active:scale-95"
    >
      {/* Captain badge */}
      {isCaptain && (
        <span
          className={`absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full flex items-center justify-center font-black text-[9px] text-white shadow-md border z-20 ${
            isTripleCaptain ? 'bg-amber-400 text-slate-950 border-white ring-1 ring-amber-400' : 'bg-zinc-950 border-white/80'
          }`}
        >
          {isTripleCaptain ? 'TC' : 'C'}
        </span>
      )}

      {/* Vice-captain badge */}
      {isViceCaptain && !isCaptain && (
        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-slate-300 text-slate-950 border border-slate-700 flex items-center justify-center font-black text-[9px] shadow-md z-20">
          V
        </span>
      )}

      {/* Position Label */}
      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300/80 leading-none pt-0.5">
        {player.position}
      </span>

      {/* Jersey */}
      <div className="relative my-0.5 flex items-center justify-center">
        <KitJersey clubId={player.clubId} position={player.position} photoUrl={player.photoUrl} className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-md" />
      </div>

      {/* Bottom Name & Points */}
      <div className="w-full flex flex-col items-center justify-center text-center pb-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold text-white tracking-tight truncate leading-tight max-w-full">
          {player.webName}
        </span>
        <div className="text-[8.5px] font-mono text-slate-300/80 tabular-nums flex items-center justify-center gap-1 mt-0.5 leading-none">
          <span className="font-bold text-white">{points}pts</span>
        </div>
      </div>
    </div>
  );
};
