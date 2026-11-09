import React from 'react';

interface LockedSectionPreviewProps {
  sectionType: 'opportunities' | 'ideas' | 'clubs';
}

/**
 * Renders a sanitized, non-sensitive silhouette layout of the section cards,
 * strongly blurred behind a crisp, prominent "coming soon!" message.
 * Completely excludes real data and interactive controls from DOM / a11y tree.
 */
export const LockedSectionPreview: React.FC<LockedSectionPreviewProps> = ({ sectionType }) => {
  return (
    <div className="relative min-h-[65vh] w-full flex items-center justify-center py-10 px-4 sm:px-6">
      {/* Sanitized, non-sensitive layout silhouette (aria-hidden, inert, blurred) */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 max-w-5xl mx-auto px-4 sm:px-6 pointer-events-none select-none blur-[18px] opacity-45 dark:opacity-35 transition-all overflow-hidden"
      >
        {sectionType === 'opportunities' && (
          <div className="space-y-6 pt-4">
            {/* Header silhouette */}
            <div className="space-y-2">
              <div className="h-4 w-32 rounded-md bg-slate-400 dark:bg-slate-700" />
              <div className="h-8 w-64 rounded-lg bg-slate-500 dark:bg-slate-600" />
              <div className="h-4 w-96 rounded-md bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Opportunity Card Silhouettes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-6 space-y-4 bg-[#FCF9F3] dark:bg-[#111F33] shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 rounded-full bg-slate-300 dark:bg-slate-700" />
                    <div className="h-5 w-20 rounded-md bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="h-6 w-3/4 rounded-md bg-slate-400 dark:bg-slate-600" />
                  <div className="h-4 w-1/2 rounded-md bg-slate-300 dark:bg-slate-700" />
                  <div className="space-y-1.5 pt-2">
                    <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                  <div className="pt-4 flex justify-between items-center">
                    <div className="h-9 w-28 rounded-xl bg-slate-300 dark:bg-slate-700" />
                    <div className="h-4 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sectionType === 'ideas' && (
          <div className="space-y-5 pt-4">
            {/* Header silhouette */}
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <div className="h-4 w-36 rounded-md bg-slate-400 dark:bg-slate-700" />
                <div className="h-8 w-72 rounded-lg bg-slate-500 dark:bg-slate-600" />
              </div>
              <div className="h-9 w-36 rounded-xl bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Filter Pills Silhouette */}
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-7 w-20 rounded-full bg-slate-300 dark:bg-slate-700" />
              ))}
            </div>

            {/* Idea Card Silhouettes */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 flex gap-4 bg-[#FCF9F3] dark:bg-[#111F33] shadow-sm"
                >
                  <div className="h-14 w-12 rounded-xl bg-slate-300 dark:bg-slate-700 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-28 rounded bg-slate-300 dark:bg-slate-700" />
                      <div className="h-4 w-16 rounded-full bg-slate-300 dark:bg-slate-700" />
                    </div>
                    <div className="h-5 w-2/3 rounded bg-slate-400 dark:bg-slate-600" />
                    <div className="h-3.5 w-full rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3.5 w-4/5 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sectionType === 'clubs' && (
          <div className="space-y-6 pt-4">
            {/* Header silhouette */}
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <div className="h-4 w-40 rounded-md bg-slate-400 dark:bg-slate-700" />
                <div className="h-8 w-60 rounded-lg bg-slate-500 dark:bg-slate-600" />
              </div>
              <div className="h-9 w-32 rounded-xl bg-slate-300 dark:bg-slate-700" />
            </div>

            {/* Tabs Silhouette */}
            <div className="h-10 w-64 rounded-xl bg-slate-300 dark:bg-slate-700" />

            {/* Club Card Silhouettes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl p-5 space-y-3 bg-[#FCF9F3] dark:bg-[#111F33] shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 rounded bg-slate-300 dark:bg-slate-700" />
                    <div className="h-4 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </div>
                  <div className="h-5 w-4/5 rounded bg-slate-400 dark:bg-slate-600" />
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="pt-2 flex justify-between">
                    <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Subtle theme-aware veil */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#F5F1E8]/60 dark:bg-[#0B1422]/60 backdrop-blur-[2px] pointer-events-none"
      />

      {/* Crisp foreground message - EXACT text: coming soon! */}
      <div className="relative z-10 text-center px-4 py-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#292D32] dark:text-[#E9EEF4] select-none font-sans drop-shadow-xs">
          coming soon!
        </h2>
      </div>
    </div>
  );
};
