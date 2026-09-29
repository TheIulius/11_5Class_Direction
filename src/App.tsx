import React from 'react';
import { FPLProvider, useFPL } from './context/FPLContext';
import { MobileContainer } from './components/layout/MobileContainer';
import { PickTeamView } from './components/views/PickTeamView';
import { TransfersView } from './components/views/TransfersView';
import { PlayersView } from './components/views/PlayersView';
import { StandingsView } from './components/views/StandingsView';
import { FixturesView } from './components/views/FixturesView';
import { ManagersView } from './components/views/ManagersView';
import { AdminPortal } from './components/admin/AdminPortal';
import { AuthLandingView } from './components/auth/AuthLandingView';
import { PendingApprovalOverlay } from './components/auth/PendingApprovalOverlay';
import { StudentProfileModal } from './components/auth/StudentProfileModal';
import { UpdateNotesModal } from './components/common/UpdateNotesModal';

const AppContent: React.FC = () => {
  const { activeTab, authUser, isModerator, openRulesModal } = useFPL();

  if (!authUser) {
    return <AuthLandingView />;
  }

  const isAccountApproved = authUser.isAdmin || Boolean(authUser.isApproved);

  return (
    <div className="relative min-h-screen w-full">
      {!isAccountApproved ? (
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
          {activeTab === 'dev' && (isModerator ? <AdminPortal /> : <PickTeamView />)}
        </MobileContainer>
      )}
      <StudentProfileModal />
      <UpdateNotesModal onOpenRulesHistory={() => openRulesModal('updates')} />
    </div>
  );
};

export default function App() {
  return (
    <FPLProvider>
      <AppContent />
    </FPLProvider>
  );
}
