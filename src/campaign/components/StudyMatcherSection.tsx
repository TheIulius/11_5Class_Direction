import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Check } from 'lucide-react';
import { INITIAL_STUDY_PODS, StudyPod } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';

export const StudyMatcherSection: React.FC = () => {
  const [pods, setPods] = useState<StudyPod[]>(INITIAL_STUDY_PODS);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});

  const handleToggleJoin = (pod: StudyPod) => {
    soundEffects.success();
    const isJoined = Boolean(joinedMap[pod.id]);
    setJoinedMap(prev => ({ ...prev, [pod.id]: !isJoined }));
    setPods(prev =>
      prev.map(p =>
        p.id === pod.id
          ? { ...p, currentSpots: isJoined ? p.currentSpots - 1 : p.currentSpots + 1 }
          : p
      )
    );
  };

  return (
    <motion.section
      id="study"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6"
    >
      {/* Section Header */}
      <div>
        <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1.5 opacity-80">
          თანაკლასელთა ჯგუფები &bull; 11/5 DIRECTION
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
          ერთობლივი მეცადინეობის ჯგუფები
        </h2>
        <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1">
          შეუერთდით ღია სასწავლო ჯგუფებს ერთი დაწკაპუნებით და მოემზადეთ გამოცდებისთვის ერთად.
        </p>
      </div>

      {/* Clean Pods List with Multi-Shade Frosted Glass */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {pods.map(pod => {
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
                  <span className="text-[#dedacb]">{pod.time}</span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-snug">
                  {pod.topic}
                </h3>
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
