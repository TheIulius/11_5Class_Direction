import React, { useState, useEffect, useMemo } from 'react';
import { useFPL } from '../../context/FPLContext';
import {
  RotateCcw,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Shield,
  ArrowLeftRight,
  Users,
  Coins,
} from 'lucide-react';
import {
  adminFetchTransfersBreakdownApi,
  adminResetManagerToGW1Api,
} from '../../services/api';
import confetti from 'canvas-confetti';

interface TransferManagerSummary {
  id: string;
  managerName: string;
  teamName: string;
  grade?: string;
  parallel?: string;
  realName?: string;
  chip: string;
  gw1Gross: number;
  netDiff: number;
  recordedTransfers: number;
  startFT: number;
  remainingFT: number;
  penalty: number;
  totalPoints: number;
  gwPoints: number;
  hadGW1: boolean;
  canReset: boolean;
  isAtGW1Baseline: boolean;
}

export const UndoTransfersAdmin: React.FC = () => {
  const { currentGW, refreshServerState } = useFPL();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [transfersList, setTransfersList] = useState<TransferManagerSummary[]>([]);
  const [allEligibleManagers, setAllEligibleManagers] = useState<TransferManagerSummary[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'penalties' | 'wildcard' | 'zero_penalty'>('all');

  // Confirmation Modal State
  const [selectedManager, setSelectedManager] = useState<TransferManagerSummary | null>(null);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Manual Any Manager Picker
  const [manualPickerId, setManualPickerId] = useState<string>('');

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const res = await adminFetchTransfersBreakdownApi();
      if (res.success) {
        setTransfersList(res.list || []);
        setAllEligibleManagers(res.allEligible || []);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load live transfers breakdown');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentGW]);

  // Filtered List
  const filteredList = useMemo(() => {
    return transfersList.filter((m) => {
      // Filter Type
      if (filterType === 'penalties' && m.penalty <= 0) return false;
      if (filterType === 'wildcard' && m.chip !== 'wildcard') return false;
      if (filterType === 'zero_penalty' && m.penalty > 0) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = m.managerName.toLowerCase().includes(q);
        const matchTeam = m.teamName.toLowerCase().includes(q);
        const matchReal = (m.realName || '').toLowerCase().includes(q);
        const matchGrade = `${m.grade || ''}/${m.parallel || ''}`.includes(q);
        return matchName || matchTeam || matchReal || matchGrade;
      }

      return true;
    });
  }, [transfersList, filterType, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalWithTransfers = transfersList.length;
    const withPenalties = transfersList.filter((m) => m.penalty > 0).length;
    const totalPenaltiesIncurred = transfersList.reduce((sum, m) => sum + m.penalty, 0);
    const withWildcard = transfersList.filter((m) => m.chip === 'wildcard').length;
    return { totalWithTransfers, withPenalties, totalPenaltiesIncurred, withWildcard };
  }, [transfersList]);

  // Execute Rollback
  const handleExecuteReset = async () => {
    if (!selectedManager) return;
    try {
      setIsResetting(true);
      setError(null);

      const res = await adminResetManagerToGW1Api(selectedManager.id);
      if (res.success) {
        confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
        setSuccessMessage(res.message);
        setTimeout(() => setSuccessMessage(null), 6000);

        setTransfersList(res.list || []);
        setAllEligibleManagers(res.allEligible || []);
        setSelectedManager(null);

        // Synchronize league context
        await refreshServerState();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to reset manager');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-white font-sans">
      {/* 1. Header & Overview Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <span>GW2 ტრანსფერების გაუქმება & GW1-ზე დაბრუნება</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Undo Transfers
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                ინდივიდუალური მენეჯერის GW2 ტრანსფერების გაუქმება და მათი გუნდის, ქულებისა და 2 უფასო ტრანსფერის დაბრუნება GW1-ის დასრულების მომენტზე.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Updating...' : 'Live Refresh'}</span>
          </button>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 2. Key Metrics Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
          <div className="p-3 rounded-xl bg-zinc-950/70 border border-white/5 space-y-0.5">
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-sans block">
              ტრანსფერები GW2-ში
            </span>
            <span className="text-lg font-black text-white">{metrics.totalWithTransfers}</span>
            <span className="text-[10px] text-zinc-500 font-sans block">მენეჯერი</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-rose-500/20 space-y-0.5">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-sans block">
              ჯარიმებიანი (-4 Hits)
            </span>
            <span className="text-lg font-black text-rose-400">{metrics.withPenalties}</span>
            <span className="text-[10px] text-zinc-500 font-sans block">მენეჯერი</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-rose-500/20 space-y-0.5">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider font-sans block">
              ჯამური ჩამოჭრილი ქულა
            </span>
            <span className="text-lg font-black text-rose-400">-{metrics.totalPenaltiesIncurred}</span>
            <span className="text-[10px] text-zinc-500 font-sans block">ქულა ჯარიმა</span>
          </div>

          <div className="p-3 rounded-xl bg-zinc-950/70 border border-indigo-500/20 space-y-0.5">
            <span className="text-[10px] text-indigo-400 uppercase tracking-wider font-sans block">
              Wildcard აქტიური
            </span>
            <span className="text-lg font-black text-indigo-400">{metrics.withWildcard}</span>
            <span className="text-[10px] text-zinc-500 font-sans block">მენეჯერი</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-3 rounded-2xl bg-zinc-900 border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ძებნა მენეჯერით, გუნდით ან კლასით..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-white text-zinc-950 font-black'
                : 'bg-zinc-950 border border-white/5 text-zinc-400 hover:text-white'
            }`}
          >
            ყველა ({transfersList.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('penalties')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'penalties'
                ? 'bg-rose-500 text-white font-black shadow-xs'
                : 'bg-zinc-950 border border-white/5 text-rose-400 hover:text-rose-300'
            }`}
          >
            ჯარიმით (-4) ({metrics.withPenalties})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('wildcard')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'wildcard'
                ? 'bg-indigo-500 text-white font-black shadow-xs'
                : 'bg-zinc-950 border border-white/5 text-indigo-400 hover:text-indigo-300'
            }`}
          >
            Wildcard ({metrics.withWildcard})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('zero_penalty')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'zero_penalty'
                ? 'bg-emerald-500 text-zinc-950 font-black shadow-xs'
                : 'bg-zinc-950 border border-white/5 text-emerald-400 hover:text-emerald-300'
            }`}
          >
            უფასო (0 ჯარიმა)
          </button>
        </div>
      </div>

      {/* 4. Live Breakdown Table: Detailed Breakdown of Managers Who Made GW2 Transfers */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <h4 className="font-black text-sm text-white">
              Detailed Breakdown of Managers Who Made GW2 Transfers (Live)
            </h4>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 font-bold">
            {filteredList.length} / {transfersList.length} მენეჯერი
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-zinc-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>იტვირთება მონაცემები...</span>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-xs">
            არცერთი მენეჯერი არ მოიძებნა არჩეული ფილტრით.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/5">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950 text-zinc-400 font-bold border-b border-white/10 text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">მენეჯერი / გუნდი</th>
                  <th className="p-3 text-center">GW1 ქულა</th>
                  <th className="p-3 text-center">ტრანსფერები</th>
                  <th className="p-3 text-center">ჩიპი</th>
                  <th className="p-3 text-center">Start FT</th>
                  <th className="p-3 text-center">დარჩენილი FT</th>
                  <th className="p-3 text-center">ჯარიმა</th>
                  <th className="p-3 text-center">საერთო ქულა</th>
                  <th className="p-3 text-right">მოქმედება</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11.5px]">
                {filteredList.map((m, idx) => {
                  const isClean = m.isAtGW1Baseline;
                  return (
                    <tr
                      key={m.id}
                      className={`hover:bg-white/[0.03] transition-colors ${
                        m.penalty > 0 ? 'bg-rose-500/[0.02]' : ''
                      }`}
                    >
                      <td className="p-3 text-zinc-500 text-[10px]">{idx + 1}</td>
                      <td className="p-3 font-sans">
                        <div className="font-bold text-white leading-tight">{m.managerName}</div>
                        <div className="text-[11px] text-zinc-400 leading-tight">
                          {m.teamName}{' '}
                          {m.grade && m.parallel && (
                            <span className="font-mono text-[9px] px-1 rounded bg-white/5 text-zinc-400 ml-1">
                              {m.grade}/{m.parallel}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* GW1 Gross */}
                      <td className="p-3 text-center font-bold text-emerald-400">
                        {m.gw1Gross}
                      </td>

                      {/* Transfers Made */}
                      <td className="p-3 text-center">
                        <span className="font-bold text-white">{m.recordedTransfers}</span>
                        {m.netDiff !== m.recordedTransfers && (
                          <span className="text-[10px] text-zinc-400 ml-1">(net {m.netDiff})</span>
                        )}
                      </td>

                      {/* Chip */}
                      <td className="p-3 text-center font-sans">
                        {m.chip === 'wildcard' ? (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                            Wildcard
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-500">None</span>
                        )}
                      </td>

                      {/* Start FT */}
                      <td className="p-3 text-center text-zinc-400 font-bold">{m.startFT}</td>

                      {/* Remaining FT */}
                      <td className="p-3 text-center">
                        <span className={`font-bold ${m.remainingFT > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                          {m.remainingFT}
                        </span>
                      </td>

                      {/* Penalty */}
                      <td className="p-3 text-center">
                        {m.penalty > 0 ? (
                          <span className="font-black text-rose-400 px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/25">
                            -{m.penalty} pts
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-bold">0</span>
                        )}
                      </td>

                      {/* Total Points */}
                      <td className="p-3 text-center">
                        <span className={`text-xs font-black ${m.penalty > 0 ? 'text-amber-400' : 'text-white'}`}>
                          {m.totalPoints}
                        </span>
                        {m.penalty > 0 && (
                          <span className="block text-[9px] text-zinc-500 line-through">
                            {m.gw1Gross}
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-3 text-right font-sans">
                        {isClean ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            <Check className="w-3 h-3" />
                            <span>GW1 Baseline</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedManager(m)}
                            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ml-auto shadow-xs hover:scale-105 active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>დაბრუნება GW1-ზე</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Manual Picker for Any Manager Who Played GW1 */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-white/10 space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <h4 className="font-black text-sm text-white">
            ნებისმიერი სხვა მენეჯერის შერჩევა (Manual Picker)
          </h4>
        </div>
        <p className="text-xs text-zinc-400">
          თუ გსურთ ისეთი მენეჯერის GW1-ზე დაბრუნება, რომელიც ზედა სიაში არ ჩანს, აირჩიეთ იგი ამ სიიდან:
        </p>

        <div className="flex items-center gap-2 max-w-lg">
          <select
            value={manualPickerId}
            onChange={(e) => setManualPickerId(e.target.value)}
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-500"
          >
            <option value="">-- აირჩიეთ მენეჯერი ({allEligibleManagers.length} მონაწილე) --</option>
            {allEligibleManagers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.managerName} ({m.teamName}) — {m.totalPoints} pts
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!manualPickerId}
            onClick={() => {
              const target = allEligibleManagers.find((m) => m.id === manualPickerId);
              if (target) setSelectedManager(target);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs transition-colors shrink-0 cursor-pointer"
          >
            არჩევა &amp; დაბრუნება
          </button>
        </div>
      </div>

      {/* 6. Rollback Confirmation Modal */}
      {selectedManager && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in select-none text-white"
          onClick={() => !isResetting && setSelectedManager(null)}
        >
          <div
            className="w-full max-w-lg bg-zinc-900 rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider text-white">
                    მენეჯერის GW1-ზე დაბრუნება (Reset to GW1)
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {selectedManager.managerName} • {selectedManager.teamName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setSelectedManager(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Impact Details Card */}
            <div className="p-4 rounded-2xl bg-zinc-950/80 border border-white/5 space-y-2.5 text-xs">
              <span className="font-black uppercase tracking-wider text-amber-400 block text-[11px]">
                ⚠️ რა ცვლილებები განხორციელდება:
              </span>

              <ul className="space-y-2 text-zinc-300 text-[11.5px]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>შემადგენლობა:</strong> აღდგება ზუსტად ის 9 მოთამაშე, სასტარტო 6, კაპიტანი და ვიცე-კაპიტანი, რომელიც მენეჯერს ჰყავდა GW1-ის დაბლოკვისას.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>უფასო ტრანსფერები:</strong> დაუბრუნდება სრული <strong>2 უფასო ტრანსფერი (2 FT)</strong> GW2-სთვის (გამოუყენებელი 1 FT + GW2-ის 1 FT).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>ტრანსფერების მთვლელი:</strong> განულდება (0 ტრანსფერი GW2-ში).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>ჯარიმები (Hits):</strong> GW2-ის ჯარიმა გახდება <strong>0 ქულა</strong>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>საერთო ქულები:</strong> აღდგება GW1-ის სრული ქულა (<strong>{selectedManager.gw1Gross} ქულა</strong>
                    {selectedManager.penalty > 0 ? `, დაბრუნდება ჩამოჭრილი +${selectedManager.penalty} ქულა` : ''}).
                  </span>
                </li>
                {selectedManager.chip && selectedManager.chip !== 'none' && (
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>ჩიპი:</strong> GW2-ში გააქტიურებული ჩიპი ({selectedManager.chip}) გაუქმდება და დარჩება ხელმისაწვდომი.
                    </span>
                  </li>
                )}
              </ul>
            </div>

            {/* Comparison Pill */}
            <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-950 border border-white/5 font-mono text-center text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 font-sans block uppercase">ამჟამინდელი ქულა</span>
                <span className="text-base font-black text-rose-400">{selectedManager.totalPoints} pts</span>
                <span className="text-[10px] text-zinc-500 font-sans block">{selectedManager.recordedTransfers} ტრანსფერი</span>
              </div>
              <div className="border-l border-white/10">
                <span className="text-[10px] text-emerald-400 font-sans block uppercase">დაბრუნების შემდეგ</span>
                <span className="text-base font-black text-emerald-400">{selectedManager.gw1Gross} pts</span>
                <span className="text-[10px] text-zinc-400 font-sans block">2 FT • 0 ჯარიმა</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setSelectedManager(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-zinc-300 font-bold text-xs transition-colors cursor-pointer"
              >
                გაუქმება / Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleExecuteReset}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                <span>{isResetting ? 'მიმდინარეობს დაბრუნება...' : 'დაადასტურეთ დაბრუნება'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
