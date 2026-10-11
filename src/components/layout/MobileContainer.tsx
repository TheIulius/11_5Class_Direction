import React from 'react';
import { TopHeader } from './TopHeader';
import { DesktopSidebar } from './DesktopSidebar';
import { BottomNav } from './BottomNav';
import { ManagerModal } from './ManagerModal';
import { AuthModal } from './AuthModal';
import { RulesModal } from '../common/RulesModal';
import { useFPL } from '../../context/FPLContext';

interface MobileContainerProps {
  children: React.ReactNode;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ children }) => {
  const {
    isManagerModalOpen,
    setIsManagerModalOpen,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isRulesModalOpen,
    setIsRulesModalOpen,
    rulesModalTab,
    activeTab,
    isModerator,
  } = useFPL();

  const isDevMode = activeTab === 'dev' && isModerator;

  return (
    <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 select-none transition-colors duration-200">
      {/* Mobile-Only Ultra-Compact Header */}
      {!isDevMode && <TopHeader />}

      {/* Main Layout Container: Desktop Sidebar + View Canvas */}
      <div className="w-full flex-1 flex min-h-screen">
        {/* Left Column (Desktop Fixed Sidebar) */}
        {!isDevMode && <DesktopSidebar />}

        {/* View Canvas Area */}
        <main
          className={`flex-1 min-w-0 w-full flex flex-col ${
            isDevMode
              ? 'p-0 pb-12'
              : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-6'
          }`}
        >
          <div className="w-full flex-1 min-w-0">{children}</div>

          {/* Minimal Watermark (non-team tabs & non-dev) */}
          {!isDevMode && activeTab !== 'team' && (
            <footer className="pt-6 pb-6 text-center select-none space-y-1.5 border-t border-slate-200/70 dark:border-white/5 mt-auto max-w-6xl mx-auto px-4">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide">
                © Komarovi Charity League • Sports Command Center
              </p>
            </footer>
          )}
        </main>
      </div>

      {/* Fixed Bottom Navigation (Mobile Only) */}
      {!isDevMode && <BottomNav />}

      {/* Friend Manager Switcher / Join Modal */}
      <ManagerModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
      />

      {/* Secure User Registration / Password Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Official Rules & Scoring Modal */}
      <RulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        initialTab={rulesModalTab}
      />
    </div>
  );
};
