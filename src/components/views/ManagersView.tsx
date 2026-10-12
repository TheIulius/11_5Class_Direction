import React, { useState, useEffect } from 'react';
import { useFPL } from '../../context/FPLContext';
import {
  adminFetchUsersApi,
  adminApproveUserApi,
  adminSetUserRoleApi,
  adminDeleteUserApi,
  adminResetPasswordApi,
  adminFetchPlayerPhotosApi,
  adminReviewPlayerPhotoApi,
} from '../../services/api';
import { IOSSwitch } from '../common/IOSSwitch';
import { ManagerSquadModal } from '../leagues/ManagerSquadModal';
import confetti from 'canvas-confetti';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Check,
  X,
  KeyRound,
  Trash2,
  Eye,
  Camera,
  Sparkles,
  Shield,
  AlertCircle,
  RefreshCw,
  Award,
  Unlock,
} from 'lucide-react';

export const ManagersView: React.FC = () => {
  const { authUser, players, refreshServerState } = useFPL();

  const [usersList, setUsersList] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'approved' | 'refs' | 'admins'>('all');

  // Inspection & actions state
  const [selectedManagerIdForSquad, setSelectedManagerIdForSquad] = useState<string | null>(null);
  const [resetUserTarget, setResetUserTarget] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Pending Photos State
  const [pendingPhotos, setPendingPhotos] = useState<any[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setIsLoadingUsers(true);
    setIsLoadingPhotos(true);
    try {
      const [usersRes, photosRes] = await Promise.all([
        adminFetchUsersApi().catch(() => ({ users: [] })),
        adminFetchPlayerPhotosApi().catch(() => ({ pendingPhotos: [] })),
      ]);
      if (usersRes.users) {
        setUsersList(usersRes.users);
      }
      if (photosRes.pendingPhotos) {
        setPendingPhotos(photosRes.pendingPhotos);
      }
    } catch {
      showNotification('Failed to load managers data.');
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingPhotos(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Toggle Approval via iOS switch
  const handleToggleApproval = async (userId: string, username: string, currentApproved: boolean) => {
    const targetApproved = !currentApproved;
    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isApproved: targetApproved } : u))
    );

    try {
      const res = await adminApproveUserApi({ userId, username, isApproved: targetApproved });
      if (res.success) {
        if (targetApproved) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
        }
        showNotification(res.message || `@${username} approval status updated.`);
      }
    } catch (err: any) {
      // Revert on failure
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isApproved: currentApproved } : u))
      );
      showNotification(err?.message || 'Failed to update approval status.');
    }
  };

  // Handle Toggle Admin Privileges
  const handleToggleAdmin = async (userId: string, username: string, currentIsAdmin: boolean) => {
    const isPrimary = username.toLowerCase() === 'theiulius' || username.toLowerCase() === 'chaga';
    if (isPrimary) {
      showNotification('Cannot modify permissions of primary tournament creator.');
      return;
    }

    const targetAdmin = !currentIsAdmin;
    const targetRole: 'admin' | 'user' = targetAdmin ? 'admin' : 'user';

    if (targetAdmin) {
      const ok = window.confirm(
        `დარწმუნებული ხართ, რომ გსურთ @${username}-ს მიანიჭოთ ADMIN პრივილეგიები?\n\nმომხმარებელს ექნება სრული წვდომა ადმინ პანელზე, მატჩებზე და მენეჯერებზე.`
      );
      if (!ok) return;
    } else {
      const ok = window.confirm(`გსურთ ჩამოართვათ ADMIN უფლებები @${username}-ს?`);
      if (!ok) return;
    }

    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, isAdmin: targetAdmin, role: targetRole, isApproved: targetAdmin ? true : u.isApproved }
          : u
      )
    );

    try {
      const res = await adminSetUserRoleApi({
        userId,
        username,
        role: targetRole,
      });
      if (res.success) {
        if (targetAdmin) {
          confetti({ particleCount: 60, spread: 75, origin: { y: 0.6 } });
        }
        showNotification(res.message || `@${username} is now ${targetAdmin ? 'an Administrator (ადმინი)' : 'a regular user'}.`);
        refreshServerState();
      }
    } catch (err: any) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isAdmin: currentIsAdmin, role: currentIsAdmin ? 'admin' : 'user' } : u))
      );
      showNotification(err?.message || 'Failed to update admin privileges.');
    }
  };

  // Handle Toggle Referee Role
  const handleToggleRef = async (userId: string, username: string, currentIsRef: boolean) => {
    const targetRef = !currentIsRef;
    // Optimistic UI update
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isReferee: targetRef, role: targetRef ? 'ref' : 'user' } : u))
    );

    try {
      const res = await adminSetUserRoleApi({
        userId,
        username,
        role: targetRef ? 'ref' : 'user',
        isReferee: targetRef,
      });
      if (res.success) {
        if (targetRef) {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
        }
        showNotification(res.message || `@${username} is now ${targetRef ? 'a trusted Referee (მსაჯი)' : 'a regular user'}.`);
      }
    } catch (err: any) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isReferee: currentIsRef, role: currentIsRef ? 'ref' : 'user' } : u))
      );
      showNotification(err?.message || 'Failed to update referee role.');
    }
  };

  // Handle Review Player Photo
  const handleReviewPhoto = async (photoId: string, approve: boolean) => {
    try {
      const res = await adminReviewPlayerPhotoApi(photoId, approve);
      if (res.success) {
        if (approve) {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 } });
        }
        showNotification(res.message || (approve ? 'Photo approved!' : 'Photo rejected.'));
        setPendingPhotos((prev) => prev.filter((p) => p.id !== photoId));
        refreshServerState();
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to review photo.');
    }
  };

  // Handle Password Reset
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserTarget || !newPassword || newPassword.length < 4) return;
    setIsResetting(true);
    try {
      const res = await adminResetPasswordApi(resetUserTarget.username, newPassword);
      if (res.success) {
        showNotification(`Password for @${resetUserTarget.username} updated!`);
        setResetUserTarget(null);
        setNewPassword('');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete manager @${username}?`)) {
      return;
    }
    try {
      const res = await adminDeleteUserApi(userId, username);
      if (res.success) {
        showNotification(`Manager @${username} removed.`);
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (err: any) {
      showNotification(err?.message || 'Failed to delete manager.');
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.username.toLowerCase().includes(q) ||
      (u.managerName || '').toLowerCase().includes(q) ||
      (u.teamName || '').toLowerCase().includes(q) ||
      (u.realName || '').toLowerCase().includes(q) ||
      (u.grade && u.parallel && `${u.grade}/${u.parallel}`.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (filterMode === 'admins') {
      return u.isAdmin || u.role === 'admin' || u.username === 'theiulius' || u.username === 'chaga';
    }
    if (filterMode === 'pending') {
      return !u.isAdmin && !u.isApproved;
    }
    if (filterMode === 'approved') {
      return u.isAdmin || u.isApproved;
    }
    if (filterMode === 'refs') {
      return u.role === 'ref' || u.isReferee;
    }
    return true;
  });

  const totalCount = usersList.length;
  const approvedCount = usersList.filter((u) => u.isAdmin || u.isApproved).length;
  const pendingCount = usersList.filter((u) => !u.isAdmin && !u.isApproved).length;
  const refsCount = usersList.filter((u) => u.role === 'ref' || u.isReferee).length;
  const adminsCount = usersList.filter((u) => u.isAdmin || u.role === 'admin' || u.username === 'theiulius' || u.username === 'chaga').length;

  return (
    <div className="space-y-4 pb-20 animate-fade-in text-slate-900 dark:text-white">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 bg-sky-600 dark:bg-white text-white dark:text-slate-950 px-4 py-2.5 rounded-2xl shadow-xl border border-sky-400/40 dark:border-white/20 text-xs font-black animate-fade-in">
          {notification}
        </div>
      )}

      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">
                Managers Management
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30">
                Admin Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approve paid accounts, review player photos, inspect squad lineups and manage registrations
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={isLoadingUsers}
          className="px-3.5 py-2 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Total Registered</span>
          <span className="text-lg sm:text-2xl font-black font-mono tabular-nums mt-0.5 text-slate-900 dark:text-white">
            {totalCount}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-center">
          <span className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
            Approved (Paid)
          </span>
          <span className="text-lg sm:text-2xl font-black font-mono tabular-nums mt-0.5 text-slate-900 dark:text-white">
            {approvedCount}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-center">
          <span className="block text-[10px] uppercase font-bold text-amber-500 dark:text-amber-400">
            Pending Approval
          </span>
          <span className="text-lg sm:text-2xl font-black font-mono tabular-nums mt-0.5 text-amber-500 dark:text-amber-400">
            {pendingCount}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 text-center">
          <span className="block text-[10px] uppercase font-bold text-sky-500 dark:text-sky-400">
            Pending Photos
          </span>
          <span className="text-lg sm:text-2xl font-black font-mono tabular-nums mt-0.5 text-sky-500 dark:text-sky-400">
            {pendingPhotos.length}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PENDING PLAYER PHOTOS APPROVAL QUEUE                                      */}
      {/* ========================================================================= */}
      {pendingPhotos.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl border border-amber-500/30 dark:border-amber-500/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                Player Photos Awaiting Approval ({pendingPhotos.length})
              </h3>
            </div>
            <span className="text-xs text-amber-600 dark:text-amber-300 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-500/30">
              Needs Review
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Managers have uploaded profile pictures for players. Review and approve to make them live across the app.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {pendingPhotos.map((photo) => {
              const targetPlayer = players[photo.playerId];

              return (
                <div
                  key={photo.id}
                  className="p-3 rounded-2xl bg-white/70 dark:bg-white/[0.03] backdrop-blur-md border border-slate-200/80 dark:border-white/10 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={photo.photoUrl}
                      alt="Player preview"
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/50 shadow-md shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {targetPlayer?.position || 'PLAYER'}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">
                        {targetPlayer?.name || photo.playerId}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
                        Uploaded by <strong className="text-slate-800 dark:text-zinc-200">{photo.suggestedBy}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-white/5">
                    <button
                      onClick={() => handleReviewPhoto(photo.id, true)}
                      className="flex-1 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReviewPhoto(photo.id, false)}
                      className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REGISTERED MANAGERS LIST & APPROVALS                                      */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-zinc-950/40 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm space-y-4">
        {/* Toolbar: Search and Filter Chips */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by manager name, team or @username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs font-semibold focus:outline-hidden focus:border-slate-900 dark:focus:border-white/30 transition-colors"
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

          {/* Filter Chips */}
          <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-white/[0.04] p-1 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                filterMode === 'pending'
                  ? 'bg-amber-500 text-slate-950 shadow-xs font-black'
                  : 'text-amber-500 hover:text-amber-600'
              }`}
            >
              <span>Pending</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterMode('approved')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterMode === 'approved'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setFilterMode('refs')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'refs'
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/30 shadow-xs font-black'
                  : 'text-amber-500 hover:text-amber-400'
              }`}
            >
              <Award className="w-3 h-3" />
              <span>Refs ({refsCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('admins')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterMode === 'admins'
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-xs font-black'
                  : 'text-purple-400 hover:text-purple-300'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admins ({adminsCount})</span>
            </button>
          </div>
        </div>

        {/* Manager Cards / Table */}
        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 space-y-1">
              <Users className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-bold">No managers found matching criteria</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const isPrimaryAdmin = u.username.toLowerCase() === 'theiulius' || u.username.toLowerCase() === 'chaga';
              const isUserAdmin = Boolean(u.isAdmin || u.role === 'admin' || isPrimaryAdmin);
              const isApproved = isUserAdmin || Boolean(u.isApproved);
              const isRef = Boolean(u.role === 'ref' || u.isReferee);

              return (
                <div
                  key={u.id}
                  className="p-3 sm:p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] hover:bg-white dark:hover:bg-white/[0.06] backdrop-blur-md border border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  {/* Left: Manager Info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-zinc-800 flex items-center justify-center font-black text-sm shrink-0 border border-slate-300 dark:border-white/10">
                      {(u.managerName || u.username)[0].toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-black truncate">
                          {u.realName ? `${u.realName} (${u.managerName})` : u.managerName}
                        </h4>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          @{u.username}
                        </span>
                        {u.grade && u.parallel && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                            {u.grade}/{u.parallel}
                          </span>
                        )}
                        {isUserAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 font-mono">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        )}
                        {isRef && !isUserAdmin && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-mono">
                            <Award className="w-2.5 h-2.5" />
                            Ref
                          </span>
                        )}
                        {u.isLineupUnlocked && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono animate-pulse">
                            <Unlock className="w-2.5 h-2.5" />
                            Unlocked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="font-semibold truncate">Team: {u.teamName}</span>
                        {u.createdAt && (
                          <>
                            <span>•</span>
                            <span className="text-[10px]">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions & iOS Approval Switch */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-white/5 flex-wrap">
                    {/* View Squad Button */}
                    <button
                      onClick={() => setSelectedManagerIdForSquad(u.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1 text-slate-700 dark:text-slate-200 cursor-pointer"
                      title="Inspect manager's squad & lineup"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lineup</span>
                    </button>

                    {/* Reset Password Button */}
                    <button
                      onClick={() => setResetUserTarget(u)}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                      title="Reset Password"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Account */}
                    {!isPrimaryAdmin && u.username.toLowerCase() !== authUser?.username?.toLowerCase() && (
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 transition-all cursor-pointer"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Role Toggles (Admin & Ref) - cannot toggle primary creator admins */}
                    {!isPrimaryAdmin && (
                      <div className="flex items-center gap-1.5 pl-2 border-l border-slate-300 dark:border-white/10">
                        {/* Admin Role Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleAdmin(u.id, u.username, isUserAdmin)}
                          className={`px-2 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer select-none ${
                            isUserAdmin
                              ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50 hover:bg-purple-500'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-purple-500/20 hover:text-purple-300'
                          }`}
                          title={isUserAdmin ? 'Revoke Admin privileges' : 'Grant Admin privileges'}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{isUserAdmin ? '🛡️ Admin' : '+ Admin'}</span>
                        </button>

                        {/* Referee Role Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleRef(u.id, u.username, isRef)}
                          className={`px-2 py-1 rounded-xl text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer select-none ${
                            isRef
                              ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50 hover:bg-amber-400'
                              : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 hover:bg-amber-500/20 hover:text-amber-300'
                          }`}
                          title={isRef ? 'Revoke Referee role' : 'Make trusted Referee'}
                        >
                          <Award className="w-3 h-3" />
                          <span>{isRef ? '🏁 Ref' : '+ Ref'}</span>
                        </button>
                      </div>
                    )}

                    {/* iOS Approval Switch */}
                    <div className="flex items-center gap-2 pl-2 border-l border-slate-300 dark:border-white/10">
                      <span className={`text-[11px] font-black uppercase ${isApproved ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {isApproved ? 'Approved' : 'Pending'}
                      </span>
                      <IOSSwitch
                        size="md"
                        color="emerald"
                        checked={isApproved}
                        disabled={isUserAdmin}
                        ariaLabel={`Approval switch for ${u.username}`}
                        onChange={() => handleToggleApproval(u.id, u.username, isApproved)}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Password Reset Modal */}
      {resetUserTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
          onClick={() => setResetUserTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-[#0c141f]/95 backdrop-blur-2xl border border-slate-200/80 dark:border-white/15 p-5 space-y-4 shadow-2xl text-slate-900 dark:text-white"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10">
              <h3 className="font-black text-sm">
                Reset Password for @{resetUserTarget.username}
              </h3>
              <button onClick={() => setResetUserTarget(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPasswordReset} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">New Password</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="Min 4 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 rounded-xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/10 text-xs font-semibold focus:outline-hidden focus:border-slate-900 dark:focus:border-white/30"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetUserTarget(null)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-slate-200/80 dark:border-white/10 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetting || newPassword.length < 4}
                  className="flex-1 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-xs font-black disabled:opacity-50 cursor-pointer"
                >
                  {isResetting ? 'Saving...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Squad Inspection Modal */}
      {selectedManagerIdForSquad && (
        <ManagerSquadModal
          managerId={selectedManagerIdForSquad}
          onClose={() => setSelectedManagerIdForSquad(null)}
        />
      )}
    </div>
  );
};
