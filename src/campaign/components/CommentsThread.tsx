import React, { useState } from 'react';
import { MessageSquare, Send, Pin, Trash2, Shield, LogIn } from 'lucide-react';
import { usePlatform, PlatformComment } from '../context/PlatformContext';

interface CommentsThreadProps {
  targetType: PlatformComment['targetType'];
  targetId: string;
  title?: string;
  compact?: boolean;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({
  targetType,
  targetId,
  title = 'კლასელების კომენტარები & განხილვა',
  compact = false,
}) => {
  const { user, isAdmin, platform, addComment, deleteComment, pinComment, openAuthModal } =
    usePlatform();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const threadComments = platform.comments
    .filter((c) => c.targetType === targetType && c.targetId === targetId)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setIsSubmitting(true);
    const res = await addComment(targetType, targetId, content.trim());
    setIsSubmitting(false);
    if (res.success) {
      setContent('');
    }
  };

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
          {title} ({threadComments.length})
        </h4>
      </div>

      {/* Comments List */}
      {threadComments.length === 0 ? (
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 text-center">
          ჯერ კომენტარი არ დაწერილა. იყავი პირველი!
        </div>
      ) : (
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {threadComments.map((c) => {
            const canDelete = isAdmin || (user && user.id === c.authorId);
            return (
              <div
                key={c.id}
                className={`p-3 rounded-2xl border text-xs transition-all ${
                  c.isPinned
                    ? 'bg-amber-50/70 border-amber-200'
                    : c.isAdmin
                    ? 'bg-indigo-50/50 border-indigo-100'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-slate-900">{c.authorName}</span>
                    {c.isAdmin && (
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white text-[9px] font-black uppercase inline-flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        ადმინი
                      </span>
                    )}
                    {c.isPinned && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[9px] font-black inline-flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5" />
                        მიმაგრებული
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => pinComment(c.id)}
                        title={c.isPinned ? 'მიმაგრების მოხსნა' : 'კომენტარის მიმაგრება'}
                        className={`p-1 rounded-lg transition-colors ${
                          c.isPinned
                            ? 'text-amber-700 bg-amber-100'
                            : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        title="კომენტარის წაშლა"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{c.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Input or Guest Sign-In Prompt */}
      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`დაწერე კომენტარი როგორც ${user.fullName}...`}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            გაგზავნა
          </button>
        </form>
      ) : (
        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
          <span className="text-xs text-indigo-950 font-medium">
            კომენტარის დასატოვებლად საჭიროა აქაუნთზე შესვლა
          </span>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <LogIn className="w-3.5 h-3.5" />
            შესვლა / რეგისტრაცია
          </button>
        </div>
      )}
    </div>
  );
};
