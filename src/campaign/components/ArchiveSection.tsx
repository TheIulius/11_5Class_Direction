import React, { useState, useMemo } from 'react';
import {
  FolderOpen,
  BookOpen,
  ArrowLeft,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  Search,
  Sparkles,
  Calendar,
  X,
  FileText
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { QuizPrepSection } from './QuizPrepSection';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';
import { SubjectAutocomplete } from './SubjectAutocomplete';

export const ArchiveSection: React.FC = () => {
  const { isAdmin, platform, addArchivePack, deleteArchivePack } = usePlatform();
  const [activePackId, setActivePackId] = useState<string | null>(null); // Default to library view for clean entry
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New archive pack form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('ქართული');
  const [teacher, setTeacher] = useState('');
  const [date, setDate] = useState('2026-10-15');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('სასწავლო მოდული');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

  const selectedPack = platform.archivePacks.find((p) => p.id === activePackId) || null;

  const filteredPacks = useMemo(() => {
    if (!searchQuery.trim()) return platform.archivePacks;
    const q = searchQuery.toLowerCase();
    return platform.archivePacks.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.subject.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [platform.archivePacks, searchQuery]);

  const handleCreatePack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const ok = await addArchivePack({
      title: title.trim(),
      subject,
      teacher: teacher.trim() || undefined,
      date,
      description: description.trim(),
      badge: badge.trim() || 'არქივის მასალა',
      content: content.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      keyTopics: [],
    });
    if (ok) {
      setTitle('');
      setDescription('');
      setContent('');
      setLinkUrl('');
      setShowAddModal(false);
    }
  };

  // =========================================================================
  // STATE 1: ACTIVE STUDY MODULE VIEW
  // =========================================================================
  if (selectedPack) {
    if (selectedPack.isBuiltInGeorgianQuiz) {
      return (
        <div className="space-y-4">
          <div className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-4 flex items-center justify-between gap-3">
            <button
              onClick={() => setActivePackId(null)}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl card-third text-xs font-bold text-[var(--primary-action)] hover:opacity-90 cursor-pointer transition-opacity"
              aria-label="მასალებზე დაბრუნება"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>მასალები</span>
            </button>
            <div className="text-right">
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] block">
                {selectedPack.title}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] block">
                ინტერაქტიული მოდული
              </span>
            </div>
          </div>
          <QuizPrepSection onBack={() => setActivePackId(null)} />
        </div>
      );
    }

    // Generic Archive Pack Viewer
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <button
          onClick={() => setActivePackId(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--primary-action)] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ყველა მასალაზე დაბრუნება</span>
        </button>

        <div className="card-surface p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold btn-primary">
              {selectedPack.subject}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{selectedPack.date}</span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
            {selectedPack.title}
          </h1>

          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            {selectedPack.description}
          </p>

          {selectedPack.content && (
            <div className="pt-2">
              <div className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] font-sans">
                {selectedPack.content}
              </div>
            </div>
          )}

          {selectedPack.linkUrl && (
            <div className="pt-2">
              <a
                href={selectedPack.linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl btn-primary text-xs font-semibold transition-colors"
              >
                <span>გახსნა ბმულით</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200/70 dark:border-white/10 space-y-6">
            <ResourceSection targetType="archive" targetId={selectedPack.id} />
            <CommentsThread targetType="archive" targetId={selectedPack.id} />
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STATE 2: LIBRARY OVERVIEW (Concise Module Cards & Search)
  // =========================================================================
  return (
    <div className="max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            სასწავლო მასალები
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            ქართული რომანტიზმი, განვლილი შემაჯამებლების კონსპექტები და არქივი.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-1.5 rounded-xl btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>მოდულის დამატება (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input (16px to prevent iOS auto-zoom, min 44px touch target) */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="მოძებნეთ მასალა სათაურით ან საგნით..."
          aria-label="სასწავლო მასალების ძიება"
          className="w-full card-surface border border-[var(--border-subtle)] rounded-2xl pl-10 pr-11 py-3 text-base sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] transition-colors shadow-xs min-h-[48px]"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer rounded-full"
            aria-label="ძიების გასუფთავება"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Module Cards Grid or No-Results Empty State */}
      {filteredPacks.length === 0 ? (
        <div className="card-surface p-8 rounded-2xl text-center space-y-3 border border-dashed border-[var(--border-subtle)]">
          <div className="w-11 h-11 rounded-2xl card-third text-[var(--text-muted)] flex items-center justify-center mx-auto">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              მასალა ვერ მოიძებნა
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              საძიებო მოთხოვნით „{searchQuery}“ არცერთი სასწავლო მასალა არ მოიძებნა.
            </p>
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="min-h-[44px] px-4 py-2 rounded-xl btn-primary text-xs font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            ძიების გასუფთავება
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {filteredPacks.map((pack) => {
            return (
              <div
                key={pack.id}
                onClick={() => setActivePackId(pack.id)}
                className="card-surface card-hover p-4 sm:p-6 flex flex-col justify-between gap-3.5 sm:gap-4 cursor-pointer text-left group rounded-2xl border border-[var(--border-subtle)] shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-[var(--primary-action-light)] text-[var(--primary-action)] border border-[var(--primary-action)]/20">
                      {pack.subject}
                    </span>
                    {pack.badge && (
                      <span className="text-[11px] font-medium text-[var(--text-muted)]">
                        {pack.badge}
                      </span>
                    )}
                  </div>

                  <h2 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--primary-action)] transition-colors leading-snug">
                    {pack.title}
                  </h2>

                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                    {pack.description}
                  </p>

                  {pack.isBuiltInGeorgianQuiz && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        ქვიზი &bull; 30+ ტესტი
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                        AI კითხვები
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                        პოდკასტი &amp; ვიდეო
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        ფლეშ-ბარათები
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] text-xs">
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {pack.teacher ? `მასწავლებელი: ${pack.teacher}` : pack.date}
                  </span>

                  <div className="flex items-center gap-2">
                    {isAdmin && !pack.isBuiltInGeorgianQuiz && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteArchivePack(pack.id);
                        }}
                        className="w-9 h-9 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                        title="წაშლა"
                        aria-label="მასალის წაშლა"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="font-semibold text-[var(--primary-action)] flex items-center gap-1">
                      <span>გახსნა</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141522] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                ახალი სასწავლო მოდულის დამატება
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">სათაური</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="მაგ. ფიზიკის შემაჯამებლის კონსპექტი"
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">საგანი</label>
                  <SubjectAutocomplete
                    required
                    value={subject}
                    onChange={setSubject}
                    onSelectTeacher={setTeacher}
                    currentTeacher={teacher}
                    placeholder="ქართული"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">მასწავლებელი</label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">აღწერა</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl p-3 text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">ბმული (Drive / PDF)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 text-xs text-slate-500"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl btn-primary text-xs font-bold"
                >
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
