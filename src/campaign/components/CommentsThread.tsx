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
        <h4 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[var(--primary-action)]" />
          {title} ({threadComments.length})
        </h4>
      </div>

      {/* Comments List */}
      {threadComments.length === 0 ? (
        <div className="p-3.5 rounded-2xl card-third border border-[var(--border-subtle)] text-xs text-[var(--text-muted)] text-center">
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
                    ? 'bg-amber-500/15 border-amber-500/30'
                    : c.isAdmin
                    ? 'bg-[var(--primary-action-light)]/40 border-[var(--primary-action)]/30'
                    : 'card-surface border-[var(--border-subtle)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-[var(--text-primary)]">{c.authorName}</span>
                    {c.isAdmin && (
                      <span className="px-1.5 py-0.5 rounded-md btn-primary text-white text-[9px] font-black uppercase inline-flex items-center gap-0.5">
                        <Shield className="w-2.5 h-2.5" />
                        ადმინი
                      </span>
                    )}
                    {c.isPinned && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px] font-black inline-flex items-center gap-0.5 border border-amber-500/30">
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
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          c.isPinned
                            ? 'text-amber-700 dark:text-amber-300 bg-amber-500/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => deleteComment(c.id)}
                        title="კომენტარის წაშლა"
                        aria-label="კომენტარის წაშლა"
                        className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{c.content}</p>
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
            aria-label="კომენტარის დაწერა"
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-subtle)] text-base sm:text-xs card-third text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary-action)] min-h-[44px]"
          />
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="min-h-[44px] px-4 py-2 rounded-xl btn-primary disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 transition-all shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>გაგზავნა</span>
          </button>
        </form>
      ) : (
        <div className="p-3.5 rounded-2xl bg-[var(--primary-action-light)] border border-[var(--primary-action)]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            კომენტარის დასატოვებლად საჭიროა აქაუნთზე შესვლა
          </span>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="min-h-[44px] px-4 py-2 rounded-xl btn-primary text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>შესვლა / რეგისტრაცია</span>
          </button>
        </div>
      )}
    </div>
  );
};
