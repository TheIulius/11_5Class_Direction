import React, { useState } from 'react';
import {
  Archive,
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Calendar,
  FolderOpen,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { QuizPrepSection } from './QuizPrepSection';
import { ResourceSection } from './ResourceSection';
import { CommentsThread } from './CommentsThread';

export const ArchiveSection: React.FC = () => {
  const { isAdmin, platform, addArchivePack, deleteArchivePack } = usePlatform();
  const [activePackId, setActivePackId] = useState<string | null>('arch_geo_romantizmi_quiz');
  const [showAddModal, setShowAddModal] = useState(false);

  // Admin New Archive Pack state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('ქართული');
  const [teacher, setTeacher] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('არქივის მოდული');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [keyTopics, setKeyTopics] = useState('');

  const selectedPack = platform.archivePacks.find((p) => p.id === activePackId) || null;

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
      keyTopics: keyTopics
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    if (ok) {
      setTitle('');
      setDescription('');
      setContent('');
      setLinkUrl('');
      setKeyTopics('');
      setShowAddModal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Archive Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-bold">
              <Archive className="w-3.5 h-3.5 text-amber-400" />
              <span>11/5 სასწავლო არქივი & ქვიზების ბიბლიოთეკა</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              არქივი — ქართულის ქვიზი & განვლილი მასალები
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              აქ ინახება ჩვენი კლასის ყველა ინტერაქტიული მოსამზადებელი მოდული (მათ შორის{' '}
              <strong className="text-white">ქართული რომანტიზმის სრული ქვიზი, პოდკასტები და ვიდეოები</strong>),
              განვლილი შემაჯამებლების კონსპექტები და სასწავლო რესურსები.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shrink-0 transition-all"
            >
              <Plus className="w-4 h-4" />
              არქივში მოდულის დამატება
            </button>
          )}
        </div>
      </div>

      {/* Archive Packs Selector Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-indigo-600" />
            არქივში შენახული მოდულები ({platform.archivePacks.length})
          </h3>
          {activePackId && (
            <button
              type="button"
              onClick={() => setActivePackId(null)}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              ყველა მოდულის სია
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {platform.archivePacks.map((pack) => {
            const isSelected = activePackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setActivePackId(pack.id)}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-indigo-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-600 text-white">
                        {pack.subject}
                      </span>
                      {pack.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          {pack.badge}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {pack.date}
                      </span>
                    </div>

                    {isAdmin && !pack.isBuiltInGeorgianQuiz && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('ნამდვილად გსურთ არქივის ამ მოდულის წაშლა?')) {
                            deleteArchivePack(pack.id);
                            if (activePackId === pack.id) {
                              setActivePackId('arch_geo_romantizmi_quiz');
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-slate-900">{pack.title}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{pack.description}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div className="flex flex-wrap gap-1">
                    {(pack.keyTopics || []).slice(0, 3).map((t, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-semibold text-slate-600"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-black text-indigo-600 flex items-center gap-1 shrink-0">
                    {isSelected ? 'გახსნილია' : 'გახსნა'}
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Archive Pack Viewer */}
      {selectedPack && (
        <div className="space-y-6 animate-fadeIn">
          {selectedPack.isBuiltInGeorgianQuiz ? (
            <div className="space-y-6">
              <QuizPrepSection />
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ResourceSection
                  targetType="archive"
                  targetId={selectedPack.id}
                  targetTitle={selectedPack.title}
                  defaultSubject="ქართული"
                  title="ქართულის ქვიზის დამატებითი კონსპექტები"
                />
                <CommentsThread
                  targetType="resource"
                  targetId={selectedPack.id}
                  title="კომენტარები ქართულის ქვიზზე"
                />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-700">
                      {selectedPack.subject}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">{selectedPack.date}</span>
                    {selectedPack.teacher && (
                      <span className="text-xs text-slate-500">• პედაგოგი: {selectedPack.teacher}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900">{selectedPack.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedPack.description}</p>
                </div>

                {selectedPack.linkUrl && (
                  <a
                    href={selectedPack.linkUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    გარე რესურსის გახსნა
                  </a>
                )}
              </div>

              {selectedPack.content && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedPack.content}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                <ResourceSection
                  targetType="archive"
                  targetId={selectedPack.id}
                  targetTitle={selectedPack.title}
                  defaultSubject={selectedPack.subject}
                />
                <CommentsThread targetType="resource" targetId={selectedPack.id} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* General Class Archive Shared Resources */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <ResourceSection
          targetType="general"
          targetTitle="საერთო სასწავლო ბიბლიოთეკა"
          defaultSubject="ზოგადი"
          title="საერთო სასწავლო მასალების & კონსპექტების საცავი"
        />
      </div>

      {/* Admin Add Archive Pack Modal */}
      {showAddModal && isAdmin && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                არქივში ახალი მოდულის / კონსპექტის დამატება
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePack} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">სათაური *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="მაგ: ფიზიკა — კინემატიკის შემაჯამებლის სრული კრებული"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">საგანი</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="ქართული">ქართული</option>
                    <option value="მათემატიკა">მათემატიკა</option>
                    <option value="ფიზიკა">ფიზიკა</option>
                    <option value="ინგლისური">ინგლისური</option>
                    <option value="ისტორია">ისტორია</option>
                    <option value="ქიმია">ქიმია</option>
                    <option value="ბიოლოგია">ბიოლოგია</option>
                    <option value="გეოგრაფია">გეოგრაფია</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">თარიღი</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">პედაგოგი</label>
                  <input
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="მაგ: თემურ კვარაცხელია"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ბეიჯი / ტიპი</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="მაგ: კონსპექტი & ტესტი"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">მოკლე აღწერა *</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="რას მოიცავს ეს არქივის მოდული?"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  სრული ტექსტი / კონსპექტი
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="ჩაწერეთ თეორია, ფორმულები ან კითხვები..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  გარე ბმული (სურვილისამებრ)
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  საკვანძო თემები (მძიმით გამოყოფილი)
                </label>
                <input
                  type="text"
                  value={keyTopics}
                  onChange={(e) => setKeyTopics(e.target.value)}
                  placeholder="მაგ: იმპულსის მუდმივობა, ენერგია, დრეკადი დაჯახება"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                >
                  გაუქმება
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  არქივში შენახვა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
