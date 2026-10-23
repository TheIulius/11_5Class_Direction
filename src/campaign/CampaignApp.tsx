import React, { useState, useEffect } from 'react';
import { Eye, Flame, BarChart3, Globe } from 'lucide-react';
import { Navbar, ActiveTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealCalendarView } from './components/RealCalendarView';
import { QuizPrepSection } from './components/QuizPrepSection';
import { HomeworkSection } from './components/HomeworkSection';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { IdeaBoardSection } from './components/IdeaBoardSection';
import { ClubFastTrackSection } from './components/ClubFastTrackSection';
import { StudyMatcherSection } from './components/StudyMatcherSection';
import { BackgroundClassPhotos } from './components/BackgroundClassPhotos';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal';
import { usePlatformAnalytics, recordQuizClick } from './services/analytics';

interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

const LOCKED_TABS: ActiveTab[] = ['homework', 'opportunities', 'ideas', 'clubs'];

export const CampaignApp: React.FC<CampaignAppProps> = ({ onSwitchToFantasy }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const analytics = usePlatformAnalytics();
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  useEffect(() => {
    const metaColorScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    const metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#0b0c13');
    } else {
      document.documentElement.classList.remove('dark');
      if (metaTheme) metaTheme.setAttribute('content', '#f6f3eb');
    }

    try {
      const stored = localStorage.getItem('color-scheme');
      if (metaColorScheme) {
        metaColorScheme.content = stored === 'light' || stored === 'dark' ? stored : 'light dark';
      }
    } catch {}
  }, [theme]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'color-scheme') {
        if (e.newValue === 'light' || e.newValue === 'dark') {
          setTheme(e.newValue);
        } else {
          const prefersDark =
            window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setTheme(prefersDark ? 'dark' : 'light');
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleToggleTheme = () => {
    const next: 'dark' | 'light' = theme === 'dark' ? 'light' : 'dark';
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const systemScheme: 'dark' | 'light' = prefersDark ? 'dark' : 'light';
    const metaColorScheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');

    try {
      if (next === systemScheme) {
        localStorage.removeItem('color-scheme');
        if (metaColorScheme) metaColorScheme.content = 'light dark';
      } else {
        localStorage.setItem('color-scheme', next);
        if (metaColorScheme) metaColorScheme.content = next;
      }
    } catch {}

    setTheme(next);
  };

  const isCurrentTabLocked = LOCKED_TABS.includes(activeTab);

  useEffect(() => {
    if (isCurrentTabLocked) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isCurrentTabLocked]);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'quiz') {
      recordQuizClick();
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className={`campaign-parallax-wrapper relative ${
        isCurrentTabLocked ? 'h-dvh overflow-hidden' : 'min-h-screen'
      } w-full ${
        theme === 'light'
          ? 'campaign-light bg-[#f6f3eb] text-[#1c1914] selection:bg-[#1e1b16] selection:text-[#fcfbf7]'
          : 'campaign-dark bg-[#0b0c13] text-[#f5f2eb] selection:bg-[#f5f2eb] selection:text-[#0b0c13]'
      } flex flex-col font-sans antialiased overflow-x-hidden transition-colors duration-300`}
    >
      {/* Subtle Scattered Class Photos in Background */}
      <BackgroundClassPhotos />

      {/* Translucent Frosted Glass Sticky Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Tab Content */}
      <main
        className={`relative z-10 flex-1 w-full ${
          isCurrentTabLocked ? 'overflow-hidden h-[calc(100dvh-4rem)]' : 'pb-20'
        }`}
      >
        {activeTab === 'hero' && (
          <div className="space-y-12">
            <HeroSection
              onNavigateTab={handleSelectTab}
            />
            {/* Quick overview of study pods on home tab */}
            <StudyMatcherSection />
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="pt-4 sm:pt-6">
            <RealCalendarView />
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="pt-2 sm:pt-4">
            <QuizPrepSection />
          </div>
        )}

        {isCurrentTabLocked && (
          <div className="relative w-full h-[calc(100dvh-4rem)] overflow-hidden select-none">
            {/* Slightly Blurred Underlying Page Preview — Page Structure Visible, Text Unreadable */}
            <div
              aria-hidden="true"
              className="w-full h-full overflow-hidden pointer-events-none select-none filter blur-[5px] sm:blur-[6px] opacity-60 pt-4 sm:pt-6"
            >
              {activeTab === 'homework' && <HomeworkSection />}
              {activeTab === 'opportunities' && <OpportunitiesSection />}
              {activeTab === 'ideas' && <IdeaBoardSection />}
              {activeTab === 'clubs' && <ClubFastTrackSection />}
            </div>

            {/* Minimalist Centered "Coming soon!" Text Only */}
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 pointer-events-none">
              <h2 className="text-5xl sm:text-7xl font-black tracking-tight text-[#fcfbf7] drop-shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
                Coming soon!
              </h2>
            </div>
          </div>
        )}
      </main>

      {/* Minimalist Footer in Georgian with Live Analytics */}
      <footer className="relative z-10 w-full border-t border-black/10 dark:border-[#f5f2eb]/10 py-7 px-4 sm:px-6 text-xs text-stone-600 dark:text-[#a8a495] bg-[#f2ede1]/90 dark:bg-[#0c0d14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="font-semibold text-stone-900 dark:text-[#fcfbf7] flex items-center">
                <span className="inline-flex items-end">
                  <span>11/5</span>
                  <span className="text-[9px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-0.5">
                    class
                  </span>
                </span>
                <span className="ml-1">Platform</span>
              </span>
              <span>&bull;</span>
              <span>მე-11 კლასის საპრეზიდენტო პლატფორმა</span>
              <span className="text-[#7c796e]/60">&bull;</span>
              <span className="text-[11px] font-mono text-[#7c796e]/85 select-none">
                &copy; made by Theiulius
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="text-[#7c796e]/70 select-none">made by Theiulius</span>
              {onSwitchToFantasy && (
                <>
                  <span className="text-[#7c796e]/50">&bull;</span>
                  <button
                    onClick={onSwitchToFantasy}
                    className="text-stone-600 dark:text-[#a8a495] hover:text-stone-900 dark:hover:text-[#fcfbf7] transition-colors cursor-pointer"
                  >
                    საქველმოქმედო ლიგა &rarr;
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Live Visitor & Quiz Button Counters */}
          <div className="pt-3.5 border-t border-black/10 dark:border-[#f5f2eb]/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-stone-700 dark:text-[#a8a495] font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ლაივ აქტივობა:</span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3">
              {/* Site Visits Counter */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/75 dark:bg-white/5 border border-stone-300/80 dark:border-[#f5f2eb]/10 text-stone-800 dark:text-[#dedacb] shadow-sm backdrop-blur-md"
                title="საიტზე შემოსვლების (ვიზიტების) ჯამური რაოდენობა"
              >
                <Eye className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-[11px] text-stone-600 dark:text-[#a8a495]">საიტზე ვიზიტები:</span>
                <span className="font-mono font-bold text-xs text-stone-900 dark:text-[#fcfbf7] bg-stone-200/70 dark:bg-white/10 px-2 py-0.5 rounded-md">
                  {analytics.visits.toLocaleString()}
                </span>
              </div>

              {/* Unique IPs Counter */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 text-indigo-900 dark:text-indigo-200 shadow-sm backdrop-blur-md"
                title="განსხვავებული უნიკალური IP მისამართების (ვიზიტორების) რაოდენობა"
              >
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-[11px] text-indigo-700 dark:text-[#a8a495]">უნიკალური IP:</span>
                <span className="font-mono font-bold text-xs text-indigo-950 dark:text-indigo-100 bg-indigo-200/70 dark:bg-indigo-500/30 px-2 py-0.5 rounded-md">
                  {analytics.uniqueIpsCount.toLocaleString()}
                </span>
              </div>

              {/* Quiz Clicks Counter */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-100/70 dark:bg-red-500/10 border border-red-300/80 dark:border-red-500/25 text-red-800 dark:text-red-200 shadow-sm backdrop-blur-md"
                title="„ქვიზი“-ს ღილაკზე დაჭერების ჯამური რაოდენობა"
              >
                <Flame className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                <span className="text-[11px] text-red-800 dark:text-red-300">„ქვიზი“-ს ნახვები:</span>
                <span className="font-mono font-bold text-xs text-red-950 dark:text-white bg-red-200 dark:bg-red-500/40 px-2 py-0.5 rounded-md">
                  {analytics.quizClicks.toLocaleString()}
                </span>
              </div>

              {/* Detailed Analytics Modal Trigger */}
              <button
                onClick={() => setIsAnalyticsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/35 text-purple-700 dark:text-purple-300 shadow-sm backdrop-blur-md transition-all cursor-pointer font-bold text-xs"
                title="სრული ანალიტიკის ნახვა: ტაბები, ტესტები, ღია პასუხების ხარისხი და მოსმენა"
              >
                <BarChart3 className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                <span>სრული ანალიტიკა 📊</span>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Analytics Dashboard Modal */}
      <AnalyticsDashboardModal
        isOpen={isAnalyticsModalOpen}
        onClose={() => setIsAnalyticsModalOpen(false)}
      />
    </div>
  );
};
