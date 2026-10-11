import React, { useRef, useTransition, useCallback } from 'react';
import { useFPL, TabType } from '../../context/FPLContext';
import { Shirt, ArrowLeftRight, Trophy, Calendar, Wrench, Shield, Users, Award } from 'lucide-react';
import { motion, PanInfo } from 'framer-motion';
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
  const [, startTransition] = useTransition();
  const navRef = useRef<HTMLElement>(null);

  const visibleTabs = TABS.filter((tab) => tab.id !== 'dev' || isModerator || isReferee);
  const activeIndex = visibleTabs.findIndex((tab) => tab.id === activeTab);

  const handleTabChange = useCallback(
    (tabId: TabType) => {
      if (tabId === activeTab) return;
      triggerHaptic('light');
      startTransition(() => {
        setActiveTab(tabId);
      });
    },
    [activeTab, setActiveTab]
  );

  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const navEl = navRef.current;
      const navWidth = navEl ? navEl.clientWidth : 320;
      const tabWidth = navWidth / visibleTabs.length;
      const stepCount = Math.round(info.offset.x / tabWidth);

      // If user dragged past one or more full tab widths
      if (Math.abs(stepCount) >= 1) {
        const targetIdx = Math.max(0, Math.min(visibleTabs.length - 1, activeIndex + stepCount));
        if (targetIdx !== activeIndex) {
          triggerHaptic('light');
          handleTabChange(visibleTabs[targetIdx].id);
          return;
        }
      }

      const threshold = 25;
      const velocityThreshold = 200;

      // Quick flick or threshold offset detection
      if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
        if (activeIndex < visibleTabs.length - 1) {
          triggerHaptic('light');
          handleTabChange(visibleTabs[activeIndex + 1].id);
        }
      } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
        if (activeIndex > 0) {
          triggerHaptic('light');
          handleTabChange(visibleTabs[activeIndex - 1].id);
        }
      }
    },
    [activeIndex, visibleTabs, handleTabChange]
  );

  return (
    <div className="md:hidden fixed bottom-[max(0.6rem,env(safe-area-inset-bottom))] inset-x-3 max-w-md mx-auto z-40 select-none">
      <nav
        ref={navRef}
        className="relative w-full rounded-full bg-[#070b12]/95 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] py-1 px-1.5 flex items-center justify-between"
      >
        {visibleTabs.map((tab) => {
          const isDev = tab.id === 'dev';
          const Icon = isDev ? (isModerator ? Shield : Award) : tab.icon;
          const isActive = activeTab === tab.id;
          const displayLabel = isDev ? (isModerator ? 'Mod' : 'Ref') : tab.label;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex-1 py-1.5 px-1 flex flex-col items-center justify-center transition-all group z-10 cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Highlight (Draggable iOS Dynamic Indicator) */}
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  drag="x"
                  dragConstraints={navRef}
                  dragElastic={0.15}
                  dragSnapToOrigin={true}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 rounded-full bg-white/15 border border-white/20 shadow-xs cursor-grab active:cursor-grabbing touch-none z-0 will-change-transform"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative flex items-center justify-center pointer-events-none z-10">
                <Icon
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                />
                {isDev && (isDevAuthenticated || isReferee) && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </div>

              <span
                className={`text-[9.5px] mt-0.5 tracking-tight truncate max-w-[50px] leading-tight transition-colors pointer-events-none z-10 ${
                  isActive ? 'font-bold text-white' : 'font-medium text-slate-400'
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
