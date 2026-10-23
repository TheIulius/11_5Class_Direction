import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, MessageSquare, Plus, X, Send } from 'lucide-react';
import { INITIAL_IDEAS, IdeaItem, IdeaComment } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';

export const IdeaBoardSection: React.FC = () => {
  const [ideas, setIdeas] = useState<IdeaItem[]>(INITIAL_IDEAS);
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // New proposal modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<IdeaItem['category']>('სასკოლო რეფორმა');

  const handleVote = (id: string) => {
    soundEffects.upvote();
    const hasVoted = Boolean(userVotes[id]);
    setUserVotes(prev => ({ ...prev, [id]: !hasVoted }));
    setIdeas(prev =>
      prev.map(idea =>
        idea.id === id
          ? { ...idea, upvotes: hasVoted ? idea.upvotes - 1 : idea.upvotes + 1 }
          : idea
      )
    );
  };

  const toggleComments = (id: string) => {
    soundEffects.click();
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleAddComment = (id: string) => {
    const text = commentInputs[id]?.trim();
    if (!text) return;
    soundEffects.upvote();

    const newComment: IdeaComment = {
      id: `c-${Date.now()}`,
      author: 'ანონიმი მოსწავლე',
      content: text,
      timestamp: 'ახლახან'
    };

    setIdeas(prev =>
      prev.map(idea =>
        idea.id === id
          ? {
              ...idea,
              commentsCount: idea.commentsCount + 1,
              comments: [newComment, ...idea.comments]
            }
          : idea
      )
    );

    setCommentInputs(prev => ({ ...prev, [id]: '' }));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    soundEffects.success();

    const created: IdeaItem = {
      id: `idea-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      author: 'მოსწავლე 11/5',
      timestamp: 'ახლახან',
      upvotes: 1,
      statusLabel: 'განხილვაშია',
      commentsCount: 0,
      comments: []
    };

    setIdeas([created, ...ideas]);
    setUserVotes(prev => ({ ...prev, [created.id]: true }));
    setIsModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <section id="ideas" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-mono uppercase text-[#e6e2d3] tracking-widest mb-1.5 opacity-80 flex items-center flex-wrap">
            <span>დემოკრატია &bull;&nbsp;</span>
            <span className="inline-flex items-end">
              <span>11/5</span>
              <span className="text-[8px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-[1px]">
                class
              </span>
            </span>
            <span className="ml-1">PLATFORM</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fcfbf7]">
            იდეებისა და ინიციატივების დაფა
          </h2>
          <p className="text-xs sm:text-sm text-[#b8b5a8] mt-1 max-w-xl">
            დააფიქსირეთ სასკოლო წესების ცვლილებები, მიეცით ხმა და დატოვეთ ანონიმური აზრი.
          </p>
        </div>

        <button
          onClick={() => {
            soundEffects.click();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs text-[#0c0d12] font-semibold py-2 px-3.5 rounded-xl bg-[#f5f2eb] hover:bg-white transition-all self-start sm:self-end cursor-pointer shadow-md"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>ახალი იდეის დამატება</span>
        </button>
      </div>

      {/* Ideas List */}
      <div className="space-y-3">
        {ideas.map(idea => {
          const hasVoted = Boolean(userVotes[idea.id]);
          const isCommentsOpen = expandedId === idea.id;

          return (
            <div
              key={idea.id}
              className="border border-[#f5f2eb]/12 bg-[#141522]/80 backdrop-blur-2xl rounded-2xl overflow-hidden transition-colors shadow-lg"
            >
              <div className="p-4 sm:p-5 flex items-start gap-4">
                {/* Upvote Button */}
                <button
                  onClick={() => handleVote(idea.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                    hasVoted
                      ? 'border-[#f5f2eb]/40 bg-[#f5f2eb]/20 text-[#fcfbf7]'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 text-[#a8a495] hover:text-white'
                  }`}
                >
                  <ChevronUp className="w-4 h-4" />
                  <span className="text-xs font-mono font-semibold">{idea.upvotes}</span>
                </button>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 text-xs">
                    <span className="font-mono text-[#a8a495]">{idea.author}</span>
                    <span className="text-zinc-600">&bull;</span>
                    <span className="font-mono text-[#b8b5a8] text-[11px]">{idea.category}</span>
                    <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#dedacb]">
                      {idea.statusLabel}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                    {idea.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#c5c1b2] mt-1.5 leading-relaxed">
                    {idea.content}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-[#a8a495]">
                    <button
                      onClick={() => toggleComments(idea.id)}
                      className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{idea.commentsCount} კომენტარი</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expandable Comments */}
              <AnimatePresence>
                {isCommentsOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-4 pb-4 pt-2 border-t border-white/5 space-y-3 bg-[#11121c]/60"
                  >
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[idea.id] || ''}
                        onChange={e =>
                          setCommentInputs({ ...commentInputs, [idea.id]: e.target.value })
                        }
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleAddComment(idea.id);
                        }}
                        placeholder="დატოვეთ ანონიმური აზრი..."
                        className="flex-1 bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40"
                      />
                      <button
                        onClick={() => handleAddComment(idea.id)}
                        className="px-3.5 py-2 rounded-xl bg-[#f5f2eb]/15 hover:bg-[#f5f2eb]/25 text-[#fcfbf7] text-xs font-medium cursor-pointer transition-colors"
                      >
                        გაგზავნა
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      {idea.comments.length === 0 ? (
                        <div className="text-xs text-[#78756c] italic">კომენტარები ჯერ არ არის.</div>
                      ) : (
                        idea.comments.map(c => (
                          <div
                            key={c.id}
                            className="p-2.5 rounded-xl bg-black/30 border border-white/5 text-xs text-[#dedacb] space-y-0.5"
                          >
                            <div className="text-[10px] font-mono text-[#a8a495]">{c.author} &bull; {c.timestamp}</div>
                            <p>{c.content}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Propose Idea Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-[#131420] border border-[#f5f2eb]/20 rounded-2xl p-6 z-10 text-[#f5f2eb] space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">ახალი იდეის წარდგენა</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#b8b5a8] mb-1">სათაური</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="მაგ. ბიბლიოთეკაში დამატებითი დამტენები"
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b8b5a8] mb-1">
                    დასაბუთება &amp; აღწერა
                  </label>
                  <textarea
                    rows={3}
                    value={newContent}
                    onChange={e => setNewContent(e.target.value)}
                    placeholder="მოკლედ აღწერეთ იდეის სარგებელი კლასელებისთვის..."
                    className="w-full bg-black/40 border border-[#f5f2eb]/15 rounded-xl p-3 text-xs text-white placeholder-[#78756c] focus:outline-none focus:border-[#f5f2eb]/40 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#b8b5a8] mb-1">კატეგორია</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full bg-[#181926] border border-[#f5f2eb]/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#f5f2eb]/40"
                  >
                    <option value="სასკოლო რეფორმა">სასკოლო რეფორმა</option>
                    <option value="ინფრასტრუქტურა">ინფრასტრუქტურა</option>
                    <option value="მოსწავლეთა უფლებები">მოსწავლეთა უფლებები</option>
                    <option value="აქტივობები">აქტივობები</option>
                  </select>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-[#b8b5a8] hover:text-white"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#f5f2eb] hover:bg-white text-xs font-semibold text-[#0c0d12]"
                  >
                    გაგზავნა
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
