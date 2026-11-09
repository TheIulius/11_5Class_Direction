import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar, ActiveTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealCalendarView } from './components/RealCalendarView';
import { HomeworkSection } from './components/HomeworkSection';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { IdeaBoardSection } from './components/IdeaBoardSection';
import { CommunityHubSection } from './components/CommunityHubSection';
import { ArchiveSection } from './components/ArchiveSection';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Megaphone, Shield } from 'lucide-react';

export interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

const tabToHash: Record<ActiveTab, string> = {
  home: '#home',
  calendar: '#calendar',
  homework: '#homework',
  materials: '#materials',
  opportunities: '#opportunities',
  ideas: '#ideas',
  clubs: '#clubs',
  about: '#about',
};

const hashToTab = (hash: string): ActiveTab => {
  const clean = (hash || '').replace('#', '').toLowerCase();
  switch (clean) {
    case 'home':
    case 'hero':
      return 'home';
    case 'calendar':
      return 'calendar';
    case 'homework':
    case 'timetable':
      return 'homework';
    case 'materials':
    case 'archive':
    case 'quiz':
      return 'materials';
    case 'opportunities':
      return 'opportunities';
    case 'ideas':
      return 'ideas';
    case 'clubs':
    case 'community':
    case 'study':
      return 'clubs';
    case 'manifesto':
    case 'about':
      return 'about';
    default:
      return 'home';
  }
};

const CampaignAppInner: React.FC<CampaignAppProps> = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      return hashToTab(window.location.hash);
    }
    return 'home';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('class11_5_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const { isAdmin, platform, openAdminModal } = usePlatform();

  useEffect(() => {
    try {
      localStorage.setItem('class11_5_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    } catch {}
  }, [theme]);

  // Synchronize hash on browser navigation (Back / Forward)
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(hashToTab(window.location.hash));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    const targetHash = tabToHash[tab] || '#home';
    if (window.location.hash !== targetHash) {
      try {
        window.history.pushState(null, '', targetHash);
      } catch {
        window.location.hash = targetHash;
      }
    }
  };

  return (
    <div
      className={`min-h-screen font-sans flex flex-col justify-between transition-colors duration-300 ${
        theme === 'light' ? 'theme-light bg-[#f8f9fa] text-slate-900' : 'theme-dark bg-[#0b0e17] text-[#f5f2eb]'
      }`}
    >
      <div className="relative z-10 flex-1">
        <Navbar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        {/* Site-wide Admin Announcement Banner */}
        {platform.announcement?.active && platform.announcement?.text && (
          <div
            className={`border-b px-4 py-2 text-xs font-semibold transition-colors ${
              platform.announcement.type === 'urgent'
                ? 'bg-rose-600 text-white border-rose-500'
                : platform.announcement.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-indigo-600 text-white border-indigo-500'
            }`}
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 shrink-0" />
                <span>{platform.announcement.text}</span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openAdminModal('announcement')}
                  className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-[11px] font-bold cursor-pointer"
                >
                  შეცვლა
                </button>
              )}
            </div>
          </div>
        )}

        <main className="pb-24 sm:pb-12">
          <AnimatePresence mode="wait">
            {(activeTab === 'home' || activeTab === 'about') && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                <HeroSection onNavigateTab={handleSelectTab} />
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <RealCalendarView onOpenQuiz={() => handleSelectTab('materials')} />
              </motion.div>
            )}

            {activeTab === 'homework' && (
              <motion.div
                key="homework"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <HomeworkSection />
              </motion.div>
            )}

            {activeTab === 'opportunities' && (
              <motion.div
                key="opportunities"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <OpportunitiesSection />
              </motion.div>
            )}

            {activeTab === 'ideas' && (
              <motion.div
                key="ideas"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <IdeaBoardSection />
              </motion.div>
            )}

            {activeTab === 'clubs' && (
              <motion.div
                key="clubs"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <CommunityHubSection />
              </motion.div>
            )}

            {activeTab === 'materials' && (
              <motion.div
                key="materials"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8"
              >
                <ArchiveSection />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Quiet, refined footer */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-white/10 py-6 px-4 sm:px-6 bg-white/40 dark:bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">11/5 კლასი</span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span>კომაროვის სკოლა</span>
            <span className="text-slate-300 dark:text-slate-600">&bull;</span>
            <span className="font-mono text-[11px] opacity-70">2025–2026</span>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                type="button"
                onClick={() => openAdminModal('analytics')}
                className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ადმინ პანელი &amp; ანალიტიკა</span>
              </button>
            )}
            <span className="text-[11px] opacity-50">Class 11/5 Platform</span>
          </div>
        </div>
      </footer>

      <AuthModal />
      <AdminDashboardModal />
    </div>
  );
};

export const CampaignApp: React.FC<CampaignAppProps> = (props) => {
  return (
    <PlatformProvider>
      <CampaignAppInner {...props} />
    </PlatformProvider>
  );
};