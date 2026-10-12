import React, { useState } from 'react';
import { CampaignApp } from './campaign/CampaignApp';
import { FPLProvider, useFPL } from './context/FPLContext';
import { MobileContainer } from './components/layout/MobileContainer';
import { PickTeamView } from './components/views/PickTeamView';
import { TransfersView } from './components/views/TransfersView';
import { PlayersView } from './components/views/PlayersView';
import { StandingsView } from './components/views/StandingsView';
import { FixturesView } from './components/views/FixturesView';
import { ManagersView } from './components/views/ManagersView';
import { AdminPortal } from './components/admin/AdminPortal';
import { MatchDayAdmin } from './components/admin/MatchDayAdmin';
import { AuthLandingView } from './components/auth/AuthLandingView';
import { PendingApprovalOverlay } from './components/auth/PendingApprovalOverlay';
import { StudentProfileModal } from './components/auth/StudentProfileModal';
import { UpdateNotesModal } from './components/common/UpdateNotesModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const FantasyAppContent: React.FC<{ onReturnToCampaign: () => void }> = ({ onReturnToCampaign }) => {
  const { activeTab, setActiveTab, authUser, isModerator, isReferee, openRulesModal } = useFPL();

  React.useEffect(() => {
    if (activeTab === 'team') {
      document.documentElement.classList.add('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      document.body.classList.add('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.add('overflow-hidden', 'h-[100dvh]');
      }
    } else {
      document.documentElement.classList.remove('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      document.body.classList.remove('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.remove('overflow-hidden', 'h-[100dvh]');
      }
    }
    return () => {
      document.documentElement.classList.remove('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      document.body.classList.remove('overflow-hidden', 'h-[100dvh]', 'overscroll-none');
      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.classList.remove('overflow-hidden', 'h-[100dvh]');
      }
    };
  }, [activeTab]);

  return (
    <div className="relative min-h-screen w-full bg-[#090d16]">
      {/* Return to Campaign Top Banner */}
      <div className="bg-gradient-to-r from-purple-900/90 to-cyan-900/90 border-b border-cyan-500/30 px-3 py-1.5 flex items-center justify-between text-xs text-white z-50 sticky top-0">
        <span className="font-mono text-[11px] font-bold">⚽ Fantasy League Archive Mode</span>
        <button
          onClick={onReturnToCampaign}
          className="px-2.5 py-0.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] uppercase tracking-wider cursor-pointer transition-colors"
        >
          &larr; Return to Presidential Portal
        </button>
      </div>

      {!authUser ? (
        <AuthLandingView />
      ) : !(authUser.isAdmin || Boolean(authUser.isApproved)) ? (
        <PendingApprovalOverlay />
      ) : (
        <MobileContainer>
          {activeTab === 'team' && <PickTeamView />}
          {activeTab === 'transfers' && <TransfersView />}
          {activeTab === 'players' && <PlayersView />}
          {(activeTab === 'standings' || (activeTab as any) === 'leagues' || (activeTab as any) === 'points') && (
            <StandingsView />
          )}
          {activeTab === 'fixtures' && <FixturesView />}
          {activeTab === 'managers' && (isModerator ? <ManagersView /> : <PickTeamView />)}
          {activeTab === 'dev' && (
            isModerator ? (
              <AdminPortal />
            ) : isReferee ? (
              <div className="space-y-4">
                <MatchDayAdmin />
              </div>
            ) : (
              <PickTeamView />
            )
          )}
        </MobileContainer>
      )}
      <StudentProfileModal />
      <UpdateNotesModal onOpenRulesHistory={() => openRulesModal('updates')} />
    </div>
  );
};

export default function App() {
  const [viewMode, setViewMode] = useState<'campaign' | 'fantasy'>('campaign');

  if (viewMode === 'fantasy') {
    return (
      <ErrorBoundary>
        <FPLProvider>
          <FantasyAppContent onReturnToCampaign={() => setViewMode('campaign')} />
        </FPLProvider>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <CampaignApp onSwitchToFantasy={() => setViewMode('fantasy')} />
    </ErrorBoundary>
  );
}
