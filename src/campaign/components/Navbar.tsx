import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckSquare,
  FolderOpen,
  MoreHorizontal,
  Sun,
  Moon,
  Shield,
  LogIn,
  LogOut,
  User,
  Compass,
  MessageSquare,
  Rocket,
  Play,
  X,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';
import { usePlatform } from '../context/PlatformContext';

export type ActiveTab =
  | 'home'
  | 'calendar'
  | 'homework'
  | 'materials'
  | 'opportunities'
  | 'ideas'
  | 'clubs'
  | 'about';

export interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenVideo?: () => void;
}

export interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenVideo?: () => void;
}

const DESKTOP_NAV_LINKS: { id: ActiveTab; label: string }[] = [
  { id: 'home', label: 'მთავარი' },
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'homework', label: 'დავალებები & ცხრილი' },
  { id: 'materials', label: 'მასალები' },
  { id: 'opportunities', label: 'შესაძლებლობები' },
  { id: 'ideas', label: 'იდეები' },
  { id: 'clubs', label: 'კლუბები' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  theme,
  onToggleTheme,
}) => {
  const { user, isAdmin, pendingCounts, openAuthModal, openAdminModal, logout } = usePlatform();

  const handleNavClick = (tab: ActiveTab) => {
    soundEffects.click();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-13 sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Identity */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer shrink-0"
          aria-label="მთავარ გვერდზე გადასვლა"
        >
          <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center font-mono font-bold text-xs shadow-xs group-hover:opacity-90 transition-opacity">
            11/5
          </div>
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-1.5">
              <span>კომაროვი</span>
              <span className="hidden sm:inline text-[11px] font-normal text-[var(--text-muted)]">
                &bull; 11/5 კლასი
              </span>
            </span>
          </div>
        </button>

        {/* Desktop Nav Links (Hidden on Mobile) */}
        <nav className="hidden lg:flex items-center gap-1 p-1 rounded-xl glass-pill">
          {DESKTOP_NAV_LINKS.map((link) => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer relative whitespace-nowrap ${
                  isActive
                    ? 'btn-primary font-semibold shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
            title={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Admin Badge & Quick Access (If Admin, desktop only) */}
          {isAdmin && (
            <button
              onClick={() => openAdminModal('approvals')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 text-xs font-semibold hover:bg-amber-500/25 transition-colors cursor-pointer"
              title="ადმინ პანელი"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>ადმინი</span>
              {pendingCounts.total > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCounts.total}
                </span>
              )}
            </button>
          )}

          {/* User Session Profile Pill or Sign In Button */}
          {user ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openAdminModal('users')}
                className="px-2 sm:px-2.5 py-1 rounded-xl card-third text-[var(--text-primary)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer max-w-[120px] sm:max-w-[140px]"
                title="აქაუნთი"
              >
                <User className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                <span className="truncate">{user.fullName || user.username}</span>
              </button>
              <button
                onClick={logout}
                className="p-1.5 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="გამოსვლა"
                aria-label="გამოსვლა"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl btn-primary text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>შესვლა</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenVideo,
}) => {
  const { isAdmin, pendingCounts, openAdminModal } = usePlatform();
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);

  const handleNavClick = (tab: ActiveTab) => {
    soundEffects.click();
    onSelectTab(tab);
    setIsMoreSheetOpen(false);
  };

  const isMoreActive =
    isMoreSheetOpen ||
    activeTab === 'opportunities' ||
    activeTab === 'ideas' ||
    activeTab === 'clubs' ||
    activeTab === 'about';

  return (
    <>
      {/* Mobile Bottom Tab Bar (iOS Liquid Glass - Always Z-50 Above Footer) */}
      <nav
        aria-label="მობილური ნავიგაცია"
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 glass-sheet pb-[max(0.5rem,env(safe-area-inset-bottom,16px))] pt-1 transition-colors select-none"
      >
        <div className="grid grid-cols-5 h-12 items-center px-1 max-w-md mx-auto">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'home'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                activeTab === 'home' ? 'btn-primary text-white shadow-xs' : 'card-third text-[var(--text-secondary)]'
              }`}
            >
              11
            </div>
            <span className="text-[10px] leading-none">მთავარი</span>
            {activeTab === 'home' && <span className="w-1 h-1 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 2: Calendar */}
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'calendar'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-[10px] leading-none">კალენდარი</span>
            {activeTab === 'calendar' && <span className="w-1 h-1 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 3: Homework & Timetable */}
          <button
            onClick={() => handleNavClick('homework')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'homework'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-[10px] leading-none">დავალებები</span>
            {activeTab === 'homework' && <span className="w-1 h-1 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 4: Materials / Archive */}
          <button
            onClick={() => handleNavClick('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[44px] ${
              activeTab === 'materials'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span className="text-[10px] leading-none">მასალები</span>
            {activeTab === 'materials' && <span className="w-1 h-1 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 5: More */}
          <button
            onClick={() => {
              soundEffects.click();
              setIsMoreSheetOpen(true);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[44px] relative ${
              isMoreActive
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span className="text-[10px] leading-none">მეტი</span>
            {isMoreActive && <span className="w-1 h-1 rounded-full bg-[var(--primary-action)] mt-0.5" />}
            {isAdmin && pendingCounts.total > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>
        </div>
      </nav>

      {/* iOS Fluid Bottom Sheet for "More" */}
      <AnimatePresence>
        {isMoreSheetOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMoreSheetOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 38 }}
              className="relative z-10 glass-sheet rounded-t-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom,20px))] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              {/* Sheet Drag Handle */}
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto" />

              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  საზოგადოება &bull; 11/5
                </span>
                <button
                  onClick={() => setIsMoreSheetOpen(false)}
                  className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of secondary destinations */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleNavClick('opportunities')}
                  className="p-3.5 rounded-2xl card-surface text-left flex flex-col gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Compass className="w-5 h-5 text-[var(--primary-action)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    შესაძლებლობები
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ალუმნები & ვებინარები
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('ideas')}
                  className="p-3.5 rounded-2xl card-surface text-left flex flex-col gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5 text-[var(--primary-action)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    იდეების დაფა
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    წინადადებები & ხმები
                  </span>
                </button>

                <button
                  onClick={() => handleNavClick('clubs')}
                  className="p-3.5 rounded-2xl card-surface text-left flex flex-col gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Rocket className="w-5 h-5 text-[var(--primary-action)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    კლუბები & ჯგუფები
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    სივრცეები & მეცადინეობა
                  </span>
                </button>

                <button
                  onClick={() => {
                    setIsMoreSheetOpen(false);
                    if (onOpenVideo) onOpenVideo();
                  }}
                  className="p-3.5 rounded-2xl card-surface text-left flex flex-col gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  <Play className="w-5 h-5 text-[var(--primary-action)]" />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    რატომ ავირჩიოთ
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    ვიდეო მიმართვა
                  </span>
                </button>
              </div>

              {/* Admin Dashboard Entry in More menu */}
              {isAdmin && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      openAdminModal('approvals');
                    }}
                    className="w-full p-3 rounded-2xl bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold text-xs flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>ადმინ პანელი (დადასტურებები & მართვა)</span>
                    </div>
                    {pendingCounts.total > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-[10px] font-bold">
                        {pendingCounts.total}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
