import React from 'react';
import { TopHeader } from './TopHeader';
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
    <div className="min-h-screen w-full flex flex-col bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 select-none transition-colors duration-200">
      {/* Top Header - decoupled in Dev Mode */}
      {!isDevMode && <TopHeader />}

      {/* Main Scrollable View Area */}
      <main className={`flex-1 w-full ${isDevMode ? 'p-0 pb-10' : 'pb-20 md:pb-10'}`}>
        <div className={`w-full ${isDevMode ? 'max-w-7xl mx-auto px-1 sm:px-2' : 'max-w-6xl mx-auto px-2 sm:px-4 md:px-6'}`}>
          {children}
        </div>

        {/* School branding & creator watermark */}
        {!isDevMode && (
          <footer className="pt-8 pb-8 text-center select-none space-y-2 border-t border-slate-200 dark:border-white/5 mt-10 max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center">
              <img src="/kcl-logo.png" alt="KCL Logo" className="h-9 md:h-11 w-auto rounded-lg object-contain shadow-xs border border-slate-200 dark:border-white/10" />
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              © Komarovi Charity League (KCL) • Created By Theiulius & Chaga
            </p>
          </footer>
        )}
      </main>

      {/* Fixed Bottom Navigation (Mobile Only) - hidden in Dev Mode */}
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
