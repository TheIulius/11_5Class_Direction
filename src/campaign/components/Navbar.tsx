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
  const { user, isAdmin, canModerate, pendingCounts, openAuthModal, openAdminModal, logout } = usePlatform();

  const handleNavClick = (tab: ActiveTab) => {
    soundEffects.click();
    onSelectTab(tab);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-nav transition-colors">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Identity: 11⁵ Logo (Clean icon badge with 5 at index) */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center justify-center cursor-pointer shrink-0 min-h-[44px] min-w-[44px] -ml-1 group"
          aria-label="მთავარ გვერდზე გადასვლა"
          title="11⁵ მთავარი"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl btn-primary flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-all select-none">
            <span className="font-black text-sm sm:text-base tracking-tight leading-none text-white flex items-start">
              11<span className="text-[10px] sm:text-[11px] font-extrabold -mt-1 ml-0.5 opacity-95">5</span>
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer relative whitespace-nowrap min-h-[36px] flex items-center ${
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
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label={theme === 'dark' ? 'ღია თემაზე გადართვა' : 'მუქ თემაზე გადართვა'}
            title={theme === 'dark' ? 'ღია თემა' : 'მუქი თემა'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Admin / Moderator Badge & Quick Access (desktop only) */}
          {canModerate && (
            <button
              onClick={() => openAdminModal('approvals')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer min-h-[44px] ${
                isAdmin
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25 hover:bg-amber-500/25'
                  : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/25'
              }`}
              title={isAdmin ? 'ადმინ პანელი' : 'მოდერატორის პანელი'}
              aria-label={isAdmin ? 'ადმინ პანელი' : 'მოდერატორის პანელი'}
            >
              <Shield className={`w-3.5 h-3.5 ${isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`} />
              <span>{isAdmin ? 'ადმინი' : 'მოდერატორი'}</span>
              {pendingCounts.total > 0 && (
                <span className={`w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${isAdmin ? 'bg-amber-600' : 'bg-sky-600'}`}>
                  {pendingCounts.total}
                </span>
              )}
            </button>
          )}

          {/* User Session Profile Pill or Sign In Button */}
          {user ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => canModerate && openAdminModal(isAdmin ? 'users' : 'approvals')}
                className="px-2.5 sm:px-3 py-2 rounded-xl card-third text-[var(--text-primary)] text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer max-w-[120px] sm:max-w-[140px] min-h-[44px]"
                title="აქაუნთი"
                aria-label="აქაუნთის პროფილი"
              >
                <User className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                <span className="truncate">{user.fullName || user.username}</span>
              </button>
              <button
                onClick={logout}
                className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="გამოსვლა"
                aria-label="გამოსვლა"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl btn-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              aria-label="სისტემაში შესვლა"
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
  const { isAdmin, canModerate, pendingCounts, openAdminModal } = usePlatform();
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
        <div className="grid grid-cols-5 h-14 items-center px-1 max-w-md mx-auto">
          {/* Tab 1: Home */}
          <button
            onClick={() => handleNavClick('home')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[48px] py-1 ${
              activeTab === 'home'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
            aria-label="მთავარი გვერდი"
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold ${
                activeTab === 'home' ? 'btn-primary text-white shadow-xs' : 'card-third text-[var(--text-secondary)]'
              }`}
            >
              <span className="flex items-start text-[10px] font-black leading-none">
                11<span className="text-[6.5px] -mt-0.5 ml-px">5</span>
              </span>
            </div>
            <span className="text-[11px] leading-tight">მთავარი</span>
            {activeTab === 'home' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 2: Calendar */}
          <button
            onClick={() => handleNavClick('calendar')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[48px] py-1 ${
              activeTab === 'calendar'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
            aria-label="კალენდარი"
          >
            <Calendar className="w-4.5 h-4.5" />
            <span className="text-[11px] leading-tight">კალენდარი</span>
            {activeTab === 'calendar' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 3: Homework & Timetable */}
          <button
            onClick={() => handleNavClick('homework')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[48px] py-1 ${
              activeTab === 'homework'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
            aria-label="დავალებები და ცხრილი"
          >
            <CheckSquare className="w-4.5 h-4.5" />
            <span className="text-[11px] leading-tight">დავალებები</span>
            {activeTab === 'homework' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 4: Materials / Archive */}
          <button
            onClick={() => handleNavClick('materials')}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[48px] py-1 ${
              activeTab === 'materials'
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
            aria-label="სასწავლო მასალები"
          >
            <FolderOpen className="w-4.5 h-4.5" />
            <span className="text-[11px] leading-tight">მასალები</span>
            {activeTab === 'materials' && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-action)] mt-0.5" />}
          </button>

          {/* Tab 5: More */}
          <button
            onClick={() => {
              soundEffects.click();
              setIsMoreSheetOpen(true);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer min-h-[48px] py-1 relative ${
              isMoreActive
                ? 'text-[var(--primary-action)] font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium'
            }`}
            aria-label="მეტი განყოფილება"
          >
            <MoreHorizontal className="w-4.5 h-4.5" />
            <span className="text-[11px] leading-tight">მეტი</span>
            {isMoreActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary-action)] mt-0.5" />}
            {canModerate && pendingCounts.total > 0 && (
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
                  className="w-11 h-11 min-w-[44px] min-h-[44px] -mr-2.5 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  aria-label="დახურვა"
                >
                  <X className="w-5 h-5" />
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

              {/* Admin / Moderator Dashboard Entry in More menu */}
              {canModerate && (
                <div className="pt-2 border-t border-[var(--border-subtle)]">
                  <button
                    onClick={() => {
                      setIsMoreSheetOpen(false);
                      openAdminModal('approvals');
                    }}
                    className={`w-full p-3 rounded-2xl font-semibold text-xs flex items-center justify-between cursor-pointer ${
                      isAdmin
                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                        : 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'}`} />
                      <span>{isAdmin ? 'ადმინ პანელი (დადასტურებები & მართვა)' : 'მოდერატორის პანელი (დადასტურებები)'}</span>
                    </div>
                    {pendingCounts.total > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-white text-[10px] font-bold ${isAdmin ? 'bg-amber-600' : 'bg-sky-600'}`}>
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
