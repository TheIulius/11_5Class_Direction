import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Coins } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

export type ActiveTab = 'hero' | 'calendar' | 'homework' | 'opportunities' | 'ideas' | 'clubs';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenIlo777: () => void;
}

const NAV_LINKS: { id: ActiveTab; label: string }[] = [
  { id: 'hero', label: 'მთავარი' },
  { id: 'calendar', label: 'კალენდარი' },
  { id: 'homework', label: 'დავალებები' },
  { id: 'opportunities', label: 'შესაძლებლობები' },
  { id: 'ideas', label: 'იდეები' },
  { id: 'clubs', label: 'კლუბები' }
];

export const Navbar: React.FC<NavbarProps> = ({ activeTab, onSelectTab, onOpenIlo777 }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleClick = (id: ActiveTab) => {
    soundEffects.click();
    onSelectTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-[#12131d]/80 border-b border-[#f5f2eb]/12 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => handleClick('hero')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-md bg-[#f5f2eb]/15 border border-[#f5f2eb]/20 flex items-center justify-center text-xs font-mono font-bold text-[#fcfbf7] group-hover:bg-[#f5f2eb] group-hover:text-[#0c0d12] transition-colors">
            11
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#fcfbf7] group-hover:text-white transition-colors">
            11/5 Direction
          </span>
        </button>

        {/* Crisp Georgian Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#171825]/60 border border-[#f5f2eb]/10 backdrop-blur-xl">
          {NAV_LINKS.map(link => {
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => handleClick(link.id)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'text-[#0c0d12] font-semibold bg-[#f5f2eb] shadow-sm'
                    : 'text-[#c7c4b5] hover:text-[#fcfbf7] hover:bg-white/5'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right End: Subtle ilo777slots button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.click();
              onOpenIlo777();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#f5f2eb]/15 bg-[#f5f2eb]/8 hover:bg-[#f5f2eb]/15 text-xs text-[#dedacb] hover:text-white font-medium transition-all cursor-pointer active:scale-98"
          >
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono">ilo777slots</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#dedacb] hover:text-white cursor-pointer"
            aria-label="მენიუს გახსნა"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#f5f2eb]/10 bg-[#12131d]/95 backdrop-blur-2xl px-4 py-3 space-y-1"
          >
            {NAV_LINKS.map(link => {
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleClick(link.id)}
                  className={`w-full text-left py-2 px-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#f5f2eb] text-[#0c0d12] font-semibold'
                      : 'text-[#d4d1c5] hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
