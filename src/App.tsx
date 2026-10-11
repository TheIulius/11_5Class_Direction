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
import { MatchDayAdmin } from './components/admin/MatchDayAdmin';
import { AuthLandingView } from './components/auth/AuthLandingView';
import { PendingApprovalOverlay } from './components/auth/PendingApprovalOverlay';
import { StudentProfileModal } from './components/auth/StudentProfileModal';
import { UpdateNotesModal } from './components/common/UpdateNotesModal';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, authUser, isModerator, isReferee, openRulesModal } = useFPL();

  if (!authUser) {
    return <AuthLandingView />;
  }

  const isAccountApproved = authUser.isAdmin || Boolean(authUser.isApproved);

  return (
    <div className={`relative ${activeTab === 'team' ? 'h-[100dvh] w-full overflow-hidden overscroll-none' : 'min-h-screen w-full'}`}>
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
          {activeTab === 'dev' && (
            isModerator ? (
              <AdminPortal />
            ) : isReferee ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
                      🏁
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-950 dark:text-white uppercase tracking-wider">
                        Referee Match Console
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        შეიყვანეთ და განაახლეთ მატჩის შედეგები და მოთამაშეთა სტატისტიკა
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                      Trusted Ref
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('team')}
                      className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-xs font-bold transition-all text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      ← Team
                    </button>
                  </div>
                </div>
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
  return (
    <FPLProvider>
      <AppContent />
    </FPLProvider>
  );
}
