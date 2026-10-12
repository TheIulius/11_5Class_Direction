import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Video, Check, Send, Sparkles, MessageCircle, GraduationCap } from 'lucide-react';
import { INITIAL_OPPORTUNITIES, OpportunityItem } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';

export const OpportunitiesSection: React.FC = () => {
  const [items, setItems] = useState<OpportunityItem[]>(INITIAL_OPPORTUNITIES);
  const [rsvpdMap, setRsvpdMap] = useState<Record<string, boolean>>({});
  const [questionInputs, setQuestionInputs] = useState<Record<string, string>>({});
  const [submittedQuestionMap, setSubmittedQuestionMap] = useState<Record<string, boolean>>({});

  const handleToggleRsvp = (id: string) => {
    soundEffects.success();
    const isCurrentlyRsvpd = Boolean(rsvpdMap[id]);
    setRsvpdMap(prev => ({ ...prev, [id]: !isCurrentlyRsvpd }));
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, rsvpCount: isCurrentlyRsvpd ? item.rsvpCount - 1 : item.rsvpCount + 1 }
          : item
      )
    );
  };

  const handleSendQuestion = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = questionInputs[id]?.trim();
    if (!text) return;

    soundEffects.success();
    setSubmittedQuestionMap(prev => ({ ...prev, [id]: true }));
    setQuestionInputs(prev => ({ ...prev, [id]: '' }));

    setTimeout(() => {
      setSubmittedQuestionMap(prev => ({ ...prev, [id]: false }));
    }, 3500);
  };

  return (
    <section id="opportunities" className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Section Header — Clear Emphasis on ZOOM, Experience Sharing & Open Q&A */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#141522]/85 border border-[#f5f2eb]/15 backdrop-blur-2xl space-y-3 shadow-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f5f2eb]/10 border border-[#f5f2eb]/20 text-[11px] font-mono font-semibold text-[#fcfbf7]">
          <Video className="w-3.5 h-3.5 text-[#fcfbf7]" />
          <span>ZOOM შეხვედრები &bull; LIVE Q&amp;A</span>
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

      {/* Concise Cards for Gvantsa & Luka */}
      <div className="grid grid-cols-1 gap-4 sm:gap-5">
        {items.map(item => {
          const isRsvpd = Boolean(rsvpdMap[item.id]);
          const questionSubmitted = Boolean(submittedQuestionMap[item.id]);

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-[#141522]/80 border border-[#f5f2eb]/15 backdrop-blur-2xl p-4 sm:p-6 space-y-4 shadow-2xl transition-all"
            >
              {/* Speaker Profile Header */}
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

                {/* RSVP Button */}
                <button
                  onClick={() => handleToggleRsvp(item.id)}
                  className={`w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
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
              </div>

              {/* Short Description & Key Highlights */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#1a1b2a]/60 border border-white/5 space-y-2.5">
                <p className="text-xs sm:text-sm text-[#fcfbf7] leading-relaxed">
                  {item.description}
                </p>

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
                  <form onSubmit={e => handleSendQuestion(item.id, e)} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={questionInputs[item.id] || ''}
                      onChange={e =>
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
            </div>
          );
        })}
      </div>
    </section>
  );
};
