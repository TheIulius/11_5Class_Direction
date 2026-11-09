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
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
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
          className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1.5 border border-indigo-200/80 transition-colors"
        >
          {showUploadForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showUploadForm ? 'დახურვა' : 'კონსპექტის / მასალის ატვირთვა'}
        </button>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && user && (
        <form
          onSubmit={handleSubmit}
          className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              ახალი სასწავლო მასალის / კონსპექტის დამატება
            </span>
            {!isAdmin && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                გამოქვეყნდება ადმინის დადასტურების შემდეგ
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                სათაური *
              </label>
              <input
                type="text"
                required
                value={resTitle}
                onChange={(e) => setResTitle(e.target.value)}
                placeholder="მაგ: ტრიგონომეტრიის ფორმულების კონსპექტი"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                მასალის ტიპი
              </label>
              <select
                value={resType}
                onChange={(e) => setResType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
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
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              მოკლე აღწერა *
            </label>
            <input
              type="text"
              required
              value={resDesc}
              onChange={(e) => setResDesc(e.target.value)}
              placeholder="რა საკითხებს მოიცავს ეს მასალა?"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              კონსპექტის ტექსტი / ფორმულები (სურვილისამებრ)
            </label>
            <textarea
              rows={4}
              value={resContent}
              onChange={(e) => setResContent(e.target.value)}
              placeholder="ჩაწერეთ კონსპექტი, საკვანძო თეზისები ან ამოხსნა პირდაპირ აქ..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                გარე ბმული (Google Docs, Drive, PDF, YouTube)
              </label>
              <input
                type="url"
                value={resLink}
                onChange={(e) => setResLink(e.target.value)}
                placeholder="https://docs.google.com/..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ფაილის მიმაგრება (PDF, ფოტო, Word — მაქს. 4MB)
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-100 file:text-indigo-700 hover:file:bg-indigo-200"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowUploadForm(false)}
              className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-bold"
            >
              გაუქმება
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
            >
              {isAdmin ? 'ატვირთვა და გამოქვეყნება' : 'ატვირთვა (ადმინთან გაგზავნა)'}
            </button>
          </div>
        </form>
      )}

      {/* Resources List */}
      {matchingResources.length === 0 ? (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 flex items-center justify-between gap-2">
          <span>ამ აქტივობაზე კონსპექტი ჯერ არ არის ატვირთული.</span>
          {!user && (
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-indigo-600 font-bold hover:underline shrink-0"
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
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black">
                        {r.resourceType}
                      </span>
                      {r.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          ელოდება ადმინის დადასტურებას
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        • ავტორი: <strong className="text-slate-600">{r.authorName}</strong>
                      </span>
                    </div>

                    <h5 className="text-xs sm:text-sm font-black text-slate-900">{r.title}</h5>
                    <p className="text-xs text-slate-600">{r.description}</p>

                    {/* Action Links */}
                    <div className="flex flex-wrap items-center gap-3 pt-1.5">
                      {r.content && (
                        <button
                          type="button"
                          onClick={() => setExpandedResId(isExpanded ? null : r.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
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
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          ბმულზე გადასვლა
                        </a>
                      )}
                      {r.attachmentDataUrl && (
                        <a
                          href={r.attachmentDataUrl}
                          download={r.attachmentName || 'masala'}
                          className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {r.attachmentName || 'ფაილის ჩამოტვირთვა'}
                        </a>
                      )}
                    </div>

                    {isExpanded && r.content && (
                      <div className="mt-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
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
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        დადასტურება
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => upvoteResource(r.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{r.upvotes || 0}</span>
                    </button>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteResource(r.id)}
                        title="წაშლა"
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
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
