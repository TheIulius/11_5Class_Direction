import React, { useState, useId } from 'react';
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
  Image as ImageIcon,
  Paperclip,
} from 'lucide-react';
import { usePlatform, PlatformResource, ResourceAttachment } from '../context/PlatformContext';

interface ResourceSectionProps {
  targetType: 'event' | 'homework' | 'archive' | 'general';
  targetId?: string;
  targetTitle?: string;
  defaultSubject?: string;
  title?: string;
}

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getResourceAttachments = (r: PlatformResource): ResourceAttachment[] => {
  if (Array.isArray(r.attachments) && r.attachments.length > 0) {
    return r.attachments;
  }
  if (r.attachmentDataUrl) {
    return [
      {
        name: r.attachmentName || 'ფაილი',
        dataUrl: r.attachmentDataUrl,
      },
    ];
  }
  return [];
};

export const ResourceSection: React.FC<ResourceSectionProps> = ({
  targetType,
  targetId,
  targetTitle,
  defaultSubject = 'მათემატიკა',
  title = 'მიმაგრებული კონსპექტები & სასწავლო მასალები',
}) => {
  const {
    user,
    canModerate,
    platform,
    submitResource,
    moderateResource,
    deleteResource,
    upvoteResource,
    openAuthModal,
  } = usePlatform();

  const fileInputId = useId();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resContent, setResContent] = useState('');
  const [resLink, setResLink] = useState('');
  const [resType, setResType] = useState<PlatformResource['resourceType']>('კონსპექტი');
  const [attachments, setAttachments] = useState<ResourceAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<ResourceAttachment | null>(null);

  // Filter resources matching this target
  const matchingResources = platform.resources.filter((r) => {
    if (targetId) {
      if (r.targetId !== targetId) return false;
    } else if (r.targetType !== targetType) {
      return false;
    }
    // Public sees approved resources; admins, moderators and the author also see pending resources
    if (r.status === 'approved') return true;
    if (r.status === 'pending' && (canModerate || (user && user.id === r.authorId))) return true;
    return false;
  });

  const readFileAsDataUrl = (file: File): Promise<ResourceAttachment> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve({
            name: file.name,
            dataUrl: reader.result,
            size: file.size,
            mimeType: file.type || undefined,
          });
        } else {
          reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));
        }
      };
      reader.onerror = () => reject(new Error('ფაილის წაკითხვა ვერ მოხერხდა'));
      reader.readAsDataURL(file);
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setFileError(null);

    const selectedFiles = Array.from(fileList);
    const MAX_PER_FILE = 10 * 1024 * 1024; // 10 MB per file
    const MAX_TOTAL = 30 * 1024 * 1024; // 30 MB total

    const oversized = selectedFiles.find((f) => f.size > MAX_PER_FILE);
    if (oversized) {
      setFileError(`ფაილი „${oversized.name}“ აღემატება 10 MB-ს. გთხოვთ ატვირთოთ უფრო მცირე ფაილი ან ჩასვათ Google Drive ბმული.`);
      e.target.value = '';
      return;
    }

    const currentTotal = attachments.reduce((sum, a) => sum + (a.size || 0), 0);
    const newTotal = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL) {
      setFileError('მიმაგრებული ფაილების ჯამური მოცულობა არ უნდა აღემატებოდეს 30 MB-ს.');
      e.target.value = '';
      return;
    }

    try {
      const loaded = await Promise.all(selectedFiles.map(readFileAsDataUrl));
      setAttachments((prev) => {
        const merged = [...prev];
        for (const item of loaded) {
          const exists = merged.some((p) => p.name === item.name && p.size === item.size);
          if (!exists) merged.push(item);
        }
        return merged;
      });
    } catch {
      setFileError('ზოგიერთი ფაილის წაკითხვა ვერ მოხერხდა.');
    } finally {
      // Reset input value so selecting the same or additional files triggers onChange again
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resTitle.trim() || !resDesc.trim()) return;

    const firstAtt = attachments[0];
    const result = await submitResource({
      title: resTitle.trim(),
      description: resDesc.trim(),
      content: resContent.trim() || undefined,
      linkUrl: resLink.trim() || undefined,
      attachmentName: firstAtt?.name || undefined,
      attachmentDataUrl: firstAtt?.dataUrl || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
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
      setAttachments([]);
      setFileError(null);
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
            {!canModerate && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                გამოქვეყნდება დადასტურების შემდეგ
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                გარე ბმული (Google Docs, Drive, PDF, YouTube)
              </label>
              <input
                type="url"
                value={resLink}
                onChange={(e) => setResLink(e.target.value)}
                placeholder="https://docs.google.com/..."
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
              />
            </div>
            <div>
              <label
                htmlFor={fileInputId}
                className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1"
              >
                ფაილების მიმაგრება (შეგიძლიათ აირჩიოთ ბევრი ფოტო, PDF, Word — თითო მაქს. 10MB)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  id={fileInputId}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                  onChange={handleFileChange}
                  className="sr-only peer"
                />
                <label
                  htmlFor={fileInputId}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer select-none peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--primary-action)] peer-focus-visible:outline-offset-2"
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {attachments.length === 0
                      ? 'ფაილების არჩევა (რამდენიმე ერთად)'
                      : `+ კიდევ ფაილების დამატება (${attachments.length})`}
                  </span>
                </label>
                {attachments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="min-h-[38px] px-2.5 py-1.5 rounded-xl card-surface border border-[var(--border-subtle)] text-[11px] font-bold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                  >
                    ყველას წაშლა
                  </button>
                )}
              </div>

              {fileError && (
                <p role="alert" className="text-[11px] font-bold text-rose-600 mt-1.5">
                  {fileError}
                </p>
              )}
            </div>
          </div>

          {/* Attached Files Preview Grid */}
          {attachments.length > 0 && (
            <div className="p-3 rounded-xl card-surface border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                  მიმაგრებული ფაილები ({attachments.length})
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  ჯამში: {formatFileSize(attachments.reduce((s, a) => s + (a.size || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {attachments.map((att, idx) => {
                  const isImg = att.dataUrl.startsWith('data:image/');
                  return (
                    <div
                      key={`${att.name}-${idx}`}
                      className="flex items-center justify-between gap-2 p-2 rounded-xl card-third border border-[var(--border-subtle)] min-w-0"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isImg ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="w-10 h-10 rounded-lg object-cover border border-[var(--border-subtle)] shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary-action-light)] text-[var(--primary-action)] flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate" title={att.name}>
                            {att.name}
                          </p>
                          {att.size ? (
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {formatFileSize(att.size)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        aria-label={`ფაილის წაშლა: ${att.name}`}
                        className="w-8 h-8 min-w-[32px] min-h-[32px] rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              {canModerate ? 'ატვირთვა და გამოქვეყნება' : 'ატვირთვა (დასადასტურებლად გაგზავნა)'}
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
            const canDelete = canModerate || (user && user.id === r.authorId);
            const resAttachments = getResourceAttachments(r);
            const imageAttachments = resAttachments.filter((a) => a.dataUrl.startsWith('data:image/'));
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
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-[var(--primary-action-light)] text-[var(--primary-action)] text-[10px] font-black border border-[var(--primary-action)]/20">
                        {r.resourceType}
                      </span>
                      {resAttachments.length > 0 && (
                        <span className="px-2 py-0.5 rounded-md card-third text-[var(--text-secondary)] text-[10px] font-bold inline-flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          {resAttachments.length} ფაილი
                        </span>
                      )}
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

                    {/* Image Attachment Thumbnails Strip */}
                    {imageAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {imageAttachments.map((imgAtt, imgIdx) => (
                          <button
                            key={`${r.id}-img-${imgIdx}`}
                            type="button"
                            onClick={() => setPreviewAttachment(imgAtt)}
                            className="group relative rounded-xl overflow-hidden border-2 border-[var(--border-subtle)] hover:border-[var(--primary-action)] transition-all bg-white cursor-pointer"
                            title={`გადიდება: ${imgAtt.name}`}
                          >
                            <img
                              src={imgAtt.dataUrl}
                              alt={imgAtt.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold flex items-center gap-0.5">
                              <ImageIcon className="w-2.5 h-2.5" />
                              {imgIdx + 1}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Action Links & All File Downloads */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
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
                      {resAttachments.map((att, attIdx) => (
                        <a
                          key={`${r.id}-att-${attIdx}`}
                          href={att.dataUrl}
                          download={att.name || `masala-${attIdx + 1}`}
                          className="px-2.5 py-1 rounded-lg card-third border border-[var(--border-subtle)] text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-[240px]">
                            {att.name || `ფაილი ${attIdx + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>

                    {isExpanded && r.content && (
                      <div className="mt-2.5 p-3.5 rounded-xl card-third border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
                        {r.content}
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {r.status === 'pending' && canModerate && (
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

      {/* Lightbox Modal for Previewing Uploaded Image Attachments */}
      {previewAttachment && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] card-surface p-3 sm:p-4 rounded-2xl flex flex-col gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate">
                {previewAttachment.name}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={previewAttachment.dataUrl}
                  download={previewAttachment.name || 'image'}
                  className="px-3 py-1.5 rounded-xl btn-primary text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ჩამოტვირთვა</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewAttachment(null)}
                  aria-label="დახურვა"
                  className="w-9 h-9 rounded-xl card-third flex items-center justify-center text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1 flex items-center justify-center bg-black/5 rounded-xl p-2">
              <img
                src={previewAttachment.dataUrl}
                alt={previewAttachment.name}
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
