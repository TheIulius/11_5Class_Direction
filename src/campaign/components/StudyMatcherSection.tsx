import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { StudyPod } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';

export const StudyMatcherSection: React.FC = () => {
  const { user, isAdmin, platform, addStudyPod, joinStudyPod, deleteStudyPod, openAuthModal } =
    usePlatform();
  const pods = platform.studyPods;
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [subject, setSubject] = useState('მათემატიკა');
  const [topic, setTopic] = useState('');
  const [time, setTime] = useState('ხუთშაბათი, 15:30');
  const [location, setLocation] = useState('ბიბლიოთეკა');
  const [maxSpots, setMaxSpots] = useState(6);

  const handleToggleJoin = async (pod: StudyPod) => {
    soundEffects.success();
    setJoinedMap((prev) => ({ ...prev, [pod.id]: !prev[pod.id] }));
    await joinStudyPod(pod.id, user?.fullName || 'მოსწავლე');
  };

  const handleCreatePod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const ok = await addStudyPod({
      subject: subject.trim(),
      topic: topic.trim(),
      host: user ? user.fullName : 'მოსწავლე 11/5',
      time: time.trim(),
      location: location.trim(),
      maxSpots: Number(maxSpots) || 6,
      currentSpots: 1,
    });
    if (ok) {
      soundEffects.success();
      setIsAddOpen(false);
      setTopic('');
    }
  };

  return (
    <motion.section
      id="study"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1.5 opacity-80 flex items-center flex-wrap">
            <span>თანაკლასელთა ჯგუფები &bull;&nbsp;</span>
            <span className="inline-flex items-end">
              <span>11/5</span>
              <span className="text-[8px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-[1px]">
                class
              </span>
            </span>
            <span className="ml-1">PLATFORM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
            ერთობლივი მეცადინეობის ჯგუფები
          </h2>
          <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
            შეუერთდით ღია სასწავლო ჯგუფებს ან შექმენით ახალი ჯგუფი შემაჯამებლისთვის მოსამზადებლად.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal('login');
              return;
            }
            setIsAddOpen((prev) => !prev);
          }}
          className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 self-start sm:self-end cursor-pointer"
        >
          {isAddOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          <span>ახალი ჯგუფის შექმნა</span>
        </button>
      </div>

      {isAddOpen && (
        <form
          onSubmit={handleCreatePod}
          className="p-4 rounded-2xl bg-[#141522]/90 border border-[#f5f2eb]/15 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="საგანი (მაგ. ფიზიკა)"
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="თემა (მაგ. შემაჯამებლის გარჩევა)"
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
          />
          <input
            type="text"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            placeholder="დრო (მაგ. ხუთშაბათი, 15:30)"
            className="bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="ადგილი (მაგ. ბიბლიოთეკა)"
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white"
            />
            <input
              type="number"
              min={2}
              max={25}
              value={maxSpots}
              onChange={(e) => setMaxSpots(Number(e.target.value))}
              className="w-20 bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 text-xs text-white"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#f5f2eb] text-[#0c0d12] text-xs font-bold cursor-pointer"
            >
              დამატება
            </button>
          </div>
        </form>
      )}

      {/* Clean Pods List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {pods.map((pod) => {
          const isJoined = Boolean(joinedMap[pod.id]);
          const spotsRemaining = Math.max(0, pod.maxSpots - pod.currentSpots);

          return (
            <div
              key={pod.id}
              className="border border-[#f5f2eb]/12 bg-[#141522]/80 backdrop-blur-2xl p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xl transition-all"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-[#a8a495] mb-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-medium">
                    {pod.subject}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#dedacb]">{pod.time}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteStudyPod(pod.id)}
                        className="text-rose-400 hover:text-rose-300 cursor-pointer"
                        title="ჯგუფის წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug">{pod.topic}</h3>
                <div className="text-xs text-[#b8b5a8] mt-2 font-mono">
                  ორგანიზატორი: {pod.host} &bull; {pod.location}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                <span className="font-mono text-[#dedacb]">
                  დარჩენილია {spotsRemaining} ადგილი
                </span>
                <button
                  onClick={() => handleToggleJoin(pod)}
                  className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isJoined
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-[#f5f2eb] hover:bg-white text-[#0c0d12] shadow-sm'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>შეუერთდით</span>
                    </>
                  ) : (
                    <span>შესვლა</span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
};
