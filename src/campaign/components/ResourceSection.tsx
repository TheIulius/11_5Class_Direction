import React, { useState, useId, useRef, useEffect, useMemo } from 'react';
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
  Edit3,
  ChevronLeft,
  ChevronRight,
  Play,
  Film,
  ChevronDown,
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

export const isImageAttachment = (att: ResourceAttachment): boolean => {
  if (att.mimeType?.startsWith('image/')) return true;
  if (att.dataUrl.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|webp|gif|heic|svg)$/i.test(att.name || '');
};

export const isVideoAttachment = (att: ResourceAttachment): boolean => {
  if (att.mimeType?.startsWith('video/')) return true;
  if (att.dataUrl.startsWith('data:video/')) return true;
  return /\.(mp4|mov|webm|m4v|ogg)$/i.test(att.name || '');
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

interface GalleryMediaItem {
  attachment: ResourceAttachment;
  resourceId: string;
  resourceTitle?: string;
  authorName: string;
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
    canModerate,
    platform,
    submitResource,
    updateResource,
    moderateResource,
    deleteResource,
    upvoteResource,
    openAuthModal,
  } = usePlatform();

  const fileInputId = useId();
  const dialogTitleId = useId();
  const galleryDialogRef = useRef<HTMLDialogElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingResourceId, setEditingResourceId] = useState<string | null>(null);
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resContent, setResContent] = useState('');
  const [resLink, setResLink] = useState('');
  const [resType, setResType] = useState<PlatformResource['resourceType']>('დავალების ამოხსნა');
  const [attachments, setAttachments] = useState<ResourceAttachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [expandedResId, setExpandedResId] = useState<string | null>(null);

  // Unified gallery state across all photos & videos attached to this homework/target
  const [activeGalleryIdx, setActiveGalleryIdx] = useState<number | null>(null);

  // Filter resources matching this target
  const matchingResources = useMemo(
    () =>
      platform.resources.filter((r) => {
        if (targetId) {
          if (r.targetId !== targetId) return false;
        } else if (r.targetType !== targetType) {
          return false;
        }
        if (r.status === 'approved') return true;
        if (r.status === 'pending' && (canModerate || (user && user.id === r.authorId))) return true;
        return false;
      }),
    [platform.resources, targetId, targetType, canModerate, user]
  );

  // Build flat list of all photos & videos across all matching resources for this homework/target
  const allTargetMediaItems = useMemo<GalleryMediaItem[]>(() => {
    const list: GalleryMediaItem[] = [];
    for (const r of matchingResources) {
      const atts = getResourceAttachments(r);
      for (const att of atts) {
        if (isImageAttachment(att) || isVideoAttachment(att)) {
          list.push({
            attachment: att,
            resourceId: r.id,
            resourceTitle: r.title || r.description || undefined,
            authorName: r.authorName,
          });
        }
      }
    }
    return list;
  }, [matchingResources]);

  const openGalleryAt = (resourceId: string, attachmentDataUrl: string) => {
    const idx = allTargetMediaItems.findIndex(
      (m) => m.resourceId === resourceId && m.attachment.dataUrl === attachmentDataUrl
    );
    setActiveGalleryIdx(idx >= 0 ? idx : 0);
  };

  const closeGallery = () => {
    const dlg = galleryDialogRef.current;
    if (dlg && dlg.open) {
      dlg.close();
    }
    setActiveGalleryIdx(null);
  };

  const goPrevMedia = () => {
    if (allTargetMediaItems.length <= 1) return;
    setActiveGalleryIdx((prev) =>
      prev === null ? 0 : (prev - 1 + allTargetMediaItems.length) % allTargetMediaItems.length
    );
  };

  const goNextMedia = () => {
    if (allTargetMediaItems.length <= 1) return;
    setActiveGalleryIdx((prev) =>
      prev === null ? 0 : (prev + 1) % allTargetMediaItems.length
    );
  };

  // Sync native <dialog> open/close and keyboard Left/Right navigation
  useEffect(() => {
    const dlg = galleryDialogRef.current;
    if (!dlg) return;

    if (activeGalleryIdx !== null) {
      if (!dlg.open) {
        try {
          dlg.showModal();
        } catch {}
      }
    } else if (dlg.open) {
      dlg.close();
    }
  }, [activeGalleryIdx]);

  // Fallback for browsers without native dialog[closedby="any"] + keyboard Left/Right arrows
  useEffect(() => {
    const dlg = galleryDialogRef.current;
    if (!dlg) return;

    const handleClose = () => {
      setActiveGalleryIdx(null);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dlg.open) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrevMedia();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNextMedia();
      }
    };
    const handleBackdropClick = (event: MouseEvent) => {
      if ('closedBy' in HTMLDialogElement.prototype) return;
      if (event.target !== dlg) return;
      const rect = dlg.getBoundingClientRect();
      const isDialogContent =
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width;
      if (!isDialogContent) {
        dlg.close();
      }
    };

    dlg.addEventListener('close', handleClose);
    dlg.addEventListener('keydown', handleKeyDown);
    dlg.addEventListener('click', handleBackdropClick);
    return () => {
      dlg.removeEventListener('close', handleClose);
      dlg.removeEventListener('keydown', handleKeyDown);
      dlg.removeEventListener('click', handleBackdropClick);
    };
  }, [allTargetMediaItems.length]);

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
    const MAX_PER_FILE = 20 * 1024 * 1024; // 20 MB per photo/video/file
    const MAX_TOTAL = 40 * 1024 * 1024; // 40 MB total

    const oversized = selectedFiles.find((f) => f.size > MAX_PER_FILE);
    if (oversized) {
      setFileError(
        `ფაილი „${oversized.name}“ აღემატება 20 MB-ს. გთხოვთ ატვირთოთ უფრო მცირე ფაილი ან ჩასვათ ბმული.`
      );
      e.target.value = '';
      return;
    }

    const currentTotal = attachments.reduce((sum, a) => sum + (a.size || 0), 0);
    const newTotal = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL) {
      setFileError('მიმაგრებული ფაილების ჯამური მოცულობა არ უნდა აღემატებოდეს 40 MB-ს.');
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
      e.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setEditingResourceId(null);
    setResTitle('');
    setResContent('');
    setResLink('');
    setResType('დავალების ამოხსნა');
    setAttachments([]);
    setFileError(null);
    setShowAdvancedFields(false);
    setShowUploadForm(false);
  };

  const handleStartEdit = (r: PlatformResource) => {
    setEditingResourceId(r.id);
    setResTitle(r.title || r.description || '');
    setResContent(r.content || '');
    setResLink(r.linkUrl || '');
    setResType(r.resourceType || 'დავალების ამოხსნა');
    setAttachments(getResourceAttachments(r));
    setShowAdvancedFields(Boolean(r.content || r.linkUrl));
    setFileError(null);
    setShowUploadForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hasAnyContent =
      attachments.length > 0 ||
      Boolean(resTitle.trim()) ||
      Boolean(resContent.trim()) ||
      Boolean(resLink.trim());

    if (!hasAnyContent) {
      setFileError('გთხოვთ აირჩიოთ ფოტო/ვიდეო/ფაილი ან ჩაწეროთ ტექსტი.');
      return;
    }

    const firstAtt = attachments[0];

    if (editingResourceId) {
      const ok = await updateResource(editingResourceId, {
        title: resTitle.trim(),
        description: '',
        content: resContent.trim() || undefined,
        linkUrl: resLink.trim() || undefined,
        attachmentName: firstAtt?.name || undefined,
        attachmentDataUrl: firstAtt?.dataUrl || undefined,
        attachments,
        resourceType: resType,
      });
      if (ok) {
        resetForm();
        setFeedbackMsg('მასალა წარმატებით განახლდა!');
        setTimeout(() => setFeedbackMsg(null), 4000);
      }
      return;
    }

    const result = await submitResource({
      title: resTitle.trim(),
      description: '',
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
      resetForm();
      setFeedbackMsg(
        result.isPending
          ? 'მასალა გაიგზავნა! ადმინისტრატორის დადასტურებისთანავე გამოჩნდება ყველასთვის.'
          : 'მასალა წარმატებით დაემატა!'
      );
      setTimeout(() => setFeedbackMsg(null), 5000);
    } else if (result.error) {
      setFileError(result.error);
    }
  };

  const currentMedia =
    activeGalleryIdx !== null && allTargetMediaItems[activeGalleryIdx]
      ? allTargetMediaItems[activeGalleryIdx]
      : null;

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
            if (showUploadForm) {
              resetForm();
            } else {
              setShowUploadForm(true);
            }
          }}
          className="min-h-[42px] px-3.5 py-2 rounded-xl card-third hover:opacity-90 text-[var(--primary-action)] text-xs font-bold flex items-center gap-1.5 border border-[var(--border-subtle)] transition-opacity cursor-pointer"
        >
          {showUploadForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showUploadForm ? 'დახურვა' : 'ფოტოს / მასალის ატვირთვა'}
        </button>
      </div>

      {feedbackMsg && (
        <div
          role="status"
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Fast, Minimal Upload / Edit Form (Zero Mandatory Text Fields!) */}
      {showUploadForm && user && (
        <form
          onSubmit={handleSubmit}
          className="p-3.5 sm:p-4 rounded-2xl card-third border border-[var(--border-subtle)] space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[var(--primary-action)]" />
              {editingResourceId
                ? 'ატვირთული მასალის რედაქტირება'
                : 'ფოტოების, ვიდეოს ან მასალის სწრაფი ატვირთვა'}
            </span>
            {!canModerate && !editingResourceId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                გამოქვეყნდება დადასტურების შემდეგ
              </span>
            )}
          </div>

          {/* 1. Primary Action: Select Photos / Videos / Files (No Title Required!) */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                id={fileInputId}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                onChange={handleFileChange}
                className="sr-only peer"
              />
              <label
                htmlFor={fileInputId}
                className="min-h-[44px] px-4 py-2.5 rounded-xl btn-primary text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 cursor-pointer select-none peer-focus-visible:outline-3 peer-focus-visible:outline-[var(--primary-action)] peer-focus-visible:outline-offset-2"
              >
                <ImageIcon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {attachments.length === 0
                    ? 'ფოტოების / ვიდეოს / ფაილების არჩევა'
                    : `+ კიდევ ფაილების დამატება (${attachments.length})`}
                </span>
              </label>

              {attachments.length > 1 && (
                <button
                  type="button"
                  onClick={() => setAttachments([])}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl card-surface border border-[var(--border-subtle)] text-xs font-bold text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                >
                  ყველას წაშლა
                </button>
              )}
            </div>

            {fileError && (
              <p role="alert" className="text-xs font-bold text-rose-600">
                {fileError}
              </p>
            )}
          </div>

          {/* Attached Files Preview Grid */}
          {attachments.length > 0 && (
            <div className="p-3 rounded-xl card-surface border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[var(--primary-action)]" />
                  არჩეული ფაილები ({attachments.length})
                </span>
                <span className="text-[10px] text-[var(--text-muted)]">
                  {formatFileSize(attachments.reduce((s, a) => s + (a.size || 0), 0))}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {attachments.map((att, idx) => {
                  const isImg = isImageAttachment(att);
                  const isVid = isVideoAttachment(att);
                  return (
                    <div
                      key={`${att.name}-${idx}`}
                      className="relative group flex flex-col justify-between p-2 rounded-xl card-third border border-[var(--border-subtle)] min-w-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        aria-label={`ფაილის წაშლა: ${att.name}`}
                        className="absolute top-1.5 right-1.5 z-10 w-7 h-7 rounded-full bg-black/75 text-white flex items-center justify-center hover:bg-rose-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {isImg ? (
                        <img
                          src={att.dataUrl}
                          alt={att.name}
                          className="w-full h-24 rounded-lg object-cover border border-[var(--border-subtle)] bg-white"
                        />
                      ) : isVid ? (
                        <div className="w-full h-24 rounded-lg bg-slate-900 text-white flex flex-col items-center justify-center gap-1">
                          <Film className="w-6 h-6 text-purple-400" />
                          <span className="text-[10px] font-bold">ვიდეო</span>
                        </div>
                      ) : (
                        <div className="w-full h-24 rounded-lg bg-[var(--primary-action-light)] text-[var(--primary-action)] flex flex-col items-center justify-center gap-1">
                          <FileText className="w-6 h-6" />
                          <span className="text-[10px] font-bold">ფაილი</span>
                        </div>
                      )}

                      <div className="pt-1.5 min-w-0">
                        <p className="text-[11px] font-bold text-[var(--text-primary)] truncate" title={att.name}>
                          {att.name}
                        </p>
                        {att.size ? (
                          <p className="text-[10px] text-[var(--text-muted)]">
                            {formatFileSize(att.size)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Single Optional Title / Caption Input */}
          <div>
            <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
              სათაური ან მოკლე მინაწერი (არასავალდებულო — შეგიძლიათ ცარიელი დატოვოთ)
            </label>
            <input
              type="text"
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="მაგ: ამოცანა #56-ის ამოხსნა (ან დატოვეთ ცარიელი უსათაურო ფოტოსთვის)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
            />
          </div>

          {/* 3. Optional Expandable Text / External Link Section */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvancedFields((prev) => !prev)}
              className="text-xs font-bold text-[var(--primary-action)] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${showAdvancedFields ? 'rotate-180' : ''}`}
              />
              <span>
                {showAdvancedFields
                  ? 'დამატებითი ველების დამალვა'
                  : '+ ტექსტური კონსპექტის ან გარე ბმულის დამატება (სურვილისამებრ)'}
              </span>
            </button>

            {showAdvancedFields && (
              <div className="mt-2.5 space-y-2.5 pt-2.5 border-t border-[var(--border-subtle)]">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                    კონსპექტის ტექსტი / ფორმულები (არასავალდებულო)
                  </label>
                  <textarea
                    rows={3}
                    value={resContent}
                    onChange={(e) => setResContent(e.target.value)}
                    placeholder="ჩაწერეთ კონსპექტი ან ამოხსნა პირდაპირ აქ..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                      გარე ბმული (Google Drive, Docs, YouTube)
                    </label>
                    <input
                      type="url"
                      value={resLink}
                      onChange={(e) => setResLink(e.target.value)}
                      placeholder="https://..."
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                      მასალის კატეგორია
                    </label>
                    <select
                      value={resType}
                      onChange={(e) => setResType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs bg-[var(--surface-card)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary-action)] min-h-[42px]"
                    >
                      <option value="დავალების ამოხსნა">დავალების ამოხსნა</option>
                      <option value="კონსპექტი">კონსპექტი</option>
                      <option value="ტესტი/მასალა">ტესტი / სავარჯიშო</option>
                      <option value="პრეზენტაცია">პრეზენტაცია</option>
                      <option value="ბმული">სასარგებლო ბმული</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="min-h-[42px] px-4 py-2 rounded-xl card-surface border border-[var(--border-subtle)] text-[var(--text-secondary)] text-xs font-bold hover:text-[var(--text-primary)] cursor-pointer"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {editingResourceId
                ? 'ცვლილებების შენახვა'
                : canModerate
                ? 'ატვირთვა და გამოქვეყნება'
                : 'ატვირთვა'}
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {matchingResources.length === 0 ? (
        <div className="p-3.5 rounded-2xl card-third border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] flex items-center justify-between gap-2">
          <span>ამ დავალებაზე ფოტო ან მასალა ჯერ არ არის ატვირთული.</span>
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
            const canModify =
              canModerate ||
              (user && (user.id === r.authorId || user.username === r.authorUsername));
            const resAttachments = getResourceAttachments(r);
            const mediaAttachments = resAttachments.filter(
              (a) => isImageAttachment(a) || isVideoAttachment(a)
            );
            const docAttachments = resAttachments.filter(
              (a) => !isImageAttachment(a) && !isVideoAttachment(a)
            );

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
                  <div className="space-y-1.5 flex-1 min-w-0">
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
                          ელოდება დადასტურებას
                        </span>
                      )}
                      <span className="text-[11px] text-[var(--text-muted)]">
                        • <strong className="text-[var(--text-secondary)]">{r.authorName}</strong>
                      </span>
                    </div>

                    {r.title && (
                      <h5 className="text-xs sm:text-sm font-black text-[var(--text-primary)]">
                        {r.title}
                      </h5>
                    )}
                    {r.description && r.description !== r.title && (
                      <p className="text-xs text-[var(--text-secondary)]">{r.description}</p>
                    )}

                    {/* Interactive Photo & Video Gallery Grid (Click to Open In-Site Viewer!) */}
                    {mediaAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {mediaAttachments.map((mediaAtt, mIdx) => {
                          const isVid = isVideoAttachment(mediaAtt);
                          return (
                            <button
                              key={`${r.id}-media-${mIdx}`}
                              type="button"
                              onClick={() => openGalleryAt(r.id, mediaAtt.dataUrl)}
                              className="group relative rounded-xl overflow-hidden border-2 border-[var(--border-subtle)] hover:border-[var(--primary-action)] transition-all bg-slate-900/5 cursor-pointer"
                              aria-label={`საიტზევე გახსნა: ${mediaAtt.name || `ფოტო ${mIdx + 1}`}`}
                            >
                              {isVid ? (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900 text-white flex flex-col items-center justify-center gap-1 relative">
                                  <video
                                    src={mediaAtt.dataUrl}
                                    preload="metadata"
                                    muted
                                    playsInline
                                    className="absolute inset-0 w-full h-full object-cover opacity-70"
                                  />
                                  <span className="relative z-10 w-9 h-9 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                    <Play className="w-4 h-4 fill-white ml-0.5" />
                                  </span>
                                  <span className="relative z-10 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/70">
                                    ვიდეო
                                  </span>
                                </div>
                              ) : (
                                <img
                                  src={mediaAtt.dataUrl}
                                  alt={mediaAtt.name || `ფოტო ${mIdx + 1}`}
                                  className="w-24 h-24 sm:w-28 sm:h-28 object-cover group-hover:scale-105 transition-transform bg-white"
                                />
                              )}
                              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                {mIdx + 1}/{mediaAttachments.length}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Action Links & Non-Media Document Downloads */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      {r.content && (
                        <button
                          type="button"
                          onClick={() => setExpandedResId(isExpanded ? null : r.id)}
                          className="text-xs font-bold text-[var(--primary-action)] hover:opacity-80 flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {isExpanded ? 'ტექსტის დამალვა' : 'ტექსტის წაკითხვა'}
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
                      {docAttachments.map((att, attIdx) => (
                        <a
                          key={`${r.id}-doc-${attIdx}`}
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

                  {/* Right Actions (Approve, Upvote, Edit, Delete) */}
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

                    {canModify && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(r)}
                        title="რედაქტირება"
                        aria-label="მასალის რედაქტირება"
                        className="p-2 rounded-xl card-third hover:bg-purple-500/10 text-[var(--text-muted)] hover:text-[var(--primary-action)] transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {canModify && (
                      <button
                        type="button"
                        onClick={() => deleteResource(r.id)}
                        title="წაშლა"
                        aria-label="მასალის წაშლა"
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

      {/* Native <dialog> In-Site Media Lightbox Gallery (Swipe + Prev/Next across all photos/videos on this homework) */}
      <dialog
        ref={galleryDialogRef}
        closedby="any"
        aria-labelledby={dialogTitleId}
        className="nb-media-dialog m-auto w-[calc(100vw-1rem)] sm:w-[calc(100vw-3rem)] max-w-4xl max-h-[92dvh] rounded-2xl p-0 bg-transparent border-0 overflow-visible"
      >
        {currentMedia && (
          <div
            className="card-surface nb-stationary p-3 sm:p-4 rounded-2xl flex flex-col gap-3 max-h-[90dvh] overflow-hidden"
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
              const deltaX = endX - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(deltaX) > 45) {
                if (deltaX < 0) goNextMedia();
                else goPrevMedia();
              }
            }}
          >
            {/* Top Bar: Counter, Title/Author, Download & Close */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
              <div className="min-w-0 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg btn-primary text-white text-xs font-bold shrink-0">
                  {(activeGalleryIdx ?? 0) + 1} / {allTargetMediaItems.length}
                </span>
                <div className="min-w-0">
                  <h3
                    id={dialogTitleId}
                    className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate"
                  >
                    {currentMedia.resourceTitle || currentMedia.attachment.name || 'მიმაგრებული ფოტო / ვიდეო'}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] truncate">
                    ავტორი: {currentMedia.authorName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={currentMedia.attachment.dataUrl}
                  download={currentMedia.attachment.name || 'media'}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl card-third text-[var(--text-primary)] text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">ჩამოტვირთვა</span>
                </a>
                <button
                  type="button"
                  onClick={closeGallery}
                  aria-label="გალერეის დახურვა"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl card-third flex items-center justify-center text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Media Stage with Left / Right Navigation Arrows */}
            <div className="relative flex-1 min-h-[260px] max-h-[68dvh] bg-slate-950/90 rounded-xl flex items-center justify-center overflow-hidden select-none p-2">
              {allTargetMediaItems.length > 1 && (
                <button
                  type="button"
                  onClick={goPrevMedia}
                  aria-label="წინა ფოტო ან ვიდეო"
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full btn-primary text-white flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {isVideoAttachment(currentMedia.attachment) ? (
                <video
                  key={currentMedia.attachment.dataUrl}
                  src={currentMedia.attachment.dataUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[64dvh] max-w-full rounded-lg"
                />
              ) : (
                <img
                  key={currentMedia.attachment.dataUrl}
                  src={currentMedia.attachment.dataUrl}
                  alt={currentMedia.attachment.name}
                  className="max-h-[64dvh] max-w-full w-auto object-contain rounded-lg"
                />
              )}

              {allTargetMediaItems.length > 1 && (
                <button
                  type="button"
                  onClick={goNextMedia}
                  aria-label="შემდეგი ფოტო ან ვიდეო"
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full btn-primary text-white flex items-center justify-center cursor-pointer shadow-lg"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Thumbnail Strip for Fast Jumping Between Attached Photos/Videos */}
            {allTargetMediaItems.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                {allTargetMediaItems.map((item, idx) => {
                  const isActive = idx === activeGalleryIdx;
                  const isVid = isVideoAttachment(item.attachment);
                  return (
                    <button
                      key={`thumb-${item.resourceId}-${idx}`}
                      type="button"
                      onClick={() => setActiveGalleryIdx(idx)}
                      aria-label={`ფაილი ${idx + 1}`}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        isActive
                          ? 'border-[var(--primary-action)] scale-105 shadow-sm'
                          : 'border-transparent opacity-65 hover:opacity-100'
                      }`}
                    >
                      {isVid ? (
                        <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white" />
                        </div>
                      ) : (
                        <img
                          src={item.attachment.dataUrl}
                          alt={item.attachment.name}
                          className="w-full h-full object-cover bg-white"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
};
