import React, { useState, useMemo, useRef } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Player, Position, Club, Fixture } from '../../types/fpl';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import { ClassGridView } from '../transfers/ClassGridView';
import { suggestPlayerPhotoApi, adminRemovePlayerPhotoApi } from '../../services/api';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Trophy,
  ArrowUpDown,
  Users,
  Calendar,
  Activity,
  X,
  Camera,
  Upload,
  Check,
  Sparkles,
  Filter,
  Shield,
  Clock,
  ChevronRight,
  TrendingUp,
  Percent,
  AlertCircle,
  Trash2,
} from 'lucide-react';

type SortOption = 'points' | 'rising' | 'cost' | 'goals' | 'assists' | 'selectedByPercent' | 'minutes';

export const PlayersView: React.FC = () => {
  const {
    players,
    clubs,
    squad,
    fixtures,
    currentGW,
    playerOwnership,
    authUser,
    buyPlayer,
    transferPlayer,
    isSquadLocked,
    isModerator,
    refreshServerState,
  } = useFPL();

  const [viewMode, setViewMode] = useState<'list' | 'classes'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [clubFilter, setClubFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('points');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Photo Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sortedClubs = useMemo(() => getSortedSchoolClubs(), []);

  // Compute aggregated stats for each player
  const enrichedPlayers = useMemo(() => {
    return Object.values(players).map((p) => {
      let totalGoals = 0;
      let totalAssists = 0;
      let totalMinutes = 0;
      let totalCS = 0;
      let totalSaves = 0;
      let totalMVP = 0;
      let totalYellow = 0;
      let totalRed = 0;

      Object.values(p.gwStats || {}).forEach((st) => {
        totalGoals += st.goals || 0;
        totalAssists += st.assists || 0;
        totalMinutes += st.minutes || 0;
        if (st.cleanSheet) totalCS += 1;
        totalSaves += (st.saves || 0) + (st.penaltiesSaved || 0);
        if (st.isMVP) totalMVP += 1;
        totalYellow += st.yellowCards || 0;
        totalRed += st.redCards || 0;
      });

      const ownershipInfo = playerOwnership[p.id];
      const ownershipPercent = ownershipInfo?.percent ?? p.selectedByPercent ?? 0;
      const ownershipCount = ownershipInfo?.count ?? 0;

      return {
        ...p,
        totalGoals,
        totalAssists,
        totalMinutes,
        totalCS,
        totalSaves,
        totalMVP,
        totalYellow,
        totalRed,
        ownershipPercent,
        ownershipCount,
      };
    });
  }, [players, playerOwnership]);

  // Filter and sort players
  const filteredAndSortedPlayers = useMemo(() => {
    let list = enrichedPlayers;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.webName.toLowerCase().includes(q) ||
          (clubs[p.clubId]?.name || '').toLowerCase().includes(q) ||
          (clubs[p.clubId]?.shortName || '').toLowerCase().includes(q)
      );
    }

    // Position filter
    if (positionFilter !== 'ALL') {
      list = list.filter((p) => p.position === positionFilter);
    }

    // Club filter
    if (clubFilter !== 'ALL') {
      list = list.filter((p) => {
        const norm = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        return norm === clubFilter || p.clubId === clubFilter;
      });
    }

    // Sort
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'points':
          valA = a.totalPoints;
          valB = b.totalPoints;
          break;
        case 'rising':
          valA = a.priceChange ?? (a.previousCost ? Math.round((a.cost - a.previousCost) * 10) / 10 : 0);
          valB = b.priceChange ?? (b.previousCost ? Math.round((b.cost - b.previousCost) * 10) / 10 : 0);
          break;
        case 'cost':
          valA = a.cost;
          valB = b.cost;
          break;
        case 'goals':
          valA = a.totalGoals;
          valB = b.totalGoals;
          break;
        case 'assists':
          valA = a.totalAssists;
          valB = b.totalAssists;
          break;
        case 'selectedByPercent':
          valA = a.ownershipPercent;
          valB = b.ownershipPercent;
          break;
        case 'minutes':
          valA = a.totalMinutes;
          valB = b.totalMinutes;
          break;
        default:
          valA = a.totalPoints;
          valB = b.totalPoints;
      }

      if (valA === valB) {
        return b.totalPoints - a.totalPoints;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [enrichedPlayers, searchQuery, positionFilter, clubFilter, sortBy, sortOrder, clubs]);

  const selectedPlayer = selectedPlayerId ? players[selectedPlayerId] : null;
  const enrichedSelectedPlayer = selectedPlayer
    ? enrichedPlayers.find((p) => p.id === selectedPlayer.id)
    : null;

  // Handle Photo File Upload
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlayer) return;

    if (!file.type.startsWith('image/')) {
      setPhotoFeedback({ type: 'error', message: 'Please select a valid image file.' });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoFeedback(null);

    try {
      // Compress and resize client-side to max 280x280 JPEG
      const compressedDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxSize = 280;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas error'));
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await suggestPlayerPhotoApi(
        selectedPlayer.id,
        compressedDataUrl,
        authUser?.username
      );

      if (res.success) {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        if (res.isAdminDirect) {
          selectedPlayer.photoUrl = res.photoUrl || compressedDataUrl;
          delete selectedPlayer.pendingPhotoUrl;
          setPhotoFeedback({
            type: 'success',
            message: `Profile picture attached directly for ${selectedPlayer.name}!`,
          });
          refreshServerState();
        } else {
          setPhotoFeedback({
            type: 'success',
            message: 'Photo submitted! Admins will review and approve it shortly.',
          });
        }
      }
    } catch (err: any) {
      setPhotoFeedback({
        type: 'error',
        message: err?.message || 'Failed to submit photo.',
      });
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Admin Direct Photo Removal
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const handleRemovePhoto = async () => {
    if (!selectedPlayer || !isModerator) return;
    if (!window.confirm(`Are you sure you want to remove ${selectedPlayer.name}'s profile picture?`)) return;

    setIsRemovingPhoto(true);
    setPhotoFeedback(null);
    try {
      const res = await adminRemovePlayerPhotoApi(selectedPlayer.id);
      delete selectedPlayer.photoUrl;
      delete selectedPlayer.pendingPhotoUrl;
      setPhotoFeedback({
        type: 'success',
        message: res.message || 'Profile picture removed.',
      });
      refreshServerState();
    } catch (err: any) {
      setPhotoFeedback({
        type: 'error',
        message: err?.message || 'Failed to remove profile picture.',
      });
    } finally {
      setIsRemovingPhoto(false);
    }
  };

  const getPositionBadgeColor = (pos: Position) => {
    switch (pos) {
      case 'GKP':
        return 'bg-amber-500/15 text-amber-500 border-amber-500/30';
      case 'DEF':
        return 'bg-sky-500/15 text-sky-500 border-sky-500/30';
      case 'MID':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30';
      case 'FWD':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/30';
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-slate-900 dark:text-white">
      {/* Hidden File Input for Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-slate-200 dark:border-white/10 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase">Players / მოთამაშეები</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse stats, rankings, match logs and player profiles ({filteredAndSortedPlayers.length} total)
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle (List vs Classes/Calendar) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200 dark:border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋 List View</span>
          </button>
          <button
            onClick={() => setViewMode('classes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'classes'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🏫 Classes View</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CLASSES / CALENDAR VIEW                                                   */}
      {/* ========================================================================= */}
      {viewMode === 'classes' ? (
        <div className="space-y-4">
          <div className="p-3 bg-slate-100 dark:bg-zinc-900/60 rounded-2xl border border-slate-200 dark:border-white/10 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Click any class to expand all players, and tap any player to view full stats & match history.</span>
          </div>

          <ClassGridView
            players={players}
            clubs={clubs}
            squad={squad}
            outPlayer={null}
            inPlayerId={null}
            onSelectInPlayer={() => {}}
            onBuyPlayer={(pid) => setSelectedPlayerId(pid)}
            isSquadLocked={isSquadLocked}
            validSquadCount={squad.players.length}
            searchQuery={searchQuery}
            positionFilter={positionFilter}
          />
        </div>
      ) : (
        /* ========================================================================= */
        /* LIST / SORTING VIEW                                                       */
        /* ========================================================================= */
        <div className="space-y-3.5">
          {/* Filters & Search Toolbar */}
          <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
            {/* Search Input & Club Select */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search player or class (e.g. 10/1)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Class Dropdown */}
              <select
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className="px-3 py-2 rounded-2xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Classes ({sortedClubs.length})</option>
                {sortedClubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.shortName || c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Position Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => {
                const count =
                  pos === 'ALL'
                    ? enrichedPlayers.length
                    : enrichedPlayers.filter((p) => p.position === pos).length;
                const isActive = positionFilter === pos;

                return (
                  <button
                    key={pos}
                    onClick={() => setPositionFilter(pos)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all shrink-0 border ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs'
                        : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'
                    }`}
                  >
                    {pos} ({count})
                  </button>
                );
              })}
            </div>

            {/* Sorting Tabs */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3" />
                  Sort By:
                </span>

                {[
                  { id: 'points', label: 'Points', icon: Trophy },
                  { id: 'rising', label: 'Rising 📈', icon: TrendingUp },
                  { id: 'cost', label: 'Price', icon: TrendingUp },
                  { id: 'goals', label: 'Goals ⚽', icon: Activity },
                  { id: 'assists', label: 'Assists 🅰️', icon: Activity },
                  { id: 'selectedByPercent', label: '% Owned 👥', icon: Percent },
                  { id: 'minutes', label: 'Minutes ⏱️', icon: Clock },
                ].map((s) => {
                  const isActive = sortBy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (sortBy === s.id) {
                          setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                        } else {
                          setSortBy(s.id as SortOption);
                          setSortOrder('desc');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 border ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'
                      }`}
                    >
                      <span>{s.label}</span>
                      {isActive && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Order direction toggle */}
              <button
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                {sortOrder === 'desc' ? 'Highest First (↓)' : 'Lowest First (↑)'}
              </button>
            </div>
          </div>

          {/* Player Cards / List */}
          <div className="space-y-2">
            {filteredAndSortedPlayers.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="text-sm font-bold">No players found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPositionFilter('ALL');
                    setClubFilter('ALL');
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredAndSortedPlayers.map((p, idx) => {
                const club = clubs[p.clubId] || CLUBS[p.clubId];
                const clubShort = club?.shortName || p.clubId.replace('SCH_', '').replace('_', '/');
                const isOwnedByMe = squad.players.some((sp) => sp.playerId === p.id);

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    className="group p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    {/* Left: Rank & Avatar & Names */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-center font-mono font-black text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        #{idx + 1}
                      </span>

                      {/* Photo / Avatar */}
                      <div className="relative w-11 h-11 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 shadow-xs">
                        {p.photoUrl ? (
                          <img
                            src={p.photoUrl}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <KitJersey clubId={p.clubId} position={p.position} className="w-8 h-8" />
                        )}
                        {isOwnedByMe && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black flex items-center justify-center">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Name & Class info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase border ${getPositionBadgeColor(p.position)}`}>
                            {p.position}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            Class {clubShort}
                          </span>
                          {p.pendingPhotoUrl && (
                            <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Photo Pending
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-black truncate group-hover:text-emerald-500 transition-colors">
                          {p.name}
                        </h4>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>⚽ {p.totalGoals}</span>
                          <span>•</span>
                          <span>🅰️ {p.totalAssists}</span>
                          <span>•</span>
                          <span>⏱️ {p.totalMinutes}'</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Key Stats & Action */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                      {/* Ownership % */}
                      <div className="hidden sm:block">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Owned</span>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          {p.ownershipPercent}%
                        </span>
                      </div>

                      {/* Price */}
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Price</span>
                        <PlayerPriceBadge
                          player={p}
                          showDifference={sortBy === 'rising'}
                          className="text-xs sm:text-sm font-black text-slate-800 dark:text-white"
                        />
                      </div>

                      {/* Total Points */}
                      <div className="min-w-[48px]">
                        <span className="block text-[9px] uppercase font-bold text-slate-400">Pts</span>
                        <span className="text-sm sm:text-base font-mono font-black text-amber-500">
                          {p.totalPoints}
                        </span>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DETAILED PLAYER MODAL                                                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {selectedPlayer && enrichedSelectedPlayer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in"
            onClick={() => {
              setSelectedPlayerId(null);
              setPhotoFeedback(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/15 shadow-2xl overflow-hidden flex flex-col text-slate-900 dark:text-white"
            >
              {/* Modal Header */}
              <div className="relative p-4 sm:p-5 bg-slate-100 dark:bg-zinc-950 border-b border-slate-200 dark:border-white/10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  {/* Avatar / Photo with Upload Button */}
                  <div className="relative group shrink-0">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border-2 border-emerald-500/50 shadow-md flex items-center justify-center">
                      {selectedPlayer.photoUrl ? (
                        <img
                          src={selectedPlayer.photoUrl}
                          alt={selectedPlayer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <KitJersey clubId={selectedPlayer.clubId} position={selectedPlayer.position} className="w-12 h-12" />
                      )}
                    </div>

                    {/* Camera Upload Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                      title="Upload profile picture"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-[9px] font-bold mt-0.5">Upload</span>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${getPositionBadgeColor(selectedPlayer.position)}`}>
                        {selectedPlayer.position}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Class {clubs[selectedPlayer.clubId]?.shortName || selectedPlayer.clubId.replace('SCH_', '').replace('_', '/')}
                      </span>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 ml-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{selectedPlayer.photoUrl ? 'Change Photo' : 'Upload Photo'}</span>
                      </button>

                      {isModerator && selectedPlayer.photoUrl && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={isRemovingPhoto}
                          className="text-[10px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-0.5 ml-1.5 cursor-pointer transition-colors"
                          title="Admin: Remove Profile Picture"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>{isRemovingPhoto ? 'Removing...' : 'Remove Photo'}</span>
                        </button>
                      )}
                    </div>

                    <h3 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                      {selectedPlayer.name}
                    </h3>

                    <div className="flex items-center gap-2.5 text-xs font-mono mt-0.5 flex-wrap">
                      <PlayerPriceBadge player={selectedPlayer} showDifference={true} className="text-sm font-black" />
                      <span>•</span>
                      <span className="font-bold text-amber-500">
                        {selectedPlayer.totalPoints} Pts
                      </span>
                      <span>•</span>
                      <span className="text-slate-400">
                        {enrichedSelectedPlayer.ownershipPercent}% Owned
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setPhotoFeedback(null);
                  }}
                  className="p-2 rounded-full bg-slate-200/80 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Photo Upload Feedback Banner */}
              {photoFeedback && (
                <div
                  className={`p-3 text-xs font-bold flex items-center gap-2 ${
                    photoFeedback.type === 'success'
                      ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
                  }`}
                >
                  {photoFeedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{photoFeedback.message}</span>
                </div>
              )}

              {/* Modal Scrollable Content */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                {/* Stats Dashboard Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center">
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Goals</span>
                    <span className="text-sm sm:text-base font-black font-mono">{enrichedSelectedPlayer.totalGoals}</span>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Assists</span>
                    <span className="text-sm sm:text-base font-black font-mono">{enrichedSelectedPlayer.totalAssists}</span>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Minutes</span>
                    <span className="text-sm sm:text-base font-black font-mono">{enrichedSelectedPlayer.totalMinutes}'</span>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Clean Sh.</span>
                    <span className="text-sm sm:text-base font-black font-mono">{enrichedSelectedPlayer.totalCS}</span>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">Saves</span>
                    <span className="text-sm sm:text-base font-black font-mono">{enrichedSelectedPlayer.totalSaves}</span>
                  </div>
                  <div className="p-2 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                    <span className="block text-[9px] uppercase font-bold text-slate-400">MVP ⭐</span>
                    <span className="text-sm sm:text-base font-black font-mono text-amber-500">{enrichedSelectedPlayer.totalMVP}</span>
                  </div>
                </div>

                {/* Ownership Details */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Manager Ownership ({enrichedSelectedPlayer.ownershipPercent}%)</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {enrichedSelectedPlayer.ownershipCount} managers
                    </span>
                  </div>

                  {playerOwnership[selectedPlayer.id]?.managers?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {playerOwnership[selectedPlayer.id].managers.map((m) => (
                        <span
                          key={m.id}
                          className="px-2 py-1 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-white/10 text-[10px] font-bold flex items-center gap-1"
                        >
                          <span>{m.managerName}</span>
                          <span className="text-slate-400 font-normal">({m.teamName})</span>
                          {m.isCaptain && <span className="text-amber-400 font-black">©</span>}
                          {m.isViceCaptain && <span className="text-slate-400 font-black">ⓥ</span>}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No approved managers have picked this player yet.</p>
                  )}
                </div>

                {/* Recent Matches & Contributions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Recent Matches &amp; Contributions</span>
                  </h4>

                  {Object.keys(selectedPlayer.gwStats || {}).length === 0 ? (
                    <p className="text-xs text-slate-400 italic p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5">
                      No match statistics recorded for this player yet.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {Object.entries(selectedPlayer.gwStats || {})
                        .sort(([a], [b]) => Number(b) - Number(a))
                        .map(([gwStr, st]) => {
                          const gw = Number(gwStr);
                          const normClub = selectedPlayer.clubId === 'SCH' ? 'SCH_11_5' : selectedPlayer.clubId;
                          const fix = fixtures.find(
                            (f) => f.gameweek === gw && (f.homeClubId === normClub || f.awayClubId === normClub)
                          );
                          const isHome = fix ? fix.homeClubId === normClub : true;
                          const oppId = fix ? (isHome ? fix.awayClubId : fix.homeClubId) : null;
                          const oppClub = oppId ? clubs[oppId] || CLUBS[oppId] : null;

                          return (
                            <div
                              key={`gw-${gw}`}
                              className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-mono font-black text-[10px]">
                                    GW {gw}
                                  </span>
                                  <span className="font-bold">
                                    {oppClub ? `vs ${oppClub.shortName} (${isHome ? 'H' : 'A'})` : `Matchday ${gw}`}
                                  </span>
                                  {fix && fix.homeScore !== null && fix.awayScore !== null && (
                                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-white/10 font-bold">
                                      {fix.homeScore} - {fix.awayScore}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                                  <span>Minutes: {st.minutes}'</span>
                                  {st.goals > 0 && <span className="text-emerald-500 font-bold">⚽ {st.goals}</span>}
                                  {st.assists > 0 && <span className="text-sky-400 font-bold">🅰️ {st.assists}</span>}
                                  {st.cleanSheet && <span className="text-teal-400 font-bold">🛡️ Clean Sheet</span>}
                                  {st.yellowCards > 0 && <span className="text-amber-400">🟨 {st.yellowCards}</span>}
                                  {st.redCards > 0 && <span className="text-rose-500">🟥 {st.redCards}</span>}
                                  {st.isMVP && <span className="text-amber-400 font-bold">⭐ MVP</span>}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="block text-[9px] uppercase font-bold text-slate-400">GW Pts</span>
                                <span className="text-sm font-mono font-black text-amber-500">
                                  {selectedPlayer.gwPoints || 0}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Upcoming Fixtures */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Upcoming Matches</span>
                  </h4>

                  {(() => {
                    const normClub = selectedPlayer.clubId === 'SCH' ? 'SCH_11_5' : selectedPlayer.clubId;
                    const upcoming = fixtures
                      .filter((f) => !f.isFinished && (f.homeClubId === normClub || f.awayClubId === normClub))
                      .sort((a, b) => a.gameweek - b.gameweek);

                    if (upcoming.length === 0) {
                      return <p className="text-xs text-slate-400 italic">No upcoming matches scheduled.</p>;
                    }

                    return (
                      <div className="space-y-1.5">
                        {upcoming.slice(0, 3).map((fix) => {
                          const isHome = fix.homeClubId === normClub;
                          const oppId = isHome ? fix.awayClubId : fix.homeClubId;
                          const oppClub = clubs[oppId] || CLUBS[oppId];
                          return (
                            <div
                              key={fix.id}
                              className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 font-mono font-bold text-[10px]">
                                  GW {fix.gameweek}
                                </span>
                                <span className="font-bold">
                                  vs {oppClub?.name || oppId} ({isHome ? 'Home' : 'Away'})
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                                {fix.venue === 'one_price' ? '🏢 One Price' : '🏟️ Parki'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
