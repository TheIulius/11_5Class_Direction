import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  BookOpen,
  Plus,
  X,
  Trash2,
  Check,
  Copy,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { GreenLightClub, StudyPod } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';

type CommunityTab = 'clubs' | 'study';

export const CommunityHubSection: React.FC = () => {
  const {
    user,
    canModerate,
    platform,
    addClub,
    deleteClub,
    addStudyPod,
    joinStudyPod,
    deleteStudyPod,
    openAuthModal,
  } = usePlatform();

  const clubs = platform.clubs || [];
  const pods = platform.studyPods || [];

  const [activeTab, setActiveTab] = useState<CommunityTab>('clubs');

  // Club Modal & State
  const [isClubModalOpen, setIsClubModalOpen] = useState(false);
  const [clubName, setClubName] = useState('');
  const [clubCategory, setClubCategory] = useState('ტექნოლოგიები');
  const [clubRoom, setClubRoom] = useState('ოთახი 304');
  const [activeCharter, setActiveCharter] = useState<GreenLightClub | null>(null);
  const [copied, setCopied] = useState(false);

  // Study Pod Modal & State
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const [podSubject, setPodSubject] = useState('მათემატიკა');
  const [podTopic, setPodTopic] = useState('');
  const [podTime, setPodTime] = useState('ხუთშაბათი, 15:30');
  const [podLocation, setPodLocation] = useState('ბიბლიოთეკა');
  const [podMaxSpots, setPodMaxSpots] = useState(6);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    soundEffects.success();

    const charterId = `CHARTER-2026-${Math.floor(100 + Math.random() * 900)}`;
    const created: GreenLightClub = {
      id: `club-${Date.now()}`,
      name: clubName.trim(),
      category: clubCategory,
      lead: user.fullName,
      room: clubRoom.trim() || 'ოთახი 304',
      summary: `დამტკიცებულია ${clubRoom}-ის გამოყენება 11/5 Platform-ის წესდებით.`,
      charterId,
    };

    const ok = await addClub(created);
    if (ok) {
      setActiveCharter(created);
      setClubName('');
      setIsClubModalOpen(false);
    }
  };

  const handleCopyCharter = () => {
    if (!activeCharter) return;
    soundEffects.click();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `11/5 Platform კლუბის წესდება: ${activeCharter.name} (${activeCharter.room}) - კოდი: ${activeCharter.charterId}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreatePod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podTopic.trim()) return;
    if (!user) {
      openAuthModal('login');
      return;
    }
    const ok = await addStudyPod({
      subject: podSubject.trim(),
      topic: podTopic.trim(),
      host: user ? user.fullName : 'მოსწავლე 11/5',
      time: podTime.trim(),
      location: podLocation.trim(),
      maxSpots: Number(podMaxSpots) || 6,
      currentSpots: 1,
    });
    if (ok) {
      soundEffects.success();
      setIsPodModalOpen(false);
      setPodTopic('');
    }
  };

  const handleToggleJoin = async (pod: StudyPod) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    soundEffects.success();
    setJoinedMap((prev) => ({ ...prev, [pod.id]: !prev[pod.id] }));
    await joinStudyPod(pod.id, user.fullName || 'მოსწავლე');
  };

  return (
    <section id="community" className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Header & Segmented Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 dark:text-indigo-400">
              სასკოლო გაერთიანებები &bull; 11/5
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            კლუბები &amp; სასწავლო ჯგუფები
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            დარეგისტრირდით ინტერესთა კლუბებში ან შეუერთდით თანაკლასელებს შემაჯამებლებისთვის ერთობლივად მოსამზადებლად.
          </p>
        </div>

        {/* Action Button */}
        {activeTab === 'clubs' ? (
          <button
            type="button"
            onClick={() => {
              soundEffects.click();
              if (!user) {
                openAuthModal('login');
                return;
              }
              setIsClubModalOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all self-start sm:self-end shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი კლუბის დარეგისტრირება</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              soundEffects.click();
              if (!user) {
                openAuthModal('login');
                return;
              }
              setIsPodModalOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all self-start sm:self-end shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>ახალი ჯგუფის შექმნა</span>
          </button>
        )}
      </div>

      {/* Segmented Control */}
      <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            soundEffects.click();
            setActiveTab('clubs');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'clubs'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>კლუბები ({clubs.length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            soundEffects.click();
            setActiveTab('study');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            activeTab === 'study'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>მეცადინეობის ჯგუფები ({pods.length})</span>
        </button>
      </div>

      {/* Tab 1: CLUBS DIRECTORY */}
      {activeTab === 'clubs' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="card-surface rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 card-hover transition-all"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {club.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        აქტიური
                      </span>
                      {canModerate && (
                        <button
                          type="button"
                          onClick={() => deleteClub(club.id)}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                          title="კლუბის წაშლა"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                    {club.name}
                  </h3>

                  {club.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {club.summary}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{club.room || 'ოთახი 304'}</span>
                  </span>
                  {club.lead && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3 h-3 text-slate-400" />
                      <span>{club.lead}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {clubs.length === 0 && (
            <div className="card-surface p-12 text-center rounded-2xl">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                აქტიური კლუბები ჯერ არ არის დამატებული.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: STUDY PODS DIRECTORY */}
      {activeTab === 'study' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pods.map((pod) => {
              const isJoined = Boolean(joinedMap[pod.id]);
              const spotsRemaining = Math.max(0, pod.maxSpots - pod.currentSpots);
              const isFull = spotsRemaining === 0 && !isJoined;

              return (
                <div
                  key={pod.id}
                  className="card-surface rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 card-hover transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] border border-indigo-200/50 dark:border-indigo-800/40">
                        {pod.subject}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isFull
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                              : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isFull ? 'სავსეა' : `${spotsRemaining} ადგილი დარჩენილია`}
                        </span>
                        {canModerate && (
                          <button
                            type="button"
                            onClick={() => deleteStudyPod(pod.id)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition-colors"
                            title="ჯგუფის წაშლა"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {pod.topic}
                    </h3>

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pod.time}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{pod.location}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>ორგანიზატორი: {pod.host}</span>
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      მონაწილეები: <strong className="text-slate-900 dark:text-white">{pod.currentSpots + (isJoined ? 1 : 0)}</strong> / {pod.maxSpots}
                    </div>

                    <button
                      type="button"
                      disabled={isFull}
                      onClick={() => handleToggleJoin(pod)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isJoined
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                          : isFull
                          ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>შემოერთებული</span>
                        </>
                      ) : (
                        <span>შემოერთება</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {pods.length === 0 && (
            <div className="card-surface p-12 text-center rounded-2xl">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                სასწავლო ჯგუფები ჯერ არ არის შექმნილი.
              </p>
            </div>
          )}
        </div>
      )}

      {/* New Club Modal */}
      <AnimatePresence>
        {isClubModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClubModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-labelledby="new-club-title"
              className="relative w-full max-w-md bg-white dark:bg-[#121422] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="new-club-title" className="text-base font-bold text-slate-900 dark:text-white">
                    ახალი კლუბის დარეგისტრირება
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    განაცხადი განიხილება და დადასტურდება თვითმმართველობის მიერ
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClubModalOpen(false)}
                  aria-label="დახურვა"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateClub} className="space-y-3.5">
                <div>
                  <label htmlFor="club-name" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    კლუბის დასახელება
                  </label>
                  <input
                    id="club-name"
                    type="text"
                    required
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="მაგ. AI & მონაცემთა გილდია"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="club-cat" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    მიმართულება
                  </label>
                  <select
                    id="club-cat"
                    value={clubCategory}
                    onChange={(e) => setClubCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ტექნოლოგიები">ტექნოლოგიები &amp; AI</option>
                    <option value="მეცნიერება & დებატები">მეცნიერება &amp; დებატები</option>
                    <option value="ხელოვნება & კულტურა">ხელოვნება &amp; კულტურა</option>
                    <option value="ლოგიკა & სპორტი">ლოგიკა &amp; სპორტი</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="club-room" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    სასკოლო სივრცე / ოთახი
                  </label>
                  <input
                    id="club-room"
                    type="text"
                    value={clubRoom}
                    onChange={(e) => setClubRoom(e.target.value)}
                    placeholder="მაგ. ოთახი 304 / ბიბლიოთეკა"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsClubModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm cursor-pointer"
                  >
                    განაცხადის გაგზავნა
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Study Pod Modal */}
      <AnimatePresence>
        {isPodModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPodModalOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-labelledby="new-pod-title"
              className="relative w-full max-w-md bg-white dark:bg-[#121422] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 id="new-pod-title" className="text-base font-bold text-slate-900 dark:text-white">
                    ახალი სასწავლო ჯგუფის შექმნა
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    მოიწვიეთ კლასელები ერთობლივი მომზადებისთვის
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPodModalOpen(false)}
                  aria-label="დახურვა"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePod} className="space-y-3.5">
                <div>
                  <label htmlFor="pod-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    საგანი
                  </label>
                  <input
                    id="pod-subject"
                    type="text"
                    required
                    value={podSubject}
                    onChange={(e) => setPodSubject(e.target.value)}
                    placeholder="მაგ. ფიზიკა / მათემატიკა"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="pod-topic" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    თემატიკა &amp; მიზანი
                  </label>
                  <input
                    id="pod-topic"
                    type="text"
                    required
                    value={podTopic}
                    onChange={(e) => setPodTopic(e.target.value)}
                    placeholder="მაგ. შემაჯამებლის ამოცანების გარჩევა"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="pod-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      დრო
                    </label>
                    <input
                      id="pod-time"
                      type="text"
                      value={podTime}
                      onChange={(e) => setPodTime(e.target.value)}
                      placeholder="ხუთშაბათი, 15:30"
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="pod-location" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ადგილი
                    </label>
                    <input
                      id="pod-location"
                      type="text"
                      value={podLocation}
                      onChange={(e) => setPodLocation(e.target.value)}
                      placeholder="ბიბლიოთეკა"
                      className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="pod-capacity" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ადგილების ლიმიტი
                  </label>
                  <input
                    id="pod-capacity"
                    type="number"
                    min={2}
                    max={25}
                    value={podMaxSpots}
                    onChange={(e) => setPodMaxSpots(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPodModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm cursor-pointer"
                  >
                    ჯგუფის შექმნა
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Charter Modal for minted club */}
      <AnimatePresence>
        {activeCharter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCharter(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#121422] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    კლუბის წესდება დაგენერირდა
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCharter(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 font-mono text-xs space-y-2">
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>ტოკენი:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeCharter.charterId}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>კლუბი:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeCharter.name}</span>
                </div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400">
                  <span>სივრცე:</span>
                  <span className="text-slate-900 dark:text-white font-bold">{activeCharter.room}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCharter}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'დაკოპირდა!' : 'წესდების კოდის კოპირება'}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};