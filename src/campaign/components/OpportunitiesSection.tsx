import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Check,
  Send,
  Sparkles,
  MessageCircle,
  GraduationCap,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { CommentsThread } from './CommentsThread';

export const OpportunitiesSection: React.FC = () => {
  const {
    user,
    isAdmin,
    platform,
    addOpportunity,
    deleteOpportunity,
    rsvpOpportunity,
    askOpportunityQuestion,
  } = usePlatform();

  const items = platform.opportunities;
  const [rsvpdMap, setRsvpdMap] = useState<Record<string, boolean>>({});
  const [questionInputs, setQuestionInputs] = useState<Record<string, string>>({});
  const [submittedQuestionMap, setSubmittedQuestionMap] = useState<Record<string, boolean>>({});

  // Admin modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [university, setUniversity] = useState('');
  const [badge, setBadge] = useState('ZOOM • LIVE Q&A');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('19:00');
  const [description, setDescription] = useState('');
  const [highlightsText, setHighlightsText] = useState('');

  const handleToggleRsvp = async (id: string) => {
    soundEffects.success();
    setRsvpdMap((prev) => ({ ...prev, [id]: !prev[id] }));
    await rsvpOpportunity(id);
  };

  const handleSendQuestion = async (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = questionInputs[id]?.trim();
    if (!text) return;

    soundEffects.success();
    await askOpportunityQuestion(id, text);
    setSubmittedQuestionMap((prev) => ({ ...prev, [id]: true }));
    setQuestionInputs((prev) => ({ ...prev, [id]: '' }));

    setTimeout(() => {
      setSubmittedQuestionMap((prev) => ({ ...prev, [id]: false }));
    }, 3500);
  };

  const handleCreateOpp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speaker.trim() || !university.trim()) return;
    const ok = await addOpportunity({
      speaker: speaker.trim(),
      university: university.trim(),
      badge: badge.trim() || 'ZOOM • LIVE Q&A',
      topic: description.trim(),
      description: description.trim(),
      date: date.trim() || 'უახლოეს კვირაში',
      time: time.trim() || '19:00',
      location: 'Zoom (ბმული დაიდება შეხვედრის წინ)',
      commonAppDetails: highlightsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      keyAdvice: [],
      rsvpCount: 1,
    });
    if (ok) {
      soundEffects.success();
      setIsAddModalOpen(false);
      setSpeaker('');
      setUniversity('');
      setDescription('');
      setHighlightsText('');
    }
  };

  return (
    <section id="opportunities" className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Section Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#141522]/85 border border-[#f5f2eb]/15 backdrop-blur-2xl space-y-3 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f2eb]/10 border border-[#f5f2eb]/20 text-[11px] font-mono font-semibold text-[#fcfbf7]">
            <Video className="w-3.5 h-3.5 text-[#fcfbf7]" />
            <span>ZOOM შეხვედრები &bull; LIVE Q&amp;A</span>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ სპიკერის / შეხვედრის დამატება (Admin)</span>
            </button>
          )}
        </div>

        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7] leading-snug">
          ZOOM შეხვედრები საზღვარგარეთ ჩაბარებულ წარმატებულ სტუდენტებთან
        </h2>

        <p className="text-xs sm:text-sm text-[#d4d1c5] leading-relaxed">
          პირადი გამოცდილების გაზიარება, ჩაბარების გზა და კითხვების ღიად დასმა პირდაპირ ეთერში.
        </p>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="px-3 py-1 rounded-xl bg-[#191b29]/80 border border-[#f5f2eb]/12 text-[11px] font-medium text-[#fcfbf7] flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-[#dedacb]" />
            <span>პირდაპირი Zoom შეხვედრა</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-[#191b29]/80 border border-[#f5f2eb]/12 text-[11px] font-medium text-[#fcfbf7] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#dedacb]" />
            <span>გამოცდილების გაზიარება</span>
          </span>
          <span className="px-3 py-1 rounded-xl bg-[#191b29]/80 border border-[#f5f2eb]/12 text-[11px] font-medium text-[#fcfbf7] flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-[#dedacb]" />
            <span>კითხვების ღიად დასმა</span>
          </span>
        </div>
      </div>

      {/* Speaker Cards */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {items.map((item) => {
          const isRsvpd =
            Boolean(rsvpdMap[item.id]) ||
            Boolean(user && item.rsvpUsers?.includes(user.username));
          const questionSubmitted = Boolean(submittedQuestionMap[item.id]);

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-[#141522]/80 border border-[#f5f2eb]/15 backdrop-blur-2xl p-4 sm:p-6 space-y-4 shadow-2xl transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#f5f2eb] text-[#0c0d12] flex items-center gap-1">
                      <Video className="w-3 h-3" />
                      <span>{item.badge}</span>
                    </span>
                    <span className="text-xs font-mono text-[#b8b5a8]">
                      {item.date} &bull; {item.time}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-[#fcfbf7] pt-0.5">
                    {item.speaker}
                  </h3>

                  <div className="text-xs sm:text-sm text-[#e6e2d3] font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#dedacb] shrink-0" />
                    <span>{item.university}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    onClick={() => handleToggleRsvp(item.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isRsvpd
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#f5f2eb] hover:bg-white text-[#0c0d12] shadow-md'
                    }`}
                  >
                    {isRsvpd ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>დარეგისტრირებული ({item.rsvpCount})</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        <span>Zoom-ზე დასწრება ({item.rsvpCount})</span>
                      </>
                    )}
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteOpportunity(item.id)}
                      className="p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 border border-rose-500/25 cursor-pointer"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1a1b2a]/60 border border-white/5 space-y-2.5">
                <p className="text-xs sm:text-sm text-[#fcfbf7] leading-relaxed">
                  {item.description}
                </p>

                {item.commonAppDetails && item.commonAppDetails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {item.commonAppDetails.map((detail, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-[#12131d]/70 border border-[#f5f2eb]/10 text-[11px] text-[#dedacb] font-medium"
                      >
                        &bull; {detail}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Open Question Submission Form */}
              <div className="pt-1">
                {questionSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>თქვენი კითხვა გაიგზავნა Zoom შეხვედრისთვის!</span>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={(e) => handleSendQuestion(item.id, e)}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={questionInputs[item.id] || ''}
                      onChange={(e) =>
                        setQuestionInputs({ ...questionInputs, [item.id]: e.target.value })
                      }
                      placeholder={`დაუსვით კითხვა წინასწარ (${item.speaker})...`}
                      className="flex-1 bg-[#0f1019]/80 border border-[#f5f2eb]/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#181928] hover:bg-[#222438] text-[#fcfbf7] font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-[#f5f2eb]/20 shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>კითხვის დასმა</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Universal Comments Thread */}
              <div className="pt-2 border-t border-white/10">
                <CommentsThread
                  targetType="opportunity"
                  targetId={item.id}
                  title="კომენტარები & დისკუსია"
                  compact
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Add Opportunity Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-2xl bg-[#141522] border border-[#f5f2eb]/20 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">ახალი Zoom შეხვედრის დამატება</h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateOpp} className="space-y-3">
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">სპიკერი (სახელი და გვარი)</label>
                  <input
                    type="text"
                    required
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="მაგ. გვანცა ხვედელიძე"
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">უნივერსიტეტი / პროგრამა</label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="მაგ. Vanderbilt University ('30)"
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs text-[#b8b5a8] mb-1">თარიღი</label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="მაგ. 24 ოქტომბერი"
                      className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#b8b5a8] mb-1">დრო</label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="19:00"
                      className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">აღწერა</label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="შეხვედრის თემა და დეტალები..."
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl p-3 text-xs text-white resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#b8b5a8] mb-1">
                    საკვანძო თემები (მძიმით გამოყოფილი)
                  </label>
                  <input
                    type="text"
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="Common App, სრული დაფინანსება, ესეები"
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs text-[#b8b5a8]"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f5f2eb] text-[#0c0d12] text-xs font-bold cursor-pointer"
                  >
                    დამატება
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
