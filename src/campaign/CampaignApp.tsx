import React, { useState, useEffect } from 'react';
import { Lock, Flame, Calendar, ArrowLeft } from 'lucide-react';
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
import { soundEffects } from './utils/soundEffects';

interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

const LOCKED_TABS: ActiveTab[] = ['homework', 'opportunities', 'ideas', 'clubs'];

const LOCKED_TAB_LABELS: Record<string, string> = {
  homework: 'დავალებები & ცხრილი',
  opportunities: 'შესაძლებლობები (ZOOM შეხვედრები)',
  ideas: 'იდეების დაფა',
  clubs: 'კლუბების "მწვანე შუქი"'
};

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
            {/* Blurred & Non-Interactive Underlying Page Preview */}
            <div
              aria-hidden="true"
              className="w-full h-full overflow-hidden pointer-events-none select-none filter blur-md sm:blur-lg opacity-35 scale-[0.99] transition-all duration-300 pt-4 sm:pt-6"
            >
              {activeTab === 'homework' && <HomeworkSection />}
              {activeTab === 'opportunities' && <OpportunitiesSection />}
              {activeTab === 'ideas' && <IdeaBoardSection />}
              {activeTab === 'clubs' && <ClubFastTrackSection />}
            </div>

            {/* Full-Viewport Frosted Lock Overlay */}
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 sm:p-6 bg-[#0b0c13]/55 backdrop-blur-md">
              <div className="max-w-lg w-full rounded-3xl border border-[#f5f2eb]/20 bg-[#141522]/90 p-7 sm:p-10 text-center shadow-2xl space-y-5 backdrop-blur-2xl">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f2eb]/10 border border-[#f5f2eb]/20 flex items-center justify-center mx-auto text-[#fcfbf7] shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-[#a8a495]">
                    {LOCKED_TAB_LABELS[activeTab] || 'სექცია დაბლოკილია'}
                  </div>
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tight uppercase text-[#fcfbf7]">
                    COMING SOON!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#c5c1b2] max-w-md mx-auto leading-relaxed pt-1">
                    ეს ფუნქცია სრულად გაიხსნება არჩევნების შემდეგ. მანამდე გამოიყენეთ <strong className="text-[#fcfbf7]">ჭკვიანი კალენდარი</strong> და <strong className="text-red-300">ორშაბათის ქართულის ქვიზის</strong> მოსამზადებელი გვერდი!
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      soundEffects.click();
                      handleSelectTab('quiz');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all cursor-pointer"
                  >
                    <Flame className="w-4 h-4 fill-current" />
                    <span>ქვიზი (ორშაბათი)</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.click();
                      handleSelectTab('calendar');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-[#f5f2eb]/20 bg-[#1b1c2c] hover:bg-[#24263b] text-[#fcfbf7] font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>კალენდარი</span>
                  </button>

                  <button
                    onClick={() => {
                      soundEffects.click();
                      handleSelectTab('hero');
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-[#f5f2eb]/15 bg-white/5 hover:bg-white/10 text-[#d4d1c5] font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>მთავარი</span>
                  </button>
                </div>

                <div className="pt-1 text-[10px] font-mono text-[#7c796e]/75 select-none">
                  11/5 Direction &bull; made by Theiulius
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Minimalist Footer in Georgian */}
      <footer className="relative z-10 w-full border-t border-[#f5f2eb]/10 py-8 px-4 sm:px-6 text-xs text-[#a8a495] bg-[#0c0d14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-[#fcfbf7]">11/5 Direction</span>
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
