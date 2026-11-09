import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  CheckCircle2,
  XCircle,
  UserPlus,
  Users,
  Megaphone,
  Clock,
  FileText,
  BookOpen,
  Rocket,
  Trash2,
  KeyRound,
  Crown,
  ExternalLink,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';

interface ManagedUser {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'user';
  isAdmin: boolean;
  createdAt?: string;
}

export const AdminDashboardModal: React.FC = () => {
  const {
    isAdmin,
    token,
    platform,
    pendingCounts,
    isAdminModalOpen,
    adminModalTab,
    closeAdminModal,
    moderateResource,
    deleteResource,
    moderateHomework,
    updateClub,
    deleteClub,
    updateAnnouncement,
  } = usePlatform();

  const [activeTab, setActiveTab] = useState<'approvals' | 'users' | 'announcement'>(adminModalTab);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Create new account state
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(true);
  const [userFormStatus, setUserFormStatus] = useState<string | null>(null);

  // Announcement state
  const [annText, setAnnText] = useState(platform.announcement?.text || '');
  const [annActive, setAnnActive] = useState(Boolean(platform.announcement?.active));
  const [annType, setAnnType] = useState<'info' | 'urgent' | 'success'>(
    platform.announcement?.type || 'info'
  );
  const [annSaved, setAnnSaved] = useState(false);

  useEffect(() => {
    setActiveTab(adminModalTab);
  }, [adminModalTab, isAdminModalOpen]);

  useEffect(() => {
    if (platform.announcement) {
      setAnnText(platform.announcement.text || '');
      setAnnActive(Boolean(platform.announcement.active));
      setAnnType(platform.announcement.type || 'info');
    }
  }, [platform.announcement]);

  const fetchUsers = useCallback(async () => {
    if (!token || !isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/platform/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (e) {
      console.warn('Failed to fetch users', e);
    } finally {
      setLoadingUsers(false);
    }
  }, [token, isAdmin]);

  useEffect(() => {
    if (isAdminModalOpen && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAdminModalOpen, activeTab, fetchUsers]);

  if (!isAdminModalOpen || !isAdmin) return null;

  const pendingResources = platform.resources.filter((r) => r.status === 'pending');
  const pendingHomeworks = platform.homeworks.filter((h) => h.status === 'pending');
  const pendingClubs = platform.clubs.filter((c) => c.status === 'განხილვაშია');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    setUserFormStatus(null);
    try {
      const res = await fetch('/api/platform/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: newUsername.trim(),
          fullName: newFullName.trim() || newUsername.trim(),
          password: newPassword.trim(),
          isAdmin: newIsAdmin,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUserFormStatus(
          `აქაუნთი @${data.user.username} წარმატებით შეიქმნა/განახლდა (${
            data.user.isAdmin ? 'ადმინი' : 'მოსწავლე'
          })!`
        );
        setNewUsername('');
        setNewFullName('');
        setNewPassword('');
        fetchUsers();
      } else {
        setUserFormStatus(data.error || 'შეცდომა აქაუნთის შექმნისას');
      }
    } catch {
      setUserFormStatus('ქსელური შეცდომა');
    }
  };

  const handleToggleAdmin = async (u: ManagedUser) => {
    await fetch(`/api/platform/admin/users/${u.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ isAdmin: !u.isAdmin }),
    });
    fetchUsers();
  };

  const handleResetUserPassword = async (u: ManagedUser) => {
    const nextPass = window.prompt(
      `შეიყვანეთ ახალი პაროლი მომხმარებლისთვის @${u.username} (მინ. 4 სიმბოლო):`
    );
    if (!nextPass || nextPass.trim().length < 4) return;
    await fetch(`/api/platform/admin/users/${u.id}/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ newPassword: nextPass.trim() }),
    });
    window.alert(`@${u.username}-ის პაროლი წარმატებით განახლდა!`);
  };

  const handleDeleteUser = async (u: ManagedUser) => {
    if (!window.confirm(`ნამდვილად გსურთ @${u.username} აქაუნთის წაშლა?`)) return;
    await fetch(`/api/platform/admin/users/${u.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateAnnouncement({
      text: annText,
      active: annActive,
      type: annType,
    });
    if (ok) {
      setAnnSaved(true);
      setTimeout(() => setAnnSaved(false), 2500);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn"
      onClick={closeAdminModal}
    >
      <div
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black">11/5 ადმინისტრატორის სამართავი პანელი</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-400 text-slate-950">
                  ADMIN CMS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                მასალების დადასტურება, სპეციალური ადმინ-აქაუნთების გაცემა და პლატფორმის მართვა
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeAdminModal}
            aria-label="ადმინ პანელის დახურვა"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-0 border-b border-slate-200 bg-slate-50 flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'approvals'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            დასადასტურებელი მასალები
            {pendingCounts.total > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white">
                {pendingCounts.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            აქაუნთები & ადმინების დამატება
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('announcement')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'announcement'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            მთავარი განცხადების ზოლი
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              {pendingCounts.total === 0 ? (
                <div className="text-center py-12 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                  <h3 className="text-sm font-black text-slate-900">
                    ყველა გამოგზავნილი მასალა დადასტურებულია!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    როდესაც კლასელები ატვირთავენ კონსპექტს, დავალებას ან კლუბის განაცხადს, აქ გამოჩნდება დასადასტურებლად.
                  </p>
                </div>
              ) : null}

              {/* Pending Resources / Study Notes */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  მოსწავლეების ატვირთული კონსპექტები & რესურსები ({pendingResources.length})
                </h3>
                {pendingResources.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    განსახილველი კონსპექტები არ არის.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingResources.map((res) => (
                      <div
                        key={res.id}
                        className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              {res.resourceType}
                            </span>
                            {res.subject && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                                {res.subject}
                              </span>
                            )}
                            {res.targetTitle && (
                              <span className="text-[11px] font-bold text-indigo-700">
                                მიბმულია: {res.targetTitle}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-900">{res.title}</h4>
                          <p className="text-xs text-slate-600">{res.description}</p>
                          {res.content && (
                            <pre className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans max-h-32 overflow-y-auto mt-1">
                              {res.content}
                            </pre>
                          )}
                          {res.linkUrl && (
                            <a
                              href={res.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              ბმულის გახსნა
                            </a>
                          )}
                          <div className="text-[11px] text-slate-500 pt-1">
                            ავტორი: <span className="font-bold text-slate-700">{res.authorName}</span> (@{res.authorUsername})
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => moderateResource(res.id, 'approved')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            დადასტურება
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteResource(res.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            უარყოფა / წაშლა
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Homeworks */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  მოსწავლეების გამოგზავნილი დავალებები ({pendingHomeworks.length})
                </h3>
                {pendingHomeworks.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    განსახილველი დავალებები არ არის.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingHomeworks.map((hw) => (
                      <div
                        key={hw.id}
                        className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                              {hw.subject}
                            </span>
                            <span className="text-xs font-bold text-slate-500">თარიღი: {hw.date}</span>
                          </div>
                          <h4 className="text-sm font-black text-slate-900">{hw.title}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{hw.notes}</p>
                          {hw.authorName && (
                            <p className="text-[11px] text-slate-500 mt-1">
                              გამოგზავნა: <span className="font-bold">{hw.authorName}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => moderateHomework(hw.id, 'approved')}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            დადასტურება
                          </button>
                          <button
                            type="button"
                            onClick={() => moderateHomework(hw.id, 'rejected')}
                            className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-4 h-4" />
                            უარყოფა
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Clubs */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-indigo-600" />
                  განსახილველი კლუბების განაცხადები ({pendingClubs.length})
                </h3>
                {pendingClubs.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    განსახილველი კლუბები არ არის.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingClubs.map((club) => (
                      <div
                        key={club.id}
                        className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div>
                          <h4 className="text-sm font-black text-slate-900">{club.name}</h4>
                          <p className="text-xs text-slate-600 mt-0.5">{club.summary}</p>
                          <p className="text-[11px] text-slate-500 mt-1">
                            დამფუძნებელი: <span className="font-bold">{club.lead}</span> • სივრცე: {club.room}
                          </p>
                        </div>
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateClub(club.id, { status: 'მწვანე შუქი მიღებულია' })}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            მწვანე შუქის მიცემა
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteClub(club.id)}
                            className="px-3.5 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Trash2 className="w-4 h-4" />
                            წაშლა
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Create Special Admin or Student Account */}
              <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-200/80 h-fit">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      სპეციალური აქაუნთის შექმნა
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      მიეცით კლასელს ადმინის ან მოსწავლის აქაუნთი და პაროლი
                    </p>
                  </div>
                </div>

                {userFormStatus && (
                  <div className="mb-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold">
                    {userFormStatus}
                  </div>
                )}

                <form onSubmit={handleCreateAccount} className="space-y-3">
                  <div>
                    <label
                      htmlFor="admin-create-username"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      Username (შესასვლელი სახელი)
                    </label>
                    <input
                      id="admin-create-username"
                      type="text"
                      required
                      spellCheck={false}
                      autoCapitalize="off"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="მაგ: giorgi_admin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-create-fullname"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      სახელი და გვარი
                    </label>
                    <input
                      id="admin-create-fullname"
                      type="text"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      placeholder="მაგ: გიორგი კვარაცხელია"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-create-password"
                      className="block text-xs font-bold text-slate-700 mb-1"
                    >
                      პაროლი (რომელსაც გადასცემთ)
                    </label>
                    <input
                      id="admin-create-password"
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="მაგ: komarovi115"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white font-mono"
                    />
                  </div>

                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newIsAdmin}
                      onChange={(e) => setNewIsAdmin(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      მიენიჭოს სრული ადმინისტრატორის უფლებები
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/15 transition-all"
                  >
                    აქაუნთის შექმნა / განახლება
                  </button>
                </form>
              </div>

              {/* Existing Accounts List */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    რეგისტრირებული აქაუნთები ({users.length})
                  </h3>
                  <button
                    type="button"
                    onClick={fetchUsers}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    განახლება
                  </button>
                </div>

                {loadingUsers ? (
                  <p className="text-xs text-slate-400 py-8 text-center">იტვირთება მომხმარებლები...</p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {users.map((u) => (
                      <div
                        key={u.id}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs ${
                              u.isAdmin
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {u.isAdmin ? <Crown className="w-4 h-4" /> : u.fullName.slice(0, 1)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-900">{u.fullName}</span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  u.isAdmin
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {u.isAdmin ? 'ადმინი' : 'მოსწავლე'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 font-mono">@{u.username}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(u)}
                            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors"
                          >
                            {u.isAdmin ? 'ადმინის მოხსნა' : 'ადმინად დანიშვნა'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResetUserPassword(u)}
                            title="პაროლის შეცვლა"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 text-slate-600 transition-colors"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {u.username !== 'admin' && u.username !== 'theiulius' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u)}
                              title="აქაუნთის წაშლა"
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'announcement' && (
            <form onSubmit={handleSaveAnnouncement} className="max-w-xl space-y-4">
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer mb-3">
                  <input
                    type="checkbox"
                    checked={annActive}
                    onChange={(e) => setAnnActive(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span className="text-sm font-bold text-slate-900">
                    გამოჩნდეს განცხადების ბანერი საიტის თავში
                  </span>
                </label>
              </div>

              <div>
                <label
                  htmlFor="announcement-text"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  განცხადების ტექსტი
                </label>
                <textarea
                  id="announcement-text"
                  rows={3}
                  value={annText}
                  onChange={(e) => setAnnText(e.target.value)}
                  placeholder="მაგ: ხვალ მე-3 გაკვეთილზე გვაქვს ფიზიკის დამოუკიდებელი სამუშაო — კონსპექტი იხილეთ კალენდარში!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="announcement-type"
                  className="block text-xs font-bold text-slate-700 mb-1.5"
                >
                  ბანერის სტილი
                </label>
                <select
                  id="announcement-type"
                  value={annType}
                  onChange={(e) => setAnnType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="info">საინფორმაციო (ლურჯი/ინდიგო)</option>
                  <option value="urgent">სასწრაფო / მნიშვნელოვანი (წითელი)</option>
                  <option value="success">წარმატება / სიახლე (მწვანე)</option>
                </select>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                განცხადების შენახვა
              </button>
              {annSaved && (
                <p className="text-xs font-bold text-emerald-600">
                  განცხადება წარმატებით განახლდა!
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
