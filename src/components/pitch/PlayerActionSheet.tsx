import React, { useState, useRef } from 'react';
import { useFPL } from '../../context/FPLContext';
import { KitJersey } from './KitJersey';
import { CLUBS } from '../../data/clubs';
import { ArrowLeftRight, Crown, ShieldAlert, ArrowRight, X, Activity, Users, ChevronDown, Camera, Check, AlertCircle, Sparkles } from 'lucide-react';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import { PlayerPositionBadge, PlayerPositionOverrideNotice } from '../common/PlayerPositionNotice';
import { suggestPlayerPhotoApi } from '../../services/api';

import { GameweekCalculationResult, calculatePlayerPoints } from '../../engine/scoring';

interface PlayerActionSheetProps {
  playerId: string | null;
  onClose: () => void;
  selectedGW?: number;
  readOnly?: boolean;
  customCalculation?: GameweekCalculationResult;
}

export const PlayerActionSheet: React.FC<PlayerActionSheetProps> = ({
  playerId,
  onClose,
  selectedGW,
  readOnly = false,
  customCalculation,
}) => {
  const {
    players,
    squad,
    setSelectedPlayerForSwap,
    setCaptain,
    setViceCaptain,
    setActiveTab,
    currentGW,
    calculationResult,
    setTransferOutPlayerId,
    isSquadLocked,
    reorderBenchPlayer,
    playerOwnership,
    authUser,
    refreshServerState,
    fixtures,
    clubs,
  } = useFPL();

  const [showOwnershipList, setShowOwnershipList] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  if (!playerId) return null;

  const player = players[playerId];
  if (!player) return null;

  const freeTransfersCount = squad?.freeTransfers ?? 0;
  const isWildcard = squad?.activeChip === 'wildcard';
  const hasFreeTransfer = freeTransfersCount > 0;

  const activeCalc = customCalculation || calculationResult;
  const activeGW = selectedGW ?? currentGW;

  const squadPlayer = squad.players.find((p) => p.playerId === playerId);
  const isStarter = squadPlayer?.isStarter ?? false;
  const isCaptain = squadPlayer?.isCaptain ?? false;
  const isViceCaptain = squadPlayer?.isViceCaptain ?? false;
  const benchOrder = squadPlayer?.benchOrder || 0;

  const club = clubs?.[player.clubId] || CLUBS[player.clubId];
  const stats = player.gwStats[activeGW];
  const breakdown = activeCalc.playerPointsBreakdown?.[playerId];
  const isScoringActive = (squadPlayer?.isStarter ?? false) || breakdown?.isAutoSubIn || activeCalc.isBenchBoost;
  const currentPts = breakdown
    ? (isScoringActive ? breakdown.finalPoints : breakdown.rawPoints)
    : (stats ? calculatePlayerPoints(player.position, stats, false, player.id) : 0);

  const ownership = playerId && playerOwnership ? playerOwnership[playerId] : null;
  const ownershipPercent = ownership?.percent ?? (player?.selectedByPercent ?? 0);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !player) return;

    if (!file.type.startsWith('image/')) {
      setPhotoStatus('გთხოვთ აირჩიოთ სურათის ფაილი');
      setTimeout(() => setPhotoStatus(null), 4000);
      return;
    }

    try {
      setPhotoStatus('იტვირთება...');
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 280;
            if (width > height && width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            let dataUrl = canvas.toDataURL('image/jpeg', 0.80);
            if (dataUrl.length > 70000) {
              dataUrl = canvas.toDataURL('image/jpeg', 0.60);
            }

            const res = await suggestPlayerPhotoApi(player.id, dataUrl, authUser?.username);
            if (res?.isAdminDirect) {
              player.photoUrl = res.photoUrl || dataUrl;
              delete player.pendingPhotoUrl;
              setPhotoStatus('ფოტო წარმატებით დაემატა!');
            } else {
              player.pendingPhotoUrl = res?.pendingPhoto?.photoUrl || dataUrl;
              setPhotoStatus('მოთხოვნა გაიგზავნა! ადმინი მალე განიხილავს.');
            }
            refreshServerState?.();
            setTimeout(() => setPhotoStatus(null), 4000);
          } catch (err: any) {
            setPhotoStatus(err?.message || 'ატვირთვა ვერ მოხერხდა');
            setTimeout(() => setPhotoStatus(null), 4000);
          }
        };
        img.onerror = () => {
          setPhotoStatus('სურათის გახსნა ვერ მოხერხდა');
          setTimeout(() => setPhotoStatus(null), 4000);
        };
        img.src = ev.target?.result as string;
      };
      reader.onerror = () => {
        setPhotoStatus('ფაილის წაკითხვა ვერ მოხერხდა');
        setTimeout(() => setPhotoStatus(null), 4000);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setPhotoStatus(err?.message || 'ატვირთვა ვერ მოხერხდა');
      setTimeout(() => setPhotoStatus(null), 4000);
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleStartSwap = () => {
    if (isSquadLocked) return;
    setSelectedPlayerForSwap(playerId);
    onClose();
  };

  const handleMakeCaptain = () => {
    if (isSquadLocked) return;
    setCaptain(playerId);
    onClose();
  };

  const handleMakeViceCaptain = () => {
    if (isSquadLocked) return;
    setViceCaptain(playerId);
    onClose();
  };

  const handleTransfer = () => {
    if (isSquadLocked) return;
    setShowTransferConfirm(true);
  };

  const handleProceedTransfer = () => {
    if (isSquadLocked) return;
    setTransferOutPlayerId(playerId);
    setActiveTab('transfers');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in md:p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border-t md:border border-x border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl animate-slide-up text-slate-900 dark:text-white safe-bottom max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile only) */}
        <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

        {/* Player Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            {player.photoUrl ? (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <img
                  src={player.photoUrl}
                  alt={player.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/40 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800"
                />
                <KitJersey clubId={player.clubId} position={player.position} className="w-8 h-8 drop-shadow-xs" />
              </div>
            ) : player.pendingPhotoUrl ? (
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="relative w-12 h-12 shrink-0">
                  <img
                    src={player.pendingPhotoUrl}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-500/40 shadow-xs opacity-80 bg-slate-100 dark:bg-slate-800"
                  />
                  <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-black font-black px-1 rounded-full shadow-xs">
                    ⏳
                  </span>
                </div>
                <KitJersey clubId={player.clubId} position={player.position} className="w-8 h-8 drop-shadow-xs" />
              </div>
            ) : (
              <KitJersey clubId={player.clubId} position={player.position} className="w-12 h-12 shrink-0" />
            )}
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <PlayerPositionBadge playerId={player.id} position={player.position} />
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {club?.name || player.clubId}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                {player.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1">Cost: <PlayerPriceBadge player={player} showDifference={true} /></span>
                <span>•</span>
                <span>Selected: <strong className="text-emerald-600 dark:text-emerald-400">{ownershipPercent}%</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Position Override Notice (if effectively FWD) */}
        <PlayerPositionOverrideNotice playerId={player.id} position={player.position} className="my-2.5" />

        {/* Photo Tip & Upload Banner */}
        <div className="my-2.5 p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-4 h-4 text-sky-500 shrink-0" />
            <div className="text-[11px] leading-tight">
              <span className="font-bold text-sky-600 dark:text-sky-300 block">
                tip: you can add photos to players now!
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {photoStatus || (player.photoUrl ? 'გსურთ ფოტოს შეცვლა?' : 'მოითხოვეთ მოთამაშის რეალური ფოტო')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="px-2.5 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-[10px] transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
          >
            <Camera className="w-3 h-3" />
            <span>{player.photoUrl ? 'შეცვლა' : 'ატვირთვა'}</span>
          </button>
          <input
            type="file"
            ref={photoInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Match Gameweek Performance Card */}
        <div className="my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">
                GW {activeGW} Score {activeGW !== currentGW ? '(Archive)' : ''}
              </span>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                <span>Mins: <strong className="text-slate-900 dark:text-white">{stats?.minutes || 0}'</strong></span>
                {stats?.goals ? <span>• Goals: <strong className="text-emerald-600 dark:text-emerald-400">{stats.goals}</strong></span> : null}
                {stats?.assists ? <span>• Assists: <strong className="text-sky-500">{stats.assists}</strong></span> : null}
                {stats?.cleanSheet ? <span>• Clean Sheet</span> : null}
                {stats?.bonus ? <span>• Bonus: <strong className="text-amber-500">+{stats.bonus}</strong></span> : null}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{currentPts}</span>
            <span className="text-[10px] text-slate-400 block -mt-1">PTS</span>
          </div>
        </div>

        {/* Gameweek Performance History */}
        <div className="my-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gameweek Performance History</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400">
              {Object.keys(player.gwStats || {}).length} matchday{Object.keys(player.gwStats || {}).length === 1 ? '' : 's'}
            </span>
          </div>

          {Object.keys(player.gwStats || {}).length === 0 ? (
            <p className="text-[11px] text-slate-400 italic">No gameweek appearances recorded yet.</p>
          ) : (
            <div className="space-y-1.5 pt-1">
              {Object.entries(player.gwStats)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([gwStr, st]) => {
                  const gwNum = Number(gwStr);
                  const normClub = player.clubId === 'SCH' ? 'SCH_11_5' : player.clubId;
                  const fix = fixtures?.find(
                    (f) => f.gameweek === gwNum && (f.homeClubId === normClub || f.awayClubId === normClub)
                  );
                  const isHome = fix ? fix.homeClubId === normClub : true;
                  const oppId = fix ? (isHome ? fix.awayClubId : fix.homeClubId) : null;
                  const oppClub = oppId ? clubs?.[oppId] || CLUBS[oppId] : null;
                  const isOnePrice = fix?.venue === 'one_price';
                  const ptsForGW = calculatePlayerPoints(player.position, st, isOnePrice, player.id);

                  return (
                    <div
                      key={`perf-gw-${gwNum}`}
                      className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 font-mono font-black text-[10px]">
                            GW {gwNum}
                          </span>
                          <span className="font-bold truncate text-slate-800 dark:text-slate-200">
                            {oppClub ? `vs ${oppClub.shortName} (${isHome ? 'H' : 'A'})` : `Matchday ${gwNum}`}
                          </span>
                          {fix && fix.homeScore !== null && fix.awayScore !== null && (
                            <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {fix.homeScore}-{fix.awayScore}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          <span>⏱️ {st.minutes || 0}'</span>
                          {st.goals > 0 && <span className="text-emerald-500 font-bold">⚽ {st.goals}</span>}
                          {st.assists > 0 && <span className="text-sky-400 font-bold">🅰️ {st.assists}</span>}
                          {st.cleanSheet && <span className="text-teal-400 font-bold">🛡️ CS</span>}
                          {st.bonus && st.bonus > 0 && <span className="text-amber-400 font-bold">⭐ +{st.bonus}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-mono font-black text-emerald-500">
                          {ptsForGW}p
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Ownership Section */}
        <div className="my-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
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

        {/* Read-Only Archive Notice */}
        {readOnly && (
          <div className="my-2 p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs font-bold text-center">
            📜 Viewing Gameweek {activeGW} Archive (Read-Only)
          </div>
        )}

        {/* Lock warning if locked */}
        {!readOnly && isSquadLocked && (
          <div className="my-2 p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
            🔒 Lineups are locked for this Gameweek
          </div>
        )}

        {/* Bench Priority Reordering Section (Only for Substitutes in active GW) */}
        {!readOnly && !isStarter && (
          <div className="my-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Bench Substitute Priority
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                benchOrder === 1
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : benchOrder === 2
                  ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}>
                {benchOrder === 1 ? '1st Sub (Priority)' : benchOrder === 2 ? '2nd Sub' : '3rd Sub'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {benchOrder === 1
                ? '★ 1st Priority: Enters the match first if any starting outfield player does not play.'
                : `Sub ${benchOrder}: Enters after Sub ${benchOrder - 1} if another player does not play.`}
            </p>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <button
                disabled={isSquadLocked || benchOrder === 1}
                onClick={() => {
                  reorderBenchPlayer(playerId, 1);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 1
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/10 active:scale-95'
                }`}
              >
                <span>1st Sub</span>
              </button>
              <button
                disabled={isSquadLocked || benchOrder === 2}
                onClick={() => {
                  reorderBenchPlayer(playerId, 2);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 2
                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 active:scale-95'
                }`}
              >
                <span>2nd Sub</span>
              </button>
              <button
                disabled={isSquadLocked || benchOrder === 3}
                onClick={() => {
                  reorderBenchPlayer(playerId, 3);
                  onClose();
                }}
                className={`py-2 px-1.5 rounded-xl text-[11px] font-extrabold flex items-center justify-center border transition-all ${
                  benchOrder === 3
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 cursor-default'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 active:scale-95'
                }`}
              >
                <span>3rd Sub</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Action Grid (Disabled in Read-Only Archive) */}
        {!readOnly ? (
          showTransferConfirm ? (
            <div className="my-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3 animate-fade-in text-left">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isWildcard
                      ? 'bg-indigo-500/15 text-indigo-500'
                      : hasFreeTransfer
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-rose-500/15 text-rose-500'
                  }`}
                >
                  <ArrowRight className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider truncate">
                    მოთამაშის შეცვლა / Transfer Out
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {player.webName} (£{player.cost.toFixed(1)}m • {player.position})
                  </p>
                </div>
              </div>

              {/* Warning Notice Box */}
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                  isWildcard
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-200'
                    : hasFreeTransfer
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                {isWildcard ? (
                  <>
                    <strong className="block font-black mb-0.5 text-indigo-600 dark:text-indigo-400">
                      ✨ Wildcard გააქტიურებულია:
                    </strong>
                    ეს ტრანსფერი სრულიად უფასოა და არ დააკლდება ქულები თქვენს გუნდს (0 ჯარიმა).
                  </>
                ) : hasFreeTransfer ? (
                  <>
                    <strong className="block font-black mb-0.5 text-emerald-700 dark:text-emerald-300">
                      🟢 უფასო ტრანსფერის გამოყენება:
                    </strong>
                    თქვენ გაქვთ <strong>{freeTransfersCount} უფასო ტრანსფერი</strong>. ამ მოთამაშის შეცვლით გამოიყენებთ <strong>1 უფასო ტრანსფერს</strong> (დაგრჩებათ <strong>{freeTransfersCount - 1} FT</strong>, 0 ქულა ჯარიმა).
                  </>
                ) : (
                  <>
                    <strong className="block font-black mb-0.5 text-rose-600 dark:text-rose-400">
                      ⚠️ ყურადღება — -4 ქულა ჯარიმა!
                    </strong>
                    თქვენ ამოგეწურათ უფასო ტრანსფერები (<strong>0 FT დარჩენილი</strong>). ამ მოთამაშის შეცვლა დაგიჯდებათ <strong>-4 ქულა</strong> თქვენი საერთო ფენტეზი ქულებიდან!
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowTransferConfirm(false)}
                  className="flex-1 py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/15 transition-colors cursor-pointer"
                >
                  გაუქმება / Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProceedTransfer}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    !hasFreeTransfer && !isWildcard
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25'
                  }`}
                >
                  <span>გადასვლა →</span>
                  <span className="text-[10px] font-mono opacity-80">
                    {isWildcard ? '(0 pts)' : hasFreeTransfer ? '(1 FT)' : '(-4 pts)'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {/* Substitute / Swap Button */}
              <button
                onClick={handleStartSwap}
                disabled={isSquadLocked}
                className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                  isSquadLocked
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                <span>Substitute</span>
              </button>

              {/* Transfer Button */}
              <button
                onClick={handleTransfer}
                disabled={isSquadLocked}
                className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl border transition-colors ${
                  isSquadLocked
                    ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                  <span>Transfer Out</span>
                </div>
                <span
                  className={`text-[9.5px] font-mono font-black mt-0.5 ${
                    isWildcard
                      ? 'text-indigo-500'
                      : hasFreeTransfer
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {isWildcard ? 'Wildcard (Free)' : hasFreeTransfer ? `1 FT (${freeTransfersCount} left)` : '⚠️ -4 pts hit'}
                </span>
              </button>

              {/* Make Captain (Only for Starters) */}
              {isStarter && (
                <button
                  onClick={handleMakeCaptain}
                  disabled={isCaptain}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                    isCaptain
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-default'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>{isCaptain ? 'Captain (C)' : 'Make Captain'}</span>
                </button>
              )}

              {/* Make Vice Captain (Only for Starters) */}
              {isStarter && (
                <button
                  onClick={handleMakeViceCaptain}
                  disabled={isViceCaptain || isCaptain}
                  className={`flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl font-bold text-xs border transition-colors ${
                    isViceCaptain
                      ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30 cursor-default'
                      : isCaptain
                      ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800/40 border-transparent text-slate-400'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-sky-500" />
                  <span>{isViceCaptain ? 'Vice Captain (V)' : 'Make Vice C'}</span>
                </button>
              )}
            </div>
          )
        ) : (
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Lineup substitutions, captaincy, and transfers are only editable on the current gameweek.
          </div>
        )}
      </div>
    </div>
  );
};
