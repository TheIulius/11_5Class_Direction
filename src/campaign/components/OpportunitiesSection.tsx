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
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { CommentsThread } from './CommentsThread';

export const OpportunitiesSection: React.FC = () => {
  const {
    user,
    canModerate,
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
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);

  // Admin modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [speaker, setSpeaker] = useState('');
  const [university, setUniversity] = useState('');
  const [badge, setBadge] = useState('Zoom შეხვედრა');
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
      badge: badge.trim() || 'Zoom შეხვედრა',
      topic: description.trim(),
      description: description.trim(),
      date: date.trim() || 'უახლოეს კვირაში',
      time: time.trim() || '19:00',
      location: 'Zoom',
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
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            შესაძლებლობები
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Zoom შეხვედრები საზღვარგარეთ ჩაბარებულ ალუმნებთან და გამოცდილების გაზიარება.
          </p>
        </div>

        {canModerate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>შეხვედრის დამატება</span>
          </button>
        )}
      </div>

      {/* Speaker Cards */}
      <div className="space-y-4">
        {items.map((item) => {
          const isRsvpd =
            Boolean(rsvpdMap[item.id]) ||
            Boolean(user && item.rsvpUsers?.includes(user.username));
          const isDiscussionOpen = expandedDiscussionId === item.id;
          const questionSubmitted = Boolean(submittedQuestionMap[item.id]);

          return (
            <div
              key={item.id}
              className="card-surface p-5 sm:p-6 space-y-4 shadow-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20">
                      {item.badge}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {item.date} {item.time ? `• ${item.time}` : ''}
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                    {item.speaker}
                  </h2>

                  <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>{item.university}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Explicit RSVP Attendance Button */}
                  <button
                    onClick={() => handleToggleRsvp(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isRsvpd
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                    }`}
                  >
                    {isRsvpd ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>დარეგისტრირებული ხარ ({item.rsvpCount})</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-3.5 h-3.5" />
                        <span>დასწრების მონიშვნა ({item.rsvpCount})</span>
                      </>
                    )}
                  </button>

                  {canModerate && (
                    <button
                      onClick={() => deleteOpportunity(item.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-500"
                      title="წაშლა"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Topic Description & Highlights */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/5 space-y-2">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {item.description}
                </p>

                {item.commonAppDetails && item.commonAppDetails.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.commonAppDetails.map((detail, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white dark:bg-white/10 text-[11px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-white/10"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ask advance question form */}
              <div className="pt-1">
                {questionSubmitted ? (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span>თქვენი კითხვა გაიგზავნა შეხვედრისთვის!</span>
                  </div>
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
                      placeholder={`დასვით კითხვა წინასწარ (${item.speaker})...`}
                      className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Send className="w-3 h-3" />
                      <span>კითხვის გაგზავნა</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Discussions & Comments Accordion */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() =>
                    setExpandedDiscussionId(isDiscussionOpen ? null : item.id)
                  }
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center justify-between w-full cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>კომენტარები & განხილვა</span>
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${
                      isDiscussionOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDiscussionOpen && (
                  <div className="pt-3">
                    <CommentsThread targetType="opportunity" targetId={item.id} compact />
                  </div>
                )}
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 w-full max-w-md rounded-3xl bg-white dark:bg-[#141522] border border-slate-200/80 dark:border-white/10 p-6 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  შეხვედრის დამატება
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOpp} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    სპიკერი (სახელი და გვარი)
                  </label>
                  <input
                    type="text"
                    required
                    value={speaker}
                    onChange={(e) => setSpeaker(e.target.value)}
                    placeholder="მაგ. გვანცა ხვედელიძე"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    უნივერსიტეტი / მიმართულება
                  </label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Vanderbilt University"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      თარიღი
                    </label>
                    <input
                      type="text"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      placeholder="24 ოქტომბერი"
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      დრო
                    </label>
                    <input
                      type="text"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="19:00"
                      className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    აღწერა
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    თემები (მძიმით გამოყოფილი)
                  </label>
                  <input
                    type="text"
                    value={highlightsText}
                    onChange={(e) => setHighlightsText(e.target.value)}
                    placeholder="Common App, სრული დაფინანსება, ესეები"
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-3.5 py-2 text-xs text-slate-500"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
                  >
                    დამატება
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
