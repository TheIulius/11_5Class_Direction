import React, { useState, useEffect } from 'react';
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

interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

const LOCKED_TABS: ActiveTab[] = ['homework', 'opportunities', 'ideas', 'clubs'];

export const CampaignApp: React.FC<CampaignAppProps> = ({ onSwitchToFantasy }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
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

      {/* Minimalist Footer in Georgian */}
      <footer className="relative z-10 w-full border-t border-[#f5f2eb]/10 py-8 px-4 sm:px-6 text-xs text-[#a8a495] bg-[#0c0d14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-[#fcfbf7]">
              11/5 <span className="text-[10px] font-normal lowercase opacity-75 mx-0.5">class</span> Platform
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
                  className="text-[#a8a495] hover:text-[#fcfbf7] transition-colors cursor-pointer"
                >
                  საქველმოქმედო ლიგა &rarr;
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
