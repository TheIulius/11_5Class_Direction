import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar, ActiveTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealCalendarView } from './components/RealCalendarView';
import { HomeworkSection } from './components/HomeworkSection';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { IdeaBoardSection } from './components/IdeaBoardSection';
import { ClubFastTrackSection } from './components/ClubFastTrackSection';
import { StudyMatcherSection } from './components/StudyMatcherSection';
import { ArchiveSection } from './components/ArchiveSection';
import { AuthModal } from './components/AuthModal';
import { AdminDashboardModal } from './components/AdminDashboardModal';
import { BackgroundClassPhotos } from './components/BackgroundClassPhotos';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { usePlatformAnalytics } from './services/analytics';
import { AnalyticsDashboardModal } from './components/AnalyticsDashboardModal';
import { BarChart3, Megaphone, Sparkles, LogIn, Shield } from 'lucide-react';

export interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

const CampaignAppInner: React.FC<CampaignAppProps> = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const analytics = usePlatformAnalytics();
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('class11_5_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });

  const { user, isAdmin, platform, pendingCounts, openAuthModal, openAdminModal } = usePlatform();

  useEffect(() => {
    try {
      localStorage.setItem('class11_5_theme', theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'quiz') {
      setActiveTab('archive');
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div
      className={`campaign-shell campaign-parallax-wrapper relative min-h-screen font-sans selection:bg-indigo-500 selection:text-white flex flex-col justify-between transition-colors duration-300 ${
        theme === 'light' ? 'theme-light bg-[#f5f3ef] text-[#14161f]' : 'bg-[#12131d] text-[#f5f2eb]'
      }`}
    >
      <BackgroundClassPhotos />

      <div className="relative z-10">
        <Navbar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          theme={theme}
          onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        />

        {/* Site-wide Admin Announcement Banner */}
        {platform.announcement?.active && platform.announcement?.text && (
          <div
            className={`border-b px-4 py-2.5 text-xs font-bold transition-colors ${
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

        {/* Guest Recommendation Bar (Materials are public, Account recommended for comments & uploads) */}
        {!user && (
          <div className="bg-[#181a28]/90 backdrop-blur-md border-b border-[#f5f2eb]/10 px-4 py-2 text-xs text-[#f5f2eb]/85">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  საიტზე ყველა მასალის ნახვა თავისუფალია აქაუნთის გარეშეც! კომენტარების დასატოვებლად და კონსპექტების/დავალებების ასატვირთად რეკომენდირებულია აქაუნთზე შესვლა.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3 h-3" />
                  შესვლა / რეგისტრაცია
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin Quick Action Bar when logged in as Admin */}
        {isAdmin && (
          <div className="bg-amber-400/10 backdrop-blur-md border-b border-amber-400/25 px-4 py-2 text-xs text-amber-200">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  შესული ხართ როგორც <strong>ადმინისტრატორი ({user?.fullName})</strong> — ყველა ჩანართში გაქვთ დამატების, რედაქტირებისა და დადასტურების სრული უფლება.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openAdminModal('approvals')}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                >
                  დასადასტურებელი ({pendingCounts.total})
                </button>
                <button
                  type="button"
                  onClick={() => openAdminModal('users')}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] cursor-pointer"
                >
                  ადმინების / აქაუნთების მართვა
                </button>
              </div>
            </div>
          </div>
        )}

        <main>
          <AnimatePresence mode="wait">
            {activeTab === 'hero' && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
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
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              >
                <RealCalendarView onOpenQuiz={() => setActiveTab('archive')} />
              </motion.div>
            )}

            {activeTab === 'homework' && (
              <motion.div
                key="homework"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
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
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
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
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
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
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12"
              >
                <ClubFastTrackSection />
                <StudyMatcherSection />
              </motion.div>
            )}

            {(activeTab === 'archive' || activeTab === 'quiz') && (
              <motion.div
                key="archive"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
              >
                <ArchiveSection />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#f5f2eb]/10 py-10 px-4 sm:px-6 mt-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#f5f2eb]/45">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded bg-[#f5f2eb]/12 border border-[#f5f2eb]/20 flex items-center justify-center text-[10px] font-mono font-bold text-[#fcfbf7]">
              11
            </div>
            <span className="font-medium text-[#f5f2eb]/70 flex items-center">
              <span className="inline-flex items-end">
                <span>11/5</span>
                <span className="text-[8px] font-bold lowercase tracking-tight leading-none ml-0.5 mb-0.5">
                  class
                </span>
              </span>
              <span className="ml-1">Platform • კომაროვი</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-[#f5f2eb]/50 font-mono">
            <span
              title="უნიკალური IP მისამართების რაოდენობა"
              className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-bold"
            >
              🌐 უნიკალური IP: {analytics.uniqueIpsCount || 1}
            </span>
            <span
              title="საიტზე შემოსვლების რაოდენობა"
              className="px-2.5 py-1 rounded-md bg-[#f5f2eb]/5 border border-[#f5f2eb]/10"
            >
              👁 ნახვები: {analytics.visits}
            </span>
            <span
              title="არქივზე/ქვიზზე გადასვლების რაოდენობა"
              className="px-2.5 py-1 rounded-md bg-[#f5f2eb]/5 border border-[#f5f2eb]/10"
            >
              🎯 არქივი/ქვიზი: {analytics.quizClicks}
            </span>
            <button
              onClick={() => setShowAnalyticsModal(true)}
              className="px-3 py-1 rounded-md bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              დეტალური ანალიტიკა
            </button>
          </div>
        </div>
      </footer>

      <AnalyticsDashboardModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />
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
