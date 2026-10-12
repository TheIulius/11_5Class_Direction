import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { RealCalendarView } from './components/RealCalendarView';
import { HomeworkSection } from './components/HomeworkSection';
import { OpportunitiesSection } from './components/OpportunitiesSection';
import { IdeaBoardSection } from './components/IdeaBoardSection';
import { ClubFastTrackSection } from './components/ClubFastTrackSection';
import { StudyMatcherSection } from './components/StudyMatcherSection';
import { BackgroundClassPhotos } from './components/BackgroundClassPhotos';

interface CampaignAppProps {
  onSwitchToFantasy?: () => void;
}

export const CampaignApp: React.FC<CampaignAppProps> = ({ onSwitchToFantasy }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0b0c13] text-[#f5f2eb] flex flex-col font-sans selection:bg-[#f5f2eb] selection:text-[#0b0c13] antialiased overflow-x-hidden">
      {/* Subtle Scattered Class Photos in Background */}
      <BackgroundClassPhotos />

      {/* Translucent Frosted Glass Sticky Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* Main Tab Content */}
      <main className="relative z-10 flex-1 w-full pb-20">
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

        {activeTab === 'homework' && (
          <div className="pt-4 sm:pt-6">
            <HomeworkSection />
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="pt-4 sm:pt-6">
            <OpportunitiesSection />
          </div>
        )}

        {activeTab === 'ideas' && (
          <div className="pt-4 sm:pt-6">
            <IdeaBoardSection />
          </div>
        )}

        {activeTab === 'clubs' && (
          <div className="pt-4 sm:pt-6">
            <ClubFastTrackSection />
          </div>
        )}
      </main>

      {/* Minimalist Footer in Georgian */}
      <footer className="relative z-10 w-full border-t border-[#f5f2eb]/10 py-8 px-4 sm:px-6 text-xs text-[#a8a495] bg-[#0c0d14]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#fcfbf7]">11/5 Direction</span>
            <span>&bull;</span>
            <span>მე-11 კლასის საპრეზიდენტო პლატფორმა</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            {onSwitchToFantasy && (
              <button
                onClick={onSwitchToFantasy}
                className="text-[#a8a495] hover:text-[#fcfbf7] transition-colors cursor-pointer"
              >
                საქველმოქმედო ლიგა &rarr;
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
