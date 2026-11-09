import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  MessageSquare,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Lightbulb,
} from 'lucide-react';
import { IdeaItem } from '../data/campaignData';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';
import { CommentsThread } from './CommentsThread';

type CategoryFilter = 'all' | IdeaItem['category'];
type SortOrder = 'votes' | 'recent';

export const IdeaBoardSection: React.FC = () => {
  const {
    user,
    isAdmin,
    platform,
    addIdea,
    updateIdea,
    deleteIdea,
    upvoteIdea,
    openAuthModal,
  } = usePlatform();

  const ideas = platform.ideas;
  const [userVotes, setUserVotes] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<SortOrder>('votes');

  // New proposal modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<IdeaItem['category']>('სასკოლო რეფორმა');

  const handleVote = async (id: string) => {
    soundEffects.upvote();
    setUserVotes((prev) => ({ ...prev, [id]: !prev[id] }));
    await upvoteIdea(id);
  };

  const toggleComments = (id: string) => {
    soundEffects.click();
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    soundEffects.success();

    await addIdea({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      author: user ? user.fullName : 'მოსწავლე 11/5',
      timestamp: 'ახლახან',
    });

    setIsModalOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  const categories: { key: CategoryFilter; label: string }[] = [
    { key: 'all', label: 'ყველა' },
    { key: 'სასკოლო რეფორმა', label: 'სასკოლო რეფორმა' },
    { key: 'ინფრასტრუქტურა', label: 'ინფრასტრუქტურა' },
    { key: 'აქტივობები', label: 'აქტივობები' },
    { key: 'მოსწავლეთა უფლებები', label: 'უფლებები' },
  ];

  const filteredIdeas = useMemo(() => {
    let result = [...ideas];
    if (selectedCategory !== 'all') {
      result = result.filter((i) => i.category === selectedCategory);
    }
    if (sortBy === 'votes') {
      result.sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));
    } else {
      // recent order (original or reverse)
      result.reverse();
    }
    return result;
  }, [ideas, selectedCategory, sortBy]);

  return (
    <section id="ideas" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-indigo-500 dark:text-indigo-400">
              მოსწავლეთა თვითმმართველობა
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            იდეებისა და ინიციატივების დაფა
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-xl">
            გამოხატეთ თქვენი პოზიცია, შესთავაზეთ ცვლილებები და მიეცით ხმა კლასელების ინიციატივებს.
          </p>
        </div>

        <button
          onClick={() => {
            soundEffects.click();
            if (!user) {
              openAuthModal('login');
              return;
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 text-xs font-semibold py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all self-start sm:self-end shadow-sm hover:shadow"
        >
          <Plus className="w-4 h-4" />
          <span>ახალი იდეის დამატება</span>
        </button>
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  soundEffects.click();
                  setSelectedCategory(cat.key);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Sort Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setSortBy('votes')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              sortBy === 'votes'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>ხმებით</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('recent')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              sortBy === 'recent'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>ახლები</span>
          </button>
        </div>
      </div>

      {/* Ideas List */}
      <div className="space-y-3">
        {filteredIdeas.length === 0 ? (
          <div className="card-surface p-12 text-center rounded-2xl">
            <Lightbulb className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              არჩეულ კატეგორიაში იდეები ჯერ არ არის.
            </p>
          </div>
        ) : (
          filteredIdeas.map((idea) => {
            const hasVoted =
              Boolean(userVotes[idea.id]) ||
              Boolean(user && idea.upvotedBy?.includes(user.username));
            const isCommentsOpen = expandedId === idea.id;
            const ideaCommentsCount =
              platform.comments.filter((c) => c.targetType === 'idea' && c.targetId === idea.id)
                .length + (idea.comments?.length || 0);

            const isApproved = idea.statusLabel === 'დამტკიცებულია';

            return (
              <div
                key={idea.id}
                className="card-surface rounded-2xl overflow-hidden transition-all duration-200 card-hover"
              >
                <div className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4">
                  {/* Upvote Button */}
                  <button
                    onClick={() => handleVote(idea.id)}
                    aria-label={`ხმის მიცემა: ${idea.title} (ამჟამად ${idea.upvotes} ხმა)`}
                    className={`flex flex-col items-center justify-center min-w-[48px] py-2 px-1.5 rounded-xl border transition-all cursor-pointer ${
                      hasVoted
                        ? 'border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ChevronUp
                      className={`w-4 h-4 transition-transform ${hasVoted ? 'translate-y-[-1px]' : ''}`}
                    />
                    <span className="text-xs font-bold mt-0.5">{idea.upvotes}</span>
                  </button>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5 text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {idea.author}
                      </span>
                      <span className="text-slate-300 dark:text-slate-600">&bull;</span>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {idea.category}
                      </span>
                      <span
                        className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          isApproved
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                        }`}
                      >
                        {idea.statusLabel}
                      </span>

                      {isAdmin && (
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            type="button"
                            onClick={() =>
                              updateIdea(idea.id, {
                                statusLabel: isApproved ? 'განხილვაშია' : 'დამტკიცებულია',
                              })
                            }
                            className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:opacity-80"
                            title="სტატუსის შეცვლა"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>სტატუსი</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteIdea(idea.id)}
                            className="p-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-500/30 cursor-pointer"
                            title="იდეის წაშლა"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white leading-snug">
                      {idea.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {idea.content}
                    </p>

                    <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <button
                        onClick={() => toggleComments(idea.id)}
                        className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{ideaCommentsCount} კომენტარი</span>
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
                      className="px-4 pb-4 pt-3 border-t border-slate-100 dark:border-white/5 space-y-3 bg-slate-50/60 dark:bg-slate-900/30"
                    >
                      {idea.comments && idea.comments.length > 0 && (
                        <div className="space-y-2">
                          {idea.comments.map((c) => (
                            <div
                              key={c.id}
                              className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/5 text-xs space-y-0.5"
                            >
                              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {c.author} &bull; {c.timestamp}
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{c.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      <CommentsThread targetType="idea" targetId={idea.id} compact />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
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
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              role="dialog"
              aria-labelledby="new-idea-title"
              className="relative w-full max-w-md bg-white dark:bg-[#121422] border border-slate-200 dark:border-white/10 rounded-2xl p-6 z-10 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 id="new-idea-title" className="text-base font-bold text-slate-900 dark:text-white">
                  ახალი იდეის წარდგენა
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="დახურვა"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div>
                  <label
                    htmlFor="idea-title"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    სათაური
                  </label>
                  <input
                    id="idea-title"
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="მაგ. ბიბლიოთეკაში დამატებითი დამტენები"
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="idea-desc"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    დასაბუთება &amp; აღწერა
                  </label>
                  <textarea
                    id="idea-desc"
                    rows={3}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="მოკლედ აღწერეთ იდეის სარგებელი კლასელებისთვის..."
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label
                    htmlFor="idea-cat"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    კატეგორია
                  </label>
                  <select
                    id="idea-cat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as IdeaItem['category'])}
                    className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    გაუქმება
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-sm cursor-pointer"
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