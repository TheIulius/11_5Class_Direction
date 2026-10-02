import React, { useState, useMemo, useRef } from 'react';
import { useFPL } from '../../context/FPLContext';
import { Player, Position, Club, Fixture } from '../../types/fpl';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import { KitJersey } from '../pitch/KitJersey';
import { PlayerPriceBadge } from '../common/PlayerPriceBadge';
import { PlayerPositionBadge, PlayerPositionOverrideNotice } from '../common/PlayerPositionNotice';
import { ClassShieldBadge } from '../common/ClassShieldBadge';
import {
  ClassTwoTierPillStrip,
  GradeOption,
  SectionOption,
  matchesGradeAndSection,
} from '../common/ClassTwoTierPillStrip';
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
  ChevronDown,
  TrendingUp,
  Percent,
  AlertCircle,
  Trash2,
} from 'lucide-react';

export type SortOption = 'points' | 'rising' | 'cost' | 'goals' | 'assists' | 'selectedByPercent' | 'minutes';
export type ClassSortOption = 'totalPoints' | 'goals' | 'avgPrice' | 'activeAvgPrice' | 'minutes' | 'gwPoints';
export type ViewMode = 'players' | 'classes';

export interface AggregatedClass {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  totalPoints: number;
  gwPoints: number;
  totalGoals: number;
  totalAssists: number;
  cleanSheets: number;
  totalMinutes: number;
  totalSquadCost: number;
  avgPrice: number;
  activeAvgPrice: number;
  activePlayerCount: number;
  players: any[];
}

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

  const [viewMode, setViewMode] = useState<ViewMode>('players');
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<Position | 'ALL'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<GradeOption>('ALL');
  const [selectedSection, setSelectedSection] = useState<SectionOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('points');
  const [classSortBy, setClassSortBy] = useState<ClassSortOption>('totalPoints');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
  const [buyNotification, setBuyNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss buy notifications
  React.useEffect(() => {
    if (!buyNotification) return;
    const timer = setTimeout(() => setBuyNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [buyNotification]);

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

    // Grade and Section filter
    if (selectedGrade !== 'ALL') {
      list = list.filter((p) => matchesGradeAndSection(p.clubId, selectedGrade, selectedSection));
    }

    // When sorting by Rising, hide players with 0 price change
    if (sortBy === 'rising') {
      list = list.filter((p) => {
        const diff = p.priceChange ?? (p.previousCost ? Math.round((p.cost - p.previousCost) * 10) / 10 : 0);
        return diff !== 0;
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
  }, [enrichedPlayers, searchQuery, positionFilter, selectedGrade, selectedSection, sortBy, sortOrder, clubs]);

  // Class Data Aggregation & Sorting
  const aggregatedClasses = useMemo(() => {
    const allClubs = getSortedSchoolClubs(clubs);

    const list: AggregatedClass[] = allClubs.map((club) => {
      const classPlayers = enrichedPlayers.filter((p) => {
        const normClub = p.clubId === 'SCH' ? 'SCH_11_5' : p.clubId;
        return normClub === club.id;
      });

      const totalPoints = classPlayers.reduce((sum, p) => sum + (p.totalPoints || 0), 0);
      const gwPoints = classPlayers.reduce((sum, p) => sum + (p.gwPoints || 0), 0);
      const totalGoals = classPlayers.reduce((sum, p) => sum + (p.totalGoals || 0), 0);
      const totalAssists = classPlayers.reduce((sum, p) => sum + (p.totalAssists || 0), 0);
      const cleanSheets = classPlayers.reduce((sum, p) => {
        if (p.position === 'GKP' || p.position === 'DEF') {
          return sum + (p.totalCS || 0);
        }
        return sum;
      }, 0);
      const totalMinutes = classPlayers.reduce((sum, p) => sum + (p.totalMinutes || 0), 0);
      const totalSquadCost = classPlayers.reduce((sum, p) => sum + (p.cost || 0), 0);
      const avgPrice = classPlayers.length > 0 ? totalSquadCost / classPlayers.length : 0;

      const activePlayers = classPlayers.filter((p) => (p.totalMinutes || 0) > 0);
      const activePlayerCount = activePlayers.length;
      const activeSquadCost = activePlayers.reduce((sum, p) => sum + (p.cost || 0), 0);
      const activeAvgPrice = activePlayerCount > 0 ? activeSquadCost / activePlayerCount : avgPrice;

      return {
        id: club.id,
        name: club.name,
        shortName: club.shortName,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        textColor: club.textColor,
        totalPoints,
        gwPoints,
        totalGoals,
        totalAssists,
        cleanSheets,
        totalMinutes,
        totalSquadCost,
        avgPrice,
        activeAvgPrice,
        activePlayerCount,
        players: classPlayers,
      };
    });

    return list;
  }, [enrichedPlayers, clubs]);

  // Filter and sort classes
  const filteredAndSortedClasses = useMemo(() => {
    let list = [...aggregatedClasses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.shortName.toLowerCase().includes(q) ||
          `class ${c.shortName}`.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    // Grade and Section filter
    if (selectedGrade !== 'ALL') {
      list = list.filter((c) => matchesGradeAndSection(c.id, selectedGrade, selectedSection));
    }

    // Sort
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;

      switch (classSortBy) {
        case 'totalPoints':
          valA = a.totalPoints;
          valB = b.totalPoints;
          break;
        case 'goals':
          valA = a.totalGoals;
          valB = b.totalGoals;
          break;
        case 'avgPrice':
          valA = a.avgPrice;
          valB = b.avgPrice;
          break;
        case 'activeAvgPrice':
          valA = a.activeAvgPrice;
          valB = b.activeAvgPrice;
          break;
        case 'minutes':
          valA = a.totalMinutes;
          valB = b.totalMinutes;
          break;
        case 'gwPoints':
          valA = a.gwPoints;
          valB = b.gwPoints;
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
  }, [aggregatedClasses, searchQuery, selectedGrade, selectedSection, classSortBy, sortOrder]);

  const handleBuyPlayer = (e: React.MouseEvent, p: Player) => {
    e.stopPropagation();
    if (isSquadLocked) {
      setBuyNotification({ type: 'error', message: 'Lineups are locked. The deadline has passed.' });
      return;
    }
    const isAlreadyOwned = squad.players.some((sp) => sp.playerId === p.id);
    if (isAlreadyOwned) {
      setBuyNotification({ type: 'error', message: `${p.webName} is already in your squad!` });
      return;
    }
    const res = buyPlayer(p.id);
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setBuyNotification({ type: 'success', message: `${p.webName} added to your squad!` });
    } else {
      setBuyNotification({ type: 'error', message: res.message || 'Could not add player to squad.' });
    }
  };

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
            try {
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
              if (!ctx) return reject(new Error('Canvas-ის შეცდომა'));
              ctx.drawImage(img, 0, 0, width, height);

              let result = canvas.toDataURL('image/jpeg', 0.80);
              if (result.length > 70000) {
                result = canvas.toDataURL('image/jpeg', 0.60);
              }
              resolve(result);
            } catch (canvasErr: any) {
              reject(new Error(canvasErr?.message || 'სურათის დამუშავება ვერ მოხერხდა'));
            }
          };
          img.onerror = () => reject(new Error('სურათის გახსნა ვერ მოხერხდა (Invalid image file)'));
          img.src = event.target?.result as string;
        };
        reader.onerror = () => reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));
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
            message: `ფოტო დაყენდა ${selectedPlayer.name}-სთვის! (Attached directly)`,
          });
          refreshServerState();
        } else {
          selectedPlayer.pendingPhotoUrl = res.pendingPhoto?.photoUrl || compressedDataUrl;
          setPhotoFeedback({
            type: 'success',
            message: 'ფოტო წარმატებით გაიგზავნა! ადმინი მალე განიხილავს და დაამტკიცებს.',
          });
          refreshServerState();
        }
      }
    } catch (err: any) {
      setPhotoFeedback({
        type: 'error',
        message: err?.message || 'ფოტოს ატვირთვა ვერ მოხერხდა. გთხოვთ სცადოთ თავიდან.',
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
                {viewMode === 'players'
                  ? `Browse stats, rankings, match logs and player profiles (${filteredAndSortedPlayers.length} total)`
                  : `Browse and compare class performance, statistics, and rosters (${filteredAndSortedClasses.length} classes)`}
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle (List vs Classes) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200 dark:border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('players')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'players'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋 List</span>
          </button>
          <button
            onClick={() => setViewMode('classes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              viewMode === 'classes'
                ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs font-black'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>🏫 Classes</span>
          </button>
        </div>
      </div>

      {/* Buy Notification Banner */}
      {buyNotification && (
        <div
          className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-fade-in ${
            buyNotification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {buyNotification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{buyNotification.message}</span>
          </div>
          <button
            onClick={() => setBuyNotification(null)}
            className="p-1 hover:opacity-75 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Photo encouragement banner */}
      <div className="p-3 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-transparent rounded-2xl border border-sky-500/30 text-xs flex items-center justify-between gap-2 text-sky-800 dark:text-sky-200 shadow-xs">
        <div className="flex items-center gap-2 min-w-0">
          <Camera className="w-4 h-4 text-sky-500 shrink-0" />
          <span className="font-bold tracking-tight">
            💡 tip: you can add photos to players now! Tap any player to upload or request.
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-3.5">
        {/* Filters & Search Toolbar */}
        <div className="p-4 rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-3 shadow-xs">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'players' ? "Search player or class (e.g. 10/1)..." : "Search class (e.g. 10/1, 10)..."}
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

          {/* Class Filter (Two-Tier Sliding Pill Strip) */}
          <ClassTwoTierPillStrip
            selectedGrade={selectedGrade}
            selectedSection={selectedSection}
            onGradeChange={setSelectedGrade}
            onSectionChange={setSelectedSection}
            layoutIdPrefix="playersView"
          />

          {/* Position Filter Pills (Only for Players viewMode) */}
          {viewMode === 'players' && (
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
                        ? 'bg-sky-500 text-white border-sky-500 shadow-xs dark:bg-white dark:text-slate-950 dark:border-white'
                        : 'bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-sky-300 dark:hover:border-white/20 hover:text-slate-900'
                    }`}
                  >
                    {pos} ({count})
                  </button>
                );
              })}
            </div>
          )}

          {/* Sorting Tabs */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3 h-3" />
                Sort By:
              </span>

              {viewMode === 'players'
                ? [
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
                            ? 'bg-sky-500/15 text-sky-700 dark:text-emerald-400 border-sky-500/40 dark:border-emerald-500/40 shadow-xs'
                            : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-sky-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span>{s.label}</span>
                        {isActive && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                      </button>
                    );
                  })
                : [
                    { id: 'totalPoints', label: 'Total Pts', icon: Trophy },
                    { id: 'goals', label: 'Goals ⚽', icon: Activity },
                    { id: 'avgPrice', label: 'Avg Price', icon: TrendingUp },
                    { id: 'activeAvgPrice', label: 'Active Avg Price', icon: TrendingUp },
                    { id: 'minutes', label: 'Minutes ⏱️', icon: Clock },
                    { id: 'gwPoints', label: 'Rising (GW Pts)', icon: TrendingUp },
                  ].map((s) => {
                    const isActive = classSortBy === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (classSortBy === s.id) {
                            setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                          } else {
                            setClassSortBy(s.id as ClassSortOption);
                            setSortOrder('desc');
                          }
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shrink-0 flex items-center gap-1 border ${
                          isActive
                            ? 'bg-sky-500/15 text-sky-700 dark:text-emerald-400 border-sky-500/40 dark:border-emerald-500/40 shadow-xs'
                            : 'bg-slate-50 dark:bg-zinc-950/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-sky-300 dark:hover:border-slate-700'
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
              className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-zinc-950 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white shrink-0"
            >
              {sortOrder === 'desc' ? 'Highest First (↓)' : 'Lowest First (↑)'}
            </button>
          </div>
        </div>

        {/* Content: Either Player Cards or Class Cards */}
        {viewMode === 'players' ? (
          /* Player Cards / List */
          <div className="space-y-2">
            {filteredAndSortedPlayers.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="text-sm font-bold">No players found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setPositionFilter('ALL');
                    setSelectedGrade('ALL');
                    setSelectedSection('ALL');
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

                // Divider between rising and falling when sorted by Rising
                const priceDiff = p.priceChange ?? (p.previousCost ? Math.round((p.cost - p.previousCost) * 10) / 10 : 0);
                const prevPlayer = idx > 0 ? filteredAndSortedPlayers[idx - 1] : null;
                const prevDiff = prevPlayer
                  ? (prevPlayer.priceChange ?? (prevPlayer.previousCost ? Math.round((prevPlayer.cost - prevPlayer.previousCost) * 10) / 10 : 0))
                  : 0;
                const showRisingDivider = sortBy === 'rising' && sortOrder === 'desc' && prevDiff > 0 && priceDiff < 0;
                const showRisingDividerAsc = sortBy === 'rising' && sortOrder === 'asc' && prevDiff < 0 && priceDiff > 0;

                return (
                  <React.Fragment key={p.id}>
                  {(showRisingDivider || showRisingDividerAsc) && (
                    <div className="flex items-center gap-3 py-2">
                      <div className="flex-1 h-px bg-gradient-to-r from-emerald-500/60 to-emerald-500/10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                        {showRisingDivider ? '📉 Falling' : '📈 Rising'}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-l from-rose-500/60 to-rose-500/10" />
                    </div>
                  )}
                  <div
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
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black flex items-center justify-center z-20">
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
                  </React.Fragment>
                );
              })
            )}
          </div>
        ) : (
          /* Classes Analysis Cards with 4-Column Position Board */
          <div className="space-y-2">
            {filteredAndSortedClasses.length === 0 ? (
              <div className="p-8 text-center rounded-3xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
                <p className="text-sm font-bold">No classes found matching your filters</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGrade('ALL');
                    setSelectedSection('ALL');
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredAndSortedClasses.map((cls, idx) => {
                const isExpanded = expandedClassId === cls.id;

                return (
                  <div
                    key={cls.id}
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 overflow-hidden shadow-xs hover:border-emerald-500/50 transition-all"
                  >
                    {/* Collapsed Class Card UI */}
                    <div
                      onClick={() => setExpandedClassId((prev) => (prev === cls.id ? null : cls.id))}
                      className="group p-3 hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center justify-between gap-3"
                    >
                      {/* Left side: Rank badge, Crest/Avatar, Class Title, Sub-row */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center font-mono font-black text-xs text-slate-400 dark:text-slate-500 shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Class crest / avatar with club colors */}
                        <div className="shrink-0 flex items-center justify-center">
                          <ClassShieldBadge clubId={cls.id} size="sm" />
                        </div>

                        {/* Class title and Sub-row */}
                        <div className="min-w-0">
                          <h4 className="text-sm font-black truncate text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">
                            Class {cls.shortName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            <span>⚽ {cls.totalGoals}</span>
                            <span>•</span>
                            <span>👟 {cls.totalAssists}</span>
                            <span>•</span>
                            <span>👥 {cls.activePlayerCount}/{cls.players.length} Active</span>
                          </div>
                        </div>
                      </div>

                      {/* Right side: Selected sorting metric, bold Total Points, expand chevron */}
                      <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-right">
                        {/* Selected sorting metric */}
                        <div className="hidden sm:block">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">
                            {classSortBy === 'avgPrice'
                              ? 'Avg Price'
                              : classSortBy === 'activeAvgPrice'
                              ? 'Active Avg'
                              : classSortBy === 'goals'
                              ? 'Goals'
                              : classSortBy === 'minutes'
                              ? 'Minutes'
                              : classSortBy === 'gwPoints'
                              ? 'GW Pts'
                              : 'GW Pts'}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                            {classSortBy === 'avgPrice'
                              ? `£${cls.avgPrice.toFixed(1)}m`
                              : classSortBy === 'activeAvgPrice'
                              ? `£${cls.activeAvgPrice.toFixed(1)}m`
                              : classSortBy === 'goals'
                              ? `⚽ ${cls.totalGoals}`
                              : classSortBy === 'minutes'
                              ? `${cls.totalMinutes}'`
                              : classSortBy === 'gwPoints'
                              ? (cls.gwPoints > 0 ? `+${cls.gwPoints}` : cls.gwPoints)
                              : (cls.gwPoints > 0 ? `+${cls.gwPoints}` : cls.gwPoints)}
                          </span>
                        </div>

                        {/* Bold Total Points */}
                        <div className="min-w-[48px]">
                          <span className="block text-[9px] uppercase font-bold text-slate-400">Pts</span>
                          <span className="text-sm sm:text-base font-mono font-black text-amber-500">
                            {cls.totalPoints} pts
                          </span>
                        </div>

                        {/* Chevron */}
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180 text-emerald-500' : 'group-hover:translate-y-0.5'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Expanded Class Detail Panel */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          key={`expanded-${cls.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden border-t border-slate-200 dark:border-white/10"
                        >
                          <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 bg-slate-50/50 dark:bg-zinc-950/40">
                            {/* A. Detailed Stats Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 text-center shadow-xs">
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Total Pts</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-amber-500">{cls.totalPoints}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">GW Pts</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-emerald-500">
                                  {cls.gwPoints > 0 ? `+${cls.gwPoints}` : cls.gwPoints}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Goals</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-white">⚽ {cls.totalGoals}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Assists</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-white">🅰️ {cls.totalAssists}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Clean Sheets</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-teal-500 dark:text-teal-400">🛡️ {cls.cleanSheets}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Squad Value</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-white">£{cls.totalSquadCost.toFixed(1)}m</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Overall Avg</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-slate-800 dark:text-white">£{cls.avgPrice.toFixed(1)}m</span>
                              </div>
                              <div>
                                <span className="block text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase leading-tight">Active Avg</span>
                                <span className="text-xs sm:text-sm font-mono font-black text-sky-500 dark:text-sky-400">£{cls.activeAvgPrice.toFixed(1)}m</span>
                              </div>
                            </div>

                            {/* B. 4-Column Position Roster Board (GKP | DEF | MID | FWD) */}
                            <div className="grid grid-cols-4 gap-1 sm:gap-2 md:gap-0 md:divide-x divide-slate-200 dark:divide-white/[0.08]">
                              {(['GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => {
                                const posPlayers = cls.players
                                  .filter((p) => p.position === pos)
                                  .sort((a, b) => b.totalPoints - a.totalPoints || b.cost - a.cost);

                                return (
                                  <div
                                    key={pos}
                                    className="min-w-0 px-0.5 sm:px-2 md:px-3 first:pl-0 last:pr-0"
                                  >
                                    {/* Column Header */}
                                    <div className="text-center pb-1.5 mb-1.5 sm:pb-2 sm:mb-2 border-b border-slate-200 dark:border-white/[0.08]">
                                      <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                                        {pos}
                                      </span>
                                      <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-0.5 sm:ml-1 font-bold">
                                        ({posPlayers.length})
                                      </span>
                                    </div>

                                    {/* Player Cards */}
                                    {posPlayers.length === 0 ? (
                                      <div className="py-4 sm:py-6 text-center text-[9px] sm:text-[11px] text-slate-400 italic">
                                        No {pos}
                                      </div>
                                    ) : (
                                      <div className="space-y-1.5 sm:space-y-2">
                                        {posPlayers.map((p) => {
                                          const isOwned = squad.players.some((sp) => sp.playerId === p.id);
                                          return (
                                            <div
                                              key={p.id}
                                              onClick={() => setSelectedPlayerId(p.id)}
                                              className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col items-center text-center group relative overflow-hidden"
                                            >
                                              {/* Kit Graphic */}
                                              <div className="relative my-0.5 sm:my-1">
                                                <KitJersey
                                                  clubId={p.clubId}
                                                  position={p.position}
                                                  photoUrl={p.photoUrl}
                                                  className="w-7 h-7 sm:w-10 sm:h-10 transition-transform group-hover:scale-105"
                                                />
                                                {isOwned && (
                                                  <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[7px] sm:text-[8px] font-black shadow-xs">
                                                    ✓
                                                  </span>
                                                )}
                                              </div>

                                              {/* Name */}
                                              <span className="font-semibold text-[10px] sm:text-xs md:text-sm truncate w-full text-slate-900 dark:text-white mt-0.5 leading-tight">
                                                {p.webName}
                                              </span>

                                              {/* Sub-line: £{cost.toFixed(1)}m {totalPoints}p */}
                                              <div className="flex items-center justify-center gap-1 font-mono text-[9px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                <span>£{p.cost.toFixed(1)}m</span>
                                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                                  {p.totalPoints}p
                                                </span>
                                              </div>

                                              {/* Action Button */}
                                              <div className="w-full mt-1.5 sm:mt-2" onClick={(e) => e.stopPropagation()}>
                                                {isOwned ? (
                                                  <span className="block w-full py-1 sm:py-1.5 rounded-md sm:rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-xs font-bold uppercase text-center leading-none">
                                                    ✓ Owned
                                                  </span>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    onClick={(e) => handleBuyPlayer(e, p)}
                                                    disabled={isSquadLocked}
                                                    className="w-full py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[9px] sm:text-xs font-bold transition-all border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.06] hover:bg-emerald-500/20 hover:text-emerald-500 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed leading-none"
                                                  >
                                                    + BUY
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
        )}
      </div>

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
                  {/* Left Column: Player Photo with Team Jersey Below It */}
                  <div className="flex flex-col items-center gap-2 shrink-0">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-white dark:bg-zinc-900 border-2 border-emerald-500/50 shadow-md flex items-center justify-center relative">
                        {selectedPlayer.photoUrl ? (
                          <img
                            src={selectedPlayer.photoUrl}
                            alt={selectedPlayer.name}
                            className="w-full h-full object-cover"
                          />
                        ) : selectedPlayer.pendingPhotoUrl ? (
                          <div className="relative w-full h-full">
                            <img
                              src={selectedPlayer.pendingPhotoUrl}
                              alt={selectedPlayer.name}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <span className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-slate-950 text-[8px] font-black text-center py-0.5">
                              ⏳ PENDING
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-200 dark:bg-zinc-800 text-slate-400">
                            <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                            <span className="text-[8px] font-bold mt-0.5 text-slate-500">No Photo</span>
                          </div>
                        )}
                      </div>

                      {/* Camera Upload Overlay */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer"
                        title="Upload profile picture"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-0.5">Upload</span>
                      </button>
                    </div>

                    {/* Team Jersey below the photo - little smaller than photo, not overlapping */}
                    <KitJersey
                      clubId={selectedPlayer.clubId}
                      position={selectedPlayer.position}
                      className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-md"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <PlayerPositionBadge playerId={selectedPlayer.id} position={selectedPlayer.position} />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        Class {clubs[selectedPlayer.clubId]?.shortName || selectedPlayer.clubId.replace('SCH_', '').replace('_', '/')}
                      </span>
                      {selectedPlayer.pendingPhotoUrl && !selectedPlayer.photoUrl && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                          ⏳ მოლოდინშია
                        </span>
                      )}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 ml-1 cursor-pointer"
                      >
                        <Camera className="w-3 h-3" />
                        <span>{selectedPlayer.photoUrl ? 'Change Photo' : selectedPlayer.pendingPhotoUrl ? 'Update Photo' : 'Upload Photo'}</span>
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

                    <div className="flex items-center gap-1.5 mt-1.5 text-[10.5px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20 w-fit">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <span>tip: you can add photos to players now!</span>
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
                {/* Position Override Notice (if effectively FWD) */}
                <PlayerPositionOverrideNotice playerId={selectedPlayer.id} position={selectedPlayer.position} />

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
