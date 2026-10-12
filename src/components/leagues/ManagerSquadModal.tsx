import React, { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useFPL } from '../../context/FPLContext';
import {
  fetchManagerSquadApi,
  adminAdjustManagerApi,
  adminRemoveManagerPlayerApi,
  adminAddManagerPlayerApi,
  adminSwapManagerPlayerApi,
  adminToggleManagerPlayerRoleApi,
  adminResetManagerGW1Api,
  adminUnlockManagerLineupApi,
} from '../../services/api';
import { IOSSwitch } from '../common/IOSSwitch';
import { Squad, ChipType } from '../../types/fpl';
import { GameweekCalculationResult, calculateGameweekSquadPoints, getEffectiveScoringPosition } from '../../engine/scoring';
import { getFormationLayout } from '../../engine/formations';
import { KitJersey } from '../pitch/KitJersey';
import { PlayerPositionBadge, PlayerPositionOverrideNotice } from '../common/PlayerPositionNotice';
import { CLUBS, getSortedSchoolClubs } from '../../data/clubs';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../../utils/haptics';
import {
  ArrowLeft,
  Award,
  Activity,
  Sparkles,
  X,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Clock,
  Users,
  ChevronDown,
  Plus,
  Minus,
  Crown,
  Shield,
  ArrowRightLeft,
  Trash2,
  UserPlus,
  Search,
  Check,
  RefreshCw,
  Zap,
  SlidersHorizontal,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface ManagerSquadModalProps {
  managerId: string | null;
  onClose: () => void;
}

export const ManagerSquadModal: React.FC<ManagerSquadModalProps> = ({ managerId, onClose }) => {
  const {
    players,
    currentGW,
    playerOwnership,
    isLineupsVisible,
    authUser,
    fixtures,
    isCurrentGWFinished,
    isModerator,
    refreshServerState,
  } = useFPL();

  const [loading, setLoading] = useState(true);
  const [selectedGW, setSelectedGW] = useState<number>(currentGW);
  const [managerData, setManagerData] = useState<{
    id: string;
    managerName: string;
    teamName: string;
    totalPoints?: number;
    bonusPointsAdjustment?: number;
    squad: Squad;
    joinedAt?: string;
    isLineupUnlocked?: boolean;
    unlockedUntil?: string | null;
  } | null>(null);
  const [calcResult, setCalcResult] = useState<GameweekCalculationResult | null>(null);
  const [selectedPlayerForSheet, setSelectedPlayerForSheet] = useState<string | null>(null);
  const [isLineupHidden, setIsLineupHidden] = useState<boolean>(false);
  const [showOwnershipList, setShowOwnershipList] = useState<boolean>(false);

  // Admin Portal State
  const [showAdminDeck, setShowAdminDeck] = useState<boolean>(true);
  const [adminTab, setAdminTab] = useState<'money' | 'transfers' | 'points' | 'chips' | 'squad'>('money');
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [customBankInput, setCustomBankInput] = useState<string>('');
  const [customPointsInput, setCustomPointsInput] = useState<string>('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<boolean>(false);

  // Lineup Unlock Override State (for single-manager lock bypass & timer)
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [showCustomTimeInput, setShowCustomTimeInput] = useState<boolean>(false);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('20');

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isManagerUnlocked = useMemo(() => {
    if (!managerData) return false;
    const isExplicitlyUnlocked = Boolean(
      managerData.squad?.isLineupUnlocked ?? managerData.isLineupUnlocked
    );
    const until = managerData.squad?.unlockedUntil ?? managerData.unlockedUntil;
    if (until) {
      return isExplicitlyUnlocked && new Date(until).getTime() > nowMs;
    }
    return isExplicitlyUnlocked;
  }, [managerData, nowMs]);

  const unlockCountdownText = useMemo(() => {
    if (!isManagerUnlocked || !managerData) return null;
    const until = managerData.squad?.unlockedUntil ?? managerData.unlockedUntil;
    if (!until) return 'განბლოკილია (მუდმივად)';
    const diffMs = new Date(until).getTime() - nowMs;
    if (diffMs <= 0) return 'ვადა ამოიწურა';
    const totalSec = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hours}სთ ${remMins}წთ დარჩა`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')} დარჩა`;
  }, [isManagerUnlocked, managerData, nowMs]);

  // In-modal Player Market Picker State (for Swap or Add)
  const [isPickingPlayer, setIsPickingPlayer] = useState<boolean>(false);
  const [pickingContext, setPickingContext] = useState<{
    mode: 'replace' | 'add';
    outPlayerId?: string;
    isStarter?: boolean;
  } | null>(null);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerPosFilter, setPickerPosFilter] = useState<'ALL' | 'GKP' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [pickerClubFilter, setPickerClubFilter] = useState<string>('ALL');

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  const loadManagerSquad = async (silent = false) => {
    if (!managerId) return;
    if (!silent) setLoading(true);
    try {
      const data = await fetchManagerSquadApi(managerId);
      setManagerData(data.manager);
      setCalcResult(data.calculationResult);
      setIsLineupHidden(Boolean(data.isLineupHidden));
    } catch (err) {
      console.error('Failed to load manager squad:', err);
      showToast('მონაცემების ჩატვირთვა ვერ მოხერხდა');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedGW(currentGW);
  }, [currentGW, managerId]);

  useEffect(() => {
    loadManagerSquad();
  }, [managerId]);

  // Recalculate if user selects a past Gameweek
  useEffect(() => {
    if (managerData && !isLineupHidden && selectedGW && managerData.squad?.players?.length > 0) {
      const isPastGW = selectedGW < currentGW;
      const isThisGWFinished = isPastGW || (selectedGW === currentGW ? isCurrentGWFinished : false);
      const gwSquad = (managerData.squad?.gameweekSquads && managerData.squad?.gameweekSquads[selectedGW])
        ? managerData.squad.gameweekSquads[selectedGW]
        : (isPastGW ? [] : (managerData.squad?.players || []));
      const gwChip = (managerData.squad?.gameweekChips && managerData.squad?.gameweekChips[selectedGW] !== undefined)
        ? managerData.squad.gameweekChips[selectedGW]
        : (selectedGW === currentGW ? managerData.squad?.activeChip : null);

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

  const activeGwSquad = (managerData?.squad?.gameweekSquads && managerData?.squad?.gameweekSquads[selectedGW])
    ? managerData.squad?.gameweekSquads?.[selectedGW]
    : (selectedGW < currentGW ? [] : (managerData?.squad?.players || []));
  const squadPlayers = shouldHideLineup ? [] : activeGwSquad;
  const layout = getFormationLayout(squadPlayers, players, selectedGW);

  // Financial calculations
  const totalSquadCost = (managerData?.squad?.players || []).reduce(
    (sum, sp) => sum + (players[sp.playerId]?.cost || 0),
    0
  );
  const managerBank = managerData?.squad?.bank ?? 0;
  const squadVal = Math.round((totalSquadCost + managerBank) * 10) / 10;
  const freeTransfersCount = managerData?.squad?.freeTransfers ?? 1;
  const transfersMadeCount = managerData?.squad?.transfersMadeThisGW ?? 0;
  const penaltiesCount = calcResult?.transferCost ?? 0;
  const bonusAdjustment = managerData?.bonusPointsAdjustment ?? 0;
  const overallPoints = (managerData?.totalPoints ?? (calcResult?.totalPoints || 0)) + (bonusAdjustment || 0);

  // Active Chip
  const activeChipForSelectedGW = (managerData?.squad?.gameweekChips && managerData.squad?.gameweekChips[selectedGW] !== undefined)
    ? managerData.squad?.gameweekChips?.[selectedGW]
    : (selectedGW === currentGW ? managerData?.squad?.activeChip : null);

  // Top performer
  const squadPointsList = squadPlayers
    .map((sp) => {
      const p = players[sp.playerId];
      const bd = calcResult?.playerPointsBreakdown?.[sp.playerId];
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
  const sheetStats = sheetPlayer ? sheetPlayer.gwStats?.[currentGW] : null;
  const sheetBreakdown = selectedPlayerForSheet && calcResult ? calcResult.playerPointsBreakdown?.[selectedPlayerForSheet] : null;
  const sheetSquadPlayer = squadPlayers.find((sp) => sp.playerId === selectedPlayerForSheet);
  const ownership = selectedPlayerForSheet && playerOwnership ? playerOwnership[selectedPlayerForSheet] : null;
  const ownershipPercent = ownership?.percent ?? (sheetPlayer?.selectedByPercent ?? 0);

  // --- ADMIN ACTIONS HANDLERS ---
  const handleAdjustBank = async (bankDelta?: number, exactBank?: number) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('medium');
    try {
      const res = await adminAdjustManagerApi({
        managerId,
        bankDelta,
        bank: exactBank,
      });
      if (res.success) {
        showToast(`ბანკი განახლდა: £${(res.manager.squad.bank ?? 0).toFixed(1)}m`);
        await loadManagerSquad(true);
        refreshServerState?.();
        setCustomBankInput('');
      }
    } catch (err: any) {
      showToast(err?.message || 'ბანკის შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustFT = async (freeTransfersDelta?: number, exactFT?: number) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('medium');
    try {
      const res = await adminAdjustManagerApi({
        managerId,
        freeTransfersDelta,
        freeTransfers: exactFT,
      });
      if (res.success) {
        showToast(`უფასო ტრანსფერები: ${res.manager.squad.freeTransfers} FT`);
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'FT შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjustPoints = async (pointsDelta: number) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('medium');
    try {
      const res = await adminAdjustManagerApi({
        managerId,
        pointsDelta,
      });
      if (res.success) {
        showToast(`ქულები შეიცვალა: ${pointsDelta >= 0 ? `+${pointsDelta}` : pointsDelta} pts`);
        await loadManagerSquad(true);
        refreshServerState?.();
        setCustomPointsInput('');
      }
    } catch (err: any) {
      showToast(err?.message || 'ქულების შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetChip = async (chip: ChipType | null) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('success');
    try {
      const res = await adminAdjustManagerApi({
        managerId,
        activeChip: chip,
      });
      if (res.success) {
        showToast(chip ? `ჩიპი გააქტიურდა: ${chip.toUpperCase()}` : 'ჩიპი გაუქმდა');
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'ჩიპის შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleUsedChip = async (chip: ChipType, currentUsed: boolean) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('medium');
    try {
      const res = await adminAdjustManagerApi({
        managerId,
        usedChips: { [chip]: !currentUsed },
      });
      if (res.success) {
        showToast(`${chip.toUpperCase()} სტატუსი: ${!currentUsed ? 'გამოყენებული' : 'ხელმისაწვდომი'}`);
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'ჩიპის სტატუსის შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTogglePlayerRole = async (playerId: string, role: 'captain' | 'viceCaptain' | 'starter' | 'bench') => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('light');
    try {
      const res = await adminToggleManagerPlayerRoleApi(managerId, playerId, role);
      if (res.success) {
        showToast(`როლი განახლდა: ${role.toUpperCase()}`);
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'როლის შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemovePlayer = async (playerId: string, refund: boolean) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic('warning');
    try {
      const res = await adminRemoveManagerPlayerApi(managerId, playerId, refund);
      if (res.success) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        showToast(`მოთამაშე ამოიშალა ${refund ? '(თანხა დაბრუნდა ბანკში)' : ''}`);
        setSelectedPlayerForSheet(null);
        setShowRemoveConfirm(false);
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'მოთამაშის წაშლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetToGW1 = async () => {
    if (!managerId) return;
    const ok = window.confirm(`დარწმუნებული ხართ, რომ გსურთ მენეჯერის GW1-ის საწყის შემადგენლობაზე დაბრუნება?\n\nეს გაასუფთავებს GW2-ის ყველა ცვლილებას და დააბრუნებს GW1-ის გუნდს.`);
    if (!ok) return;

    setActionLoading(true);
    triggerHaptic('warning');
    try {
      const res = await adminResetManagerGW1Api(managerId);
      if (res.success) {
        showToast('მენეჯერი წარმატებით დაბრუნდა GW1-ის შემადგენლობაზე!');
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'GW1-ზე დაბრუნება ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleManagerUnlock = async (checked: boolean) => {
    if (!managerId) return;
    setActionLoading(true);
    triggerHaptic(checked ? 'success' : 'warning');
    try {
      const res = await adminUnlockManagerLineupApi({
        managerId,
        isUnlocked: checked,
      });
      if (res.success) {
        showToast(
          checked
            ? 'შემადგენლობა განიბლოკა მენეჯერისთვის (შეუძლია გუნდის შეცვლა)!'
            : 'შემადგენლობა დაბლოკილია მენეჯერისთვის.'
        );
        if (checked) confetti({ particleCount: 35, spread: 60, origin: { y: 0.6 } });
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'სტატუსის შეცვლა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantUnlockTime = async (minutes: number) => {
    if (!managerId || minutes <= 0) return;
    setActionLoading(true);
    triggerHaptic('success');
    try {
      const res = await adminUnlockManagerLineupApi({
        managerId,
        isUnlocked: true,
        durationMinutes: minutes,
      });
      if (res.success) {
        confetti({ particleCount: 45, spread: 65, origin: { y: 0.6 } });
        showToast(`შემადგენლობა განიბლოკა +${minutes} წუთით!`);
        setShowCustomTimeInput(false);
        await loadManagerSquad(true);
        refreshServerState?.();
      }
    } catch (err: any) {
      showToast(err?.message || 'დროის მიცემა ვერ მოხერხდა');
    } finally {
      setActionLoading(false);
    }
  };

  // --- MARKET PICKER (TRANSFER / ADD) ---
  const currentSquadPlayerIds = useMemo(() => {
    return new Set((managerData?.squad?.players || []).map((sp) => sp.playerId));
  }, [managerData]);

  const schoolClubs = useMemo(() => getSortedSchoolClubs(CLUBS), []);

  const marketPlayers = useMemo(() => {
    let list = Object.values(players).filter((p) => !currentSquadPlayerIds.has(p.id));

    if (pickerPosFilter !== 'ALL') {
      list = list.filter((p) => p.position === pickerPosFilter);
    }

    if (pickerClubFilter !== 'ALL') {
      list = list.filter((p) => p.clubId === pickerClubFilter);
    }

    if (pickerSearch.trim()) {
      const q = pickerSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.webName.toLowerCase().includes(q) ||
          (CLUBS[p.clubId]?.name || '').toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => b.cost - a.cost);
  }, [players, currentSquadPlayerIds, pickerPosFilter, pickerClubFilter, pickerSearch]);

  const handleExecuteSwapOrAdd = async (selectedInPlayerId: string) => {
    if (!managerId || !pickingContext) return;
    setActionLoading(true);
    triggerHaptic('success');

    try {
      if (pickingContext.mode === 'replace' && pickingContext.outPlayerId) {
        const res = await adminSwapManagerPlayerApi(
          managerId,
          pickingContext.outPlayerId,
          selectedInPlayerId,
          true
        );
        if (res.success) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          showToast(`ტრანსფერი შესრულდა: ${players[selectedInPlayerId]?.webName}`);
          setIsPickingPlayer(false);
          setPickingContext(null);
          setSelectedPlayerForSheet(null);
          await loadManagerSquad(true);
          refreshServerState?.();
        }
      } else if (pickingContext.mode === 'add') {
        const res = await adminAddManagerPlayerApi(
          managerId,
          selectedInPlayerId,
          true,
          pickingContext.isStarter
        );
        if (res.success) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
          showToast(`მოთამაშე დაემატა: ${players[selectedInPlayerId]?.webName}`);
          setIsPickingPlayer(false);
          setPickingContext(null);
          await loadManagerSquad(true);
          refreshServerState?.();
        }
      }
    } catch (err: any) {
      showToast(err?.message || 'ოპერაცია ვერ შესრულდა');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-2 animate-fade-in select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[500px] md:max-w-2xl h-full sm:h-[94vh] sm:max-h-[900px] bg-white/95 dark:bg-[#070b12]/95 backdrop-blur-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Navigation Header */}
        <div className="px-4 py-2.5 bg-white/80 dark:bg-zinc-950/40 backdrop-blur-md border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between z-20">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Standings</span>
          </button>

          {/* Gameweek Navigator */}
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

        {/* Action Toast Alert Banner */}
        {actionToast && (
          <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-fade-in z-30">
            <span className="truncate">{actionToast}</span>
            <button onClick={() => setActionToast(null)} className="opacity-70 hover:opacity-100">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading manager details...</p>
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
            </div>
          </div>
        ) : managerData && calcResult ? (
          <div className="flex-1 overflow-y-auto overscroll-contain pb-8">
            {/* Manager Overview Card */}
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
                    GW {selectedGW} Points
                  </span>
                  <div className="flex items-baseline justify-end gap-1">
                    <span className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                      {calcResult.totalPoints}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">PTS</span>
                  </div>
                </div>
              </div>

              {/* Comprehensive Manager Metrics Grid (Bank, Val, FT, Transfers, Penalties, Overall) */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-white/10 text-center font-mono">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Bank</span>
                  <span className="text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">
                    £{managerBank.toFixed(1)}m
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Squad Val</span>
                  <span className="text-xs font-black tabular-nums text-slate-800 dark:text-slate-200">
                    £{squadVal.toFixed(1)}m
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Free FT</span>
                  <span className="text-xs font-black tabular-nums text-indigo-600 dark:text-indigo-400">
                    {freeTransfersCount} FT
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Transfers</span>
                  <span className="text-xs font-black tabular-nums text-slate-800 dark:text-slate-200">
                    {transfersMadeCount}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Penalties</span>
                  <span className={`text-xs font-black tabular-nums ${penaltiesCount > 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                    {penaltiesCount > 0 ? `-${penaltiesCount}p` : '0p'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5">
                  <span className="text-[8.5px] uppercase font-bold text-slate-400 block tracking-wider">Total PTS</span>
                  <span className="text-xs font-black tabular-nums text-amber-500">
                    {overallPoints}
                  </span>
                </div>
              </div>

              {/* Chips & Top Performer Row */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap items-center justify-between text-xs gap-1.5">
                {topPerformer && topPerformer.points > 0 ? (
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    Top: <strong className="text-slate-900 dark:text-white">{topPerformer.player.webName}</strong> ({topPerformer.points} pts)
                  </span>
                ) : <span />}

                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeChipForSelectedGW ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-2.5 h-2.5" />
                      {activeChipForSelectedGW.replace('_', ' ').toUpperCase()} (Active)
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">No Active Chip</span>
                  )}

                  {/* Used Chips Indicators */}
                  <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                    <span className={`px-1.5 py-0.5 rounded ${managerData?.squad?.usedChips?.triple_captain ? 'bg-rose-500/20 text-rose-400 line-through' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      TC
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${managerData?.squad?.usedChips?.bench_boost ? 'bg-rose-500/20 text-rose-400 line-through' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      BB
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${managerData?.squad?.usedChips?.wildcard ? 'bg-rose-500/20 text-rose-400 line-through' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                      WC
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* ADMIN COMMAND DECK: FULL MANAGERIAL POWERS (isModerator) */}
            {/* ======================================================== */}
            {isModerator && (
              <div className="mx-2 mt-2 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/30 to-slate-950/40 border border-purple-500/30 shadow-lg overflow-hidden text-xs">
                {/* Admin Header with Expand/Collapse */}
                <div
                  onClick={() => setShowAdminDeck(!showAdminDeck)}
                  className="px-3.5 py-2.5 bg-purple-500/15 border-b border-purple-500/20 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="font-black text-purple-300 tracking-wide uppercase text-[11px]">
                      ადმინის მართვის პანელი (Admin Command Deck)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />}
                    <ChevronDown className={`w-4 h-4 text-purple-300 transition-transform ${showAdminDeck ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {showAdminDeck && (
                  <div className="p-3 space-y-3">
                    {/* Lineup Unlock Override Card */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      isManagerUnlocked
                        ? 'bg-emerald-950/40 border-emerald-500/40 shadow-sm shadow-emerald-950/50'
                        : 'bg-black/30 border-white/10'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${
                            isManagerUnlocked
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-white/5'
                          }`}>
                            {isManagerUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-xs">
                                შემადგენლობის განბლოკვა
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Lineup Override)
                              </span>
                            </div>
                            <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                              {isManagerUnlocked ? (
                                <span className="font-bold text-emerald-400 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                                  {unlockCountdownText}
                                </span>
                              ) : (
                                <span className="text-slate-400 font-medium">
                                  ჩაკეტილია (Deadline Lock Active)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Switch */}
                        <div className="shrink-0 flex items-center gap-2">
                          <IOSSwitch
                            checked={isManagerUnlocked}
                            onChange={handleToggleManagerUnlock}
                            disabled={actionLoading}
                            size="sm"
                          />
                        </div>
                      </div>

                      {/* Time Extension Quick Bar */}
                      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-300 font-medium shrink-0">
                          <Clock className="w-3 h-3 text-indigo-400" />
                          <span>დრო:</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleGrantUnlockTime(15)}
                            className="px-2 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/45 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                          >
                            +15 წთ
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleGrantUnlockTime(20)}
                            className="px-2 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/45 border border-emerald-500/30 text-emerald-300 font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                          >
                            +20 წთ
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleGrantUnlockTime(30)}
                            className="px-2 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/45 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                          >
                            +30 წთ
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleGrantUnlockTime(60)}
                            className="px-2 py-1 rounded-lg bg-indigo-600/25 hover:bg-indigo-600/45 border border-indigo-500/30 text-indigo-300 font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                          >
                            +60 წთ
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => setShowCustomTimeInput(!showCustomTimeInput)}
                            className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 font-bold text-[10px] active:scale-95 transition-all cursor-pointer"
                          >
                            სხვა...
                          </button>
                        </div>
                      </div>

                      {/* Custom Time Input Form */}
                      {showCustomTimeInput && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1.5 animate-fade-in">
                          <input
                            type="number"
                            min="1"
                            max="1440"
                            placeholder="წუთები (მაგ. 45)"
                            value={customMinutesInput}
                            onChange={(e) => setCustomMinutesInput(e.target.value)}
                            className="flex-1 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1 text-white placeholder-slate-500 font-mono text-xs focus:outline-hidden focus:border-purple-400"
                          />
                          <button
                            type="button"
                            disabled={actionLoading || !customMinutesInput || parseInt(customMinutesInput, 10) <= 0}
                            onClick={() => handleGrantUnlockTime(parseInt(customMinutesInput, 10))}
                            className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs cursor-pointer active:scale-95 transition-all"
                          >
                            მიცემა
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCustomTimeInput(false)}
                            className="px-2 py-1 rounded-lg text-slate-400 hover:text-white text-xs cursor-pointer"
                          >
                            X
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Admin Navigation Tabs */}
                    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto scrollbar-none">
                      <button
                        type="button"
                        onClick={() => setAdminTab('money')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all whitespace-nowrap ${
                          adminTab === 'money'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        💰 ბანკი (Money)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('transfers')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all whitespace-nowrap ${
                          adminTab === 'transfers'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🔄 ტრანსფერები (FT)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('points')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all whitespace-nowrap ${
                          adminTab === 'points'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⭐ ქულები (Points)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('chips')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all whitespace-nowrap ${
                          adminTab === 'chips'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ⚡ ჩიპები (Chips)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdminTab('squad')}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-bold text-[10.5px] transition-all whitespace-nowrap ${
                          adminTab === 'squad'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🛠️ შემადგენლობა
                      </button>
                    </div>

                    {/* Tab 1: Money / Bank */}
                    {adminTab === 'money' && (
                      <div className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>მიმდინარე ბანკი:</span>
                          <strong className="text-emerald-400 font-mono text-sm">£{managerBank.toFixed(1)}m</strong>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustBank(1.0)}
                            className="py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold active:scale-95 cursor-pointer"
                          >
                            +£1.0m
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustBank(0.5)}
                            className="py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold active:scale-95 cursor-pointer"
                          >
                            +£0.5m
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustBank(-0.5)}
                            className="py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold active:scale-95 cursor-pointer"
                          >
                            -£0.5m
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustBank(-1.0)}
                            className="py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold active:scale-95 cursor-pointer"
                          >
                            -£1.0m
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="ზუსტი თანხა (მაგ. 2.5)"
                            value={customBankInput}
                            onChange={(e) => setCustomBankInput(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 font-mono text-xs focus:outline-hidden focus:border-purple-400"
                          />
                          <button
                            type="button"
                            disabled={actionLoading || !customBankInput}
                            onClick={() => handleAdjustBank(undefined, parseFloat(customBankInput))}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold cursor-pointer"
                          >
                            Set Bank
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Free Transfers */}
                    {adminTab === 'transfers' && (
                      <div className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>უფასო ტრანსფერები:</span>
                          <strong className="text-indigo-400 font-mono text-sm">{freeTransfersCount} FT</strong>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustFT(1)}
                            className="py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold active:scale-95 cursor-pointer"
                          >
                            +1 FT
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading || freeTransfersCount <= 0}
                            onClick={() => handleAdjustFT(-1)}
                            className="py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold active:scale-95 cursor-pointer"
                          >
                            -1 FT
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustFT(undefined, 1)}
                            className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 font-bold active:scale-95 cursor-pointer"
                          >
                            Set to 1
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustFT(undefined, 2)}
                            className="py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-slate-200 font-bold active:scale-95 cursor-pointer"
                          >
                            Set to 2
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Points Adjustment */}
                    {adminTab === 'points' && (
                      <div className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>ადმინის კორექტირება (Bonus Adj):</span>
                          <strong className="text-amber-400 font-mono text-sm">
                            {bonusAdjustment >= 0 ? `+${bonusAdjustment}` : bonusAdjustment} pts
                          </strong>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustPoints(5)}
                            className="py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 font-bold active:scale-95 cursor-pointer"
                          >
                            +5 pts
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustPoints(1)}
                            className="py-1.5 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 font-bold active:scale-95 cursor-pointer"
                          >
                            +1 pt
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustPoints(-1)}
                            className="py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold active:scale-95 cursor-pointer"
                          >
                            -1 pt
                          </button>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => handleAdjustPoints(-5)}
                            className="py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold active:scale-95 cursor-pointer"
                          >
                            -5 pts
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="number"
                            placeholder="დელტა ქულები (მაგ. +3 ან -4)"
                            value={customPointsInput}
                            onChange={(e) => setCustomPointsInput(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-white placeholder-slate-500 font-mono text-xs focus:outline-hidden focus:border-purple-400"
                          />
                          <button
                            type="button"
                            disabled={actionLoading || !customPointsInput}
                            onClick={() => handleAdjustPoints(parseInt(customPointsInput, 10))}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold cursor-pointer"
                          >
                            Add Points
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Chips */}
                    {adminTab === 'chips' && (
                      <div className="space-y-3 animate-fade-in">
                        <div>
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5">
                            GW {currentGW} Active Chip (გააქტიურება / გაუქმება):
                          </span>
                          <div className="grid grid-cols-4 gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSetChip('triple_captain')}
                              className={`py-1.5 px-1 rounded-lg border font-bold text-[10px] text-center truncate cursor-pointer ${
                                managerData?.squad?.activeChip === 'triple_captain'
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                                  : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              Triple Cap
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSetChip('bench_boost')}
                              className={`py-1.5 px-1 rounded-lg border font-bold text-[10px] text-center truncate cursor-pointer ${
                                managerData?.squad?.activeChip === 'bench_boost'
                                  ? 'bg-sky-500 text-white border-sky-400 font-black'
                                  : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              Bench Boost
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={() => handleSetChip('wildcard')}
                              className={`py-1.5 px-1 rounded-lg border font-bold text-[10px] text-center truncate cursor-pointer ${
                                managerData?.squad?.activeChip === 'wildcard'
                                  ? 'bg-indigo-500 text-white border-indigo-400 font-black'
                                  : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/10'
                              }`}
                            >
                              Wildcard
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading || !managerData?.squad?.activeChip}
                              onClick={() => handleSetChip(null)}
                              className="py-1.5 px-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-300 font-bold text-[10px] cursor-pointer"
                            >
                              Clear Chip
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/10">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block mb-1.5">
                            Used Chips Reset (სტატუსის შეცვლა):
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(['triple_captain', 'bench_boost', 'wildcard'] as ChipType[]).map((c) => {
                              const isUsed = Boolean(managerData?.squad?.usedChips?.[c]);
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleToggleUsedChip(c, isUsed)}
                                  className={`py-1.5 px-1 rounded-lg border font-bold text-[10px] flex items-center justify-center gap-1 cursor-pointer ${
                                    isUsed
                                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                                  }`}
                                >
                                  <span>{c === 'triple_captain' ? 'TC' : c === 'bench_boost' ? 'BB' : 'WC'}:</span>
                                  <span>{isUsed ? 'Used ✕' : 'Avail ✓'}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 5: Squad Management & Emergency Tools */}
                    {adminTab === 'squad' && (
                      <div className="space-y-2.5 animate-fade-in">
                        <div className="flex items-center justify-between text-slate-300">
                          <span>მოთამაშეების რაოდენობა:</span>
                          <strong className="text-slate-200 font-mono text-xs">
                            {managerData?.squad?.players?.length ?? 0} / 9 მოთამაშე
                          </strong>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setPickingContext({ mode: 'add', isStarter: (managerData?.squad?.players || []).filter((p) => p.isStarter).length < 6 });
                              setIsPickingPlayer(true);
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 cursor-pointer text-xs"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>+ მოთამაშის დამატება შემადგენლობაში</span>
                          </button>
                        </div>
                        <p className="text-[10.5px] text-slate-400 leading-tight">
                          💡 რჩევა: მოთამაშის გაყიდვა/ჩანაცვლება ან კაპიტნად დანიშვნა შეგიძლიათ პირდაპირ მოთამაშის ბარათზე დაკლიკებით ქვემოთ.
                        </p>

                        {/* Separate Protected Danger Zone */}
                        <div className="pt-2 border-t border-red-500/20">
                          <details className="group">
                            <summary className="text-[11px] font-semibold text-red-400/80 cursor-pointer hover:text-red-300 flex items-center justify-between">
                              <span>⚠️ სახიფათო ზონა (GW1 Rollback)</span>
                              <span className="text-[10px] text-zinc-500 group-open:rotate-180 transition-transform">▼</span>
                            </summary>
                            <div className="mt-2 p-2 rounded-lg bg-red-950/30 border border-red-500/30 space-y-1.5">
                              <p className="text-[10px] text-red-300/80 leading-snug">
                                ეს მოქმედება წაშლის მენეჯერის GW2-ის ყველა ცვლილებას და დააბრუნებს GW1-ის ჩაკეტილ გუნდს.
                              </p>
                              <button
                                type="button"
                                disabled={actionLoading}
                                onClick={handleResetToGW1}
                                className="w-full py-1.5 px-2 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-200 font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>↺ GW1 შემადგენლობაზე დაბრუნება</span>
                              </button>
                            </div>
                          </details>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

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

            {/* Football Pitch Container */}
            <div
              className="relative mx-2 my-2 rounded-2xl overflow-hidden border border-emerald-950/20 dark:border-white/10 shadow-xl bg-gradient-to-b from-[#225732] via-[#1b4b2a] to-[#153e22] dark:from-[#143d22] dark:via-[#10331b] dark:to-[#0c2815]"
            >
              {/* Center Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                <img
                  src="/kcl-logo-transparent.png"
                  alt="Komarovi Champions League"
                  className="w-[200px] max-w-[60vw] opacity-[0.06] grayscale object-contain"
                />
              </div>

              {/* Pitch Markings SVG */}
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
                  {isModerator ? '👑 Tap player to edit / refund' : 'Tap player for stats'}
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
                  {layout.gks.length === 0 && isModerator && (
                    <EmptySlotCard
                      label="Add GK"
                      onClick={() => {
                        setPickingContext({ mode: 'add', isStarter: true });
                        setPickerPosFilter('GKP');
                        setIsPickingPlayer(true);
                      }}
                    />
                  )}
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

                {/* Empty Starters Slot for Admin if starters < 6 */}
                {isModerator && (layout.gks.length + layout.defs.length + layout.mids.length + layout.fwds.length) < 6 && (
                  <div className="flex justify-center items-center pt-1">
                    <EmptySlotCard
                      label="+ Add Starter"
                      onClick={() => {
                        setPickingContext({ mode: 'add', isStarter: true });
                        setIsPickingPlayer(true);
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bench Area */}
            <div className="mx-2 p-2.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wide">
                  Substitutes (სათადარიგო)
                </span>
                {isModerator && layout.bench.length < 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPickingContext({ mode: 'add', isStarter: false });
                      setIsPickingPlayer(true);
                    }}
                    className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>სათადარიგოს დამატება</span>
                  </button>
                )}
              </div>

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
                        {idx === 0 ? 'GK' : `Sub ${idx}`}
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

                {/* Empty Bench Slots */}
                {isModerator && Array.from({ length: Math.max(0, 3 - layout.bench.length) }).map((_, i) => (
                  <EmptySlotCard
                    key={`empty-bench-${i}`}
                    label="+ Add Sub"
                    onClick={() => {
                      setPickingContext({ mode: 'add', isStarter: false });
                      setIsPickingPlayer(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-sm font-bold text-slate-900 dark:text-white">Could not find manager details.</p>
          </div>
        )}

        {/* ======================================================== */}
        {/* PLAYER ACTION SHEET (WITH FULL ADMIN CONTROLS)           */}
        {/* ======================================================== */}
        {sheetPlayer && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-0 md:p-4 select-none"
            onClick={() => {
              setSelectedPlayerForSheet(null);
              setShowOwnershipList(false);
              setShowRemoveConfirm(false);
            }}
          >
            <div
              className="w-full max-w-[480px] md:max-w-md bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl animate-slide-up select-none safe-bottom text-slate-900 dark:text-white max-h-[88vh] overflow-y-auto"
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
                      {sheetSquadPlayer?.isViceCaptain && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-600 text-white">
                          VICE-CAPTAIN
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
                    setShowRemoveConfirm(false);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
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

              {/* ======================================================== */}
              {/* ADMIN ACTIONS FOR THIS PLAYER (isModerator)              */}
              {/* ======================================================== */}
              {isModerator && (
                <div className="my-3 p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-purple-400 tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      <span>ადმინის მოქმედებები (Admin Controls)</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {sheetSquadPlayer?.isStarter ? 'Starting XI' : 'Sub Bench'}
                    </span>
                  </div>

                  {/* Role Toggles */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      disabled={actionLoading || sheetSquadPlayer?.isCaptain}
                      onClick={() => handleTogglePlayerRole(sheetPlayer.id, 'captain')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        sheetSquadPlayer?.isCaptain
                          ? 'bg-amber-500 text-slate-950 font-black cursor-default'
                          : 'bg-black/30 hover:bg-black/50 border border-white/10 text-slate-200'
                      }`}
                    >
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>{sheetSquadPlayer?.isCaptain ? 'Captain' : 'Make (C)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading || sheetSquadPlayer?.isViceCaptain}
                      onClick={() => handleTogglePlayerRole(sheetPlayer.id, 'viceCaptain')}
                      className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        sheetSquadPlayer?.isViceCaptain
                          ? 'bg-slate-600 text-white font-black cursor-default'
                          : 'bg-black/30 hover:bg-black/50 border border-white/10 text-slate-200'
                      }`}
                    >
                      <Shield className="w-3.5 h-3.5 text-slate-300" />
                      <span>{sheetSquadPlayer?.isViceCaptain ? 'Vice (V)' : 'Make (V)'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleTogglePlayerRole(sheetPlayer.id, sheetSquadPlayer?.isStarter ? 'bench' : 'starter')}
                      className="py-2 px-1 rounded-xl bg-black/30 hover:bg-black/50 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                      <span>{sheetSquadPlayer?.isStarter ? 'To Bench' : 'To XI'}</span>
                    </button>
                  </div>

                  {/* Transfer & Refund Operations */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-purple-500/20">
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => {
                        setPickingContext({ mode: 'replace', outPlayerId: sheetPlayer.id });
                        setPickerPosFilter(sheetPlayer.position as any);
                        setIsPickingPlayer(true);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>შეცვლა / Replace</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => setShowRemoveConfirm(true)}
                      className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>წაშლა / Refund</span>
                    </button>
                  </div>

                  {/* Remove & Refund Confirmation Dialog */}
                  {showRemoveConfirm && (
                    <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 space-y-2 text-left animate-fade-in">
                      <p className="text-xs text-rose-200 font-bold leading-snug">
                        ნამდვილად გსურთ <strong>{sheetPlayer.name}</strong>-ის ამოშლა?
                      </p>
                      <p className="text-[11px] text-rose-300/80">
                        დაუბრუნდეს მენეჯერს ბანკში ფეხბურთელის ღირებულება (+£{sheetPlayer.cost.toFixed(1)}m)?
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRemovePlayer(sheetPlayer.id, true)}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                        >
                          თანხის დაბრუნებით (+£{sheetPlayer.cost.toFixed(1)}m)
                        </button>
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRemovePlayer(sheetPlayer.id, false)}
                          className="py-1.5 px-2.5 rounded-lg bg-rose-600/60 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
                        >
                          თანხის გარეშე
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowRemoveConfirm(false)}
                        className="w-full text-center text-[10px] text-slate-400 hover:underline pt-0.5 cursor-pointer"
                      >
                        გაუქმება (Cancel)
                      </button>
                    </div>
                  )}
                </div>
              )}

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
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white py-1 transition-colors cursor-pointer"
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

        {/* ======================================================== */}
        {/* IN-MODAL PLAYER MARKET PICKER (TRANSFER / ADD)           */}
        {/* ======================================================== */}
        {isPickingPlayer && pickingContext && typeof document !== 'undefined' && createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 md:p-4 select-none"
            onClick={() => {
              setIsPickingPlayer(false);
              setPickingContext(null);
            }}
          >
            <div
              className="w-full max-w-[540px] h-[90vh] md:h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-3xl border border-slate-200 dark:border-slate-800 p-4 md:p-6 shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                    {pickingContext.mode === 'replace'
                      ? `მოთამაშის ჩანაცვლება (${players[pickingContext.outPlayerId || '']?.webName})`
                      : 'ახალი მოთამაშის დამატება'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                    ხელმისაწვდომი ბანკი: <strong className="text-emerald-500">£{managerBank.toFixed(1)}m</strong>
                    {pickingContext.mode === 'replace' && pickingContext.outPlayerId && (
                      <span> (+£{(players[pickingContext.outPlayerId]?.cost || 0).toFixed(1)}m დაბრუნება)</span>
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPickingPlayer(false);
                    setPickingContext(null);
                  }}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filters & Search */}
              <div className="py-2.5 space-y-2 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="მოძებნეთ სახელით ან კლასით (მაგ. 11/5, გიორგი)..."
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-purple-500"
                  />
                  {pickerSearch && (
                    <button
                      type="button"
                      onClick={() => setPickerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Position Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {(['ALL', 'GKP', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => setPickerPosFilter(pos)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        pickerPosFilter === pos
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {pos === 'ALL' ? 'All Positions' : pos}
                    </button>
                  ))}

                  {/* School Club Filter Dropdown */}
                  <select
                    value={pickerClubFilter}
                    onChange={(e) => setPickerClubFilter(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl px-2 py-1 ml-auto cursor-pointer"
                  >
                    <option value="ALL">All Classes (28)</option>
                    {schoolClubs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Market Players Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
                {marketPlayers.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    მოთამაშეები ვერ მოიძებნა
                  </div>
                ) : (
                  marketPlayers.map((p) => {
                    const outPlayer = pickingContext.mode === 'replace' && pickingContext.outPlayerId
                      ? players[pickingContext.outPlayerId]
                      : null;
                    const diff = outPlayer ? outPlayer.cost - p.cost : -p.cost;
                    const effectiveBank = managerBank + (outPlayer ? outPlayer.cost : 0);
                    const canAfford = effectiveBank >= p.cost;

                    return (
                      <div
                        key={p.id}
                        className="pt-2 flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1.5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-full object-cover border border-emerald-500/40 shrink-0 bg-slate-100 dark:bg-slate-800"
                            />
                          ) : (
                            <KitJersey clubId={p.clubId} position={p.position} className="w-10 h-10 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {p.webName}
                              </span>
                              <PlayerPositionBadge playerId={p.id} position={p.position} />
                              <span className="text-[10px] text-slate-400 font-medium">
                                {CLUBS[p.clubId]?.name || p.clubId}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10.5px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                              <span>£{p.cost.toFixed(1)}m</span>
                              <span>•</span>
                              <span>{p.totalPoints || 0} pts</span>
                              {diff !== 0 && (
                                <span className={diff > 0 ? 'text-emerald-500 font-bold' : 'text-amber-500 font-bold'}>
                                  ({diff > 0 ? `+£${diff.toFixed(1)}m` : `-£${(-diff).toFixed(1)}m`})
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={actionLoading || (!canAfford && !isModerator)}
                            onClick={() => handleExecuteSwapOrAdd(p.id)}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer ${
                              canAfford
                                ? 'bg-purple-600 hover:bg-purple-500 text-white'
                                : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                            }`}
                          >
                            <span>{pickingContext.mode === 'replace' ? 'Swap' : 'Add'}</span>
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
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

// Sub-component for individual card on the pitch
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

// Sub-component for Empty Squad Slot (for Add Player)
const EmptySlotCard: React.FC<{
  label: string;
  onClick: () => void;
}> = ({ label, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative flex flex-col items-center justify-center w-[68px] sm:w-[78px] min-h-[86px] sm:min-h-[96px] p-1.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 border-2 border-dashed border-purple-400/50 shadow-md cursor-pointer transition-all duration-200 select-none hover:scale-[1.03] active:scale-95 text-center"
    >
      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 mb-1">
        <Plus className="w-4 h-4" />
      </div>
      <span className="text-[9.5px] font-bold text-purple-200 leading-tight">
        {label}
      </span>
    </div>
  );
};
