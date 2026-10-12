import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Check, Send, Sparkles, MessageCircle, BookOpen, GraduationCap } from 'lucide-react';
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
    <section id="opportunities" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Section Header */}
      <div>
        <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1.5 opacity-80">
          ალუმნების შეხვედრები &bull; 11/5 DIRECTION
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
          შესაძლებლობების ჰაბი
        </h2>
        <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1 max-w-2xl leading-relaxed">
          შეხვედრები მოწვეულ ალუმნებთან: საერთაშორისო უნივერსიტეტებში ჩაბარების გზა, Common App-ის განხილვა და ღია კითხვა-პასუხი.
        </p>
      </div>

      {/* Cards List for Gvantsa & Luka */}
      <div className="space-y-6">
        {items.map(item => {
          const isRsvpd = Boolean(rsvpdMap[item.id]);
          const questionSubmitted = Boolean(submittedQuestionMap[item.id]);

          return (
            <div
              key={item.id}
              className="rounded-3xl bg-[#141522]/80 border border-[#f5f2eb]/15 backdrop-blur-2xl p-5 sm:p-7 space-y-5 shadow-2xl transition-all"
            >
              {/* Speaker Profile Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#f5f2eb]/10 text-[#fcfbf7] border border-[#f5f2eb]/20">
                      {item.badge}
                    </span>
                    <span className="text-xs font-mono text-[#b8b5a8]">
                      {item.date} &bull; {item.time}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-[#fcfbf7] flex items-center gap-2">
                    <span>{item.speaker}</span>
                  </h3>

                  <div className="text-xs sm:text-sm text-[#e6e2d3] font-medium flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#dedacb]" />
                    <span>{item.university}</span>
                  </div>
                </div>

                {/* RSVP Button */}
                <button
                  onClick={() => handleToggleRsvp(item.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 self-start sm:self-auto ${
                    isRsvpd
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-[#f5f2eb] hover:bg-white text-[#0c0d12] shadow-md'
                  }`}
                >
                  {isRsvpd ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>დარეგისტრირებული ხართ ({item.rsvpCount})</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-3.5 h-3.5" />
                      <span>Zoom-ზე რეგისტრაცია ({item.rsvpCount})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Topic & Description */}
              <div className="p-4 rounded-2xl bg-[#1a1b2a]/60 border border-white/5 space-y-2">
                <div className="text-sm font-semibold text-white">
                  {item.topic}
                </div>
                <p className="text-xs sm:text-sm text-[#d4d1c5] leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Common App & Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Common App Coverage */}
                <div className="p-4 rounded-2xl bg-[#171826]/70 border border-[#f5f2eb]/10 space-y-2">
                  <h4 className="font-semibold text-[#fcfbf7] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <BookOpen className="w-3.5 h-3.5 text-[#e6e2d3]" />
                    <span>რას განვიხილავთ Common App-ში:</span>
                  </h4>
                  <ul className="space-y-1.5 text-[#dedacb]">
                    {item.commonAppDetails.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">&bull;</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Practical Advice */}
                <div className="p-4 rounded-2xl bg-[#171826]/70 border border-[#f5f2eb]/10 space-y-2">
                  <h4 className="font-semibold text-[#fcfbf7] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#e6e2d3]" />
                    <span>მთავარი რჩევები და მიგნებები:</span>
                  </h4>
                  <ul className="space-y-1.5 text-[#dedacb]">
                    {item.keyAdvice.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5">&bull;</span>
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Open Question Submission Form */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-xs font-semibold text-[#dedacb] mb-2 flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-[#e6e2d3]" />
                  <span>კითხვების დასმა ღიად შესაძლებელია:</span>
                </div>

                {questionSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>მადლობა! თქვენი შეკითხვა გადაეცა სპიკერს და შეხვედრაზე განიხილება.</span>
                  </motion.div>
                ) : (
                  <form onSubmit={e => handleSendQuestion(item.id, e)} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={questionInputs[item.id] || ''}
                      onChange={e =>
                        setQuestionInputs({ ...questionInputs, [item.id]: e.target.value })
                      }
                      placeholder={`დაუსვით შეკითხვა ${item.speaker}-ს (მაგ. ესეების სტრატეგიაზე, ინტერვიუზე...)`}
                      className="flex-1 bg-[#0f1019]/80 border border-[#f5f2eb]/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-[#f5f2eb]/10 hover:bg-[#f5f2eb]/20 text-[#fcfbf7] font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-[#f5f2eb]/20"
                    >
                      <Send className="w-3 h-3" />
                      <span>გაგზავნა</span>
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
