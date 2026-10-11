import React from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Trophy, Calendar, Wrench, Shield, Users, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'team', label: 'Team', icon: Shirt },
  { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'standings', label: 'Standings', icon: Trophy },
  { id: 'fixtures', label: 'Fixtures', icon: Calendar },
  { id: 'dev', label: 'Dev', icon: Wrench },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isDevAuthenticated, isModerator, isReferee } = useFPL();

  const visibleTabs = TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee);

  return (
    <div className="md:hidden fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] inset-x-3 max-w-md mx-auto z-40 select-none">
      <nav className="w-full rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 px-1.5 flex items-center justify-between">
        {visibleTabs.map((tab) => {
          const isDev = tab.id === 'dev';
          const Icon = isDev ? (isModerator ? Shield : Award) : tab.icon;
          const isActive = activeTab === tab.id;
          const displayLabel = isDev ? (isModerator ? 'Mod' : 'Ref') : tab.label;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(tab.id);
              }}
              className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-all group z-10 cursor-pointer ${
                isActive ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {/* Active Pill Capsule Background */}
              {isActive && (
                <motion.div
                  layoutId="activeDockPill"
                  className="absolute inset-0 rounded-full bg-blue-50 dark:bg-sky-500/15 border border-blue-200 dark:border-sky-500/30 shadow-xs -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-blue-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                />
                {isDev && (isDevAuthenticated || isReferee) && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </div>

              <span
                className={`text-[9.5px] mt-0.5 tracking-tight truncate max-w-[50px] leading-tight transition-colors ${
                  isActive ? 'font-bold text-blue-600 dark:text-sky-400' : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {displayLabel}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
