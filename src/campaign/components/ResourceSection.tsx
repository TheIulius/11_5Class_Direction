import React, { useState } from 'react';
import {
  FileText,
  Upload,
  ExternalLink,
  ThumbsUp,
  CheckCircle2,
  Clock,
  Trash2,
  Plus,
  Download,
  Sparkles,
  X,
} from 'lucide-react';
import { usePlatform, PlatformResource } from '../context/PlatformContext';

interface ResourceSectionProps {
  targetType: 'event' | 'homework' | 'archive' | 'general';
  targetId?: string;
  targetTitle?: string;
  defaultSubject?: string;
  title?: string;
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({
  targetType,
  targetId,
  targetTitle,
  defaultSubject = 'მათემატიკა',
  title = 'მიმაგრებული კონსპექტები & სასწავლო მასალები',
}) => {
  const {
    user,
    isAdmin,
    platform,
    submitResource,
    moderateResource,
    deleteResource,
    upvoteResource,
    openAuthModal,
  } = usePlatform();

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resContent, setResContent] = useState('');
  const [resLink, setResLink] = useState('');
  const [resType, setResType] = useState<PlatformResource['resourceType']>('კონსპექტი');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentDataUrl, setAttachmentDataUrl] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);

  // Filter resources matching this target
  const matchingResources = platform.resources.filter((r) => {
    if (targetId) {
      if (r.targetId !== targetId) return false;
    } else if (r.targetType !== targetType) {
      return false;
    }
    // Public sees approved resources; admins and the author also see pending resources
    if (r.status === 'approved') return true;
    if (r.status === 'pending' && (isAdmin || (user && user.id === r.authorId))) return true;
    return false;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      window.alert('ფაილის ზომა არ უნდა აღემატებოდეს 4 MB-ს (ან ჩასვით Google Drive ბმული).');
      return;
    }
    setAttachmentName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAttachmentDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resDesc.trim()) return;

    const result = await submitResource({
      title: resTitle.trim(),
      description: resDesc.trim(),
      content: resContent.trim() || undefined,
      linkUrl: resLink.trim() || undefined,
      attachmentName: attachmentName || undefined,
      attachmentDataUrl: attachmentDataUrl || undefined,
      resourceType: resType,
      subject: defaultSubject,
      targetType,
      targetId,
      targetTitle,
    });

    if (result.success) {
      setResTitle('');
      setResDesc('');
      setResContent('');
      setResLink('');
      setAttachmentName('');
      setAttachmentDataUrl('');
      setShowUploadForm(false);
      setFeedbackMsg(
        result.isPending
          ? 'მასალა გაიგზავნა! ადმინისტრატორის დადასტურებისთანავე გამოჩნდება ყველასთვის.'
          : 'მასალა წარმატებით დაემატა და გამოქვეყნდა!'
      );
      setTimeout(() => setFeedbackMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-[var(--primary-action)]" />
          {title} ({matchingResources.length})
        </h4>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal('login');
              return;
            }
            setShowUploadForm((prev) => !prev);
          }}
          className="min-h-[44px] px-3.5 py-2 rounded-xl card-third hover:opacity-90 text-[var(--primary-action)] text-xs font-bold flex items-center gap-1.5 border border-[var(--border-subtle)] transition-opacity cursor-pointer"
        >
          {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUploadForm ? 'დახურვა' : 'კონსპექტის / მასალის ატვირთვა'}
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && user && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl card-third border border-[var(--border-subtle)] space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[var(--primary-action)]" />
              ახალი სასწავლო მასალის / კონსპექტის დამატება
            </span>
            {!isAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                გამოქვეყნდება ადმინის დადასტურების შემდეგ
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                სათაური *
              </label>
              <input
                type="text"
                required
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="მაგ: ტრიგონომეტრიის ფორმულების კონსპექტი"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                მასალის ტიპი
              </label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-action)] min-h-[44px]"
              >
                <option value="კონსპექტი">კონსპექტი</option>
                <option value="დავალების ამოხსნა">დავალების ამოხსნა</option>
                <option value="ტესტი/მასალა">ტესტი / სავარჯიშო</option>
                <option value="პრეზენტაცია">პრეზენტაცია</option>
                <option value="ბმული">სასარგებლო ბმული</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              მოკლე აღწერა *
            </label>
            <input
              type="text"
              required
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              placeholder="რა საკითხებს მოიცავს ეს მასალა?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              კონსპექტის ტექსტი / ფორმულები (სურვილისამებრ)
            </label>
            <textarea
              rows={4}
              value={resContent}
              onChange={(e) => setResContent(e.target.value)}
              placeholder="ჩაწერეთ კონსპექტი, საკვანძო თეზისები ან ამოხსნა პირდაპირ აქ..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                გარე ბმული (Google Docs, Drive, PDF, YouTube)
              </label>
              <input
                type="url"
                value={resLink}
                onChange={(e) => setResLink(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                ფაილის მიმაგრება (PDF, ფოტო, Word — მაქს. 4MB)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="w-full text-xs text-[var(--text-muted)] file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:btn-primary file:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="min-h-[44px] px-4 py-2 rounded-xl card-surface border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-bold hover:text-[var(--text-primary)] cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {isAdmin ? 'ატვირთვა და გამოქვეყნება' : 'ატვირთვა (ადმინთან გაგზავნა)'}
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {matchingResources.length === 0 ? (
        <div className="p-3.5 rounded-2xl card-third border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between gap-2">
          <span>ამ აქტივობაზე კონსპექტი ჯერ არ არის ატვირთული.</span>
          {!user && (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-[var(--primary-action)] font-bold hover:underline shrink-0 cursor-pointer"
            >
              ატვირთე პირველმა →
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {matchingResources.map((r) => {
            const isExpanded = expandedResId === r.id;
            const canDelete = isAdmin || (user && user.id === r.authorId);
            return (
              <div
                key={r.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  r.status === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'card-surface border-[var(--border-subtle)] hover:border-[var(--primary-action)]/30 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--primary-action-light)] text-[var(--primary-action)] text-[10px] font-black border border-[var(--primary-action)]/20">
                        {r.resourceType}
                      </span>
                      {r.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ელოდება ადმინის დადასტურებას
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--text-muted)]">
                        • ავტორი: <strong className="text-[var(--text-secondary)]">{r.authorName}</strong>
                      </span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">{r.title}</h5>
                    <p className="text-xs text-[var(--text-secondary)]">{r.description}</p>

                    {/* Action Links */}
                    <div className="flex flex-wrap items-center gap-3 pt-1.5">
                      {r.content && (
                        <button
                          type="button"
                          onClick={() => setExpandedResId(isExpanded ? null : r.id)}
                          className="text-xs font-bold text-[var(--primary-action)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isExpanded ? 'კონსპექტის დამალვა' : 'კონსპექტის წაკითხვა'}
                        </button>
                      )}
                      {r.linkUrl && (
                        <a
                          href={r.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-[var(--primary-action)] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          ბმულზე გადასვლა
                        </a>
                      )}
                      {r.attachmentDataUrl && (
                        <a
                          href={r.attachmentDataUrl}
                          download={r.attachmentName || 'masala'}
                          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {r.attachmentName || 'ფაილის ჩამოტვირთვა'}
                        </a>
                      )}
                    </div>

                    {isExpanded && r.content && (
                      <div className="mt-2.5 p-3.5 rounded-xl card-third border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                        {r.content}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.status === 'pending' && isAdmin && (
                      <button
                        type="button"
                        onClick={() => moderateResource(r.id, 'approved')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        დადასტურება
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => upvoteResource(r.id)}
                      className="px-2.5 py-1.5 rounded-xl card-third hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--primary-action)] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{r.upvotes || 0}</span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteResource(r.id)}
                        title="წაშლა"
                        aria-label="წაშლა"
                        className="p-2 rounded-xl card-third hover:bg-rose-500/10 text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
