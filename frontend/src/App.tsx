import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { useResponsive } from './hooks/useResponsive';
import PlayerSetup from './components/PlayerSetup';
import StarterSelection from './components/StarterSelection';
import GameInterface from './components/GameInterface';
import BattleInterface from './components/BattleInterface';
import OrientationHint from './components/OrientationHint';

const GameContent: React.FC = () => {
  const { state } = useGame();

  // Show error if any
  if (state.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive-foreground rounded-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-6">{state.error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // Show battle interface if in battle
  if (state.battleState.inBattle && state.battleState.playerMonster && state.battleState.opponentMonster) {
    return <BattleInterface />;
  }

  // Show game interface if player has active run (and not in battle)
  if (state.currentRun && !state.battleState.inBattle) {
    return <GameInterface />;
  }

  // Show starter selection if player exists but no active run
  if (state.player) {
    return <StarterSelection />;
  }

  // Show player setup if no player
  return <PlayerSetup />;
};

function App() {
  const screenInfo = useResponsive();

  return (
    <GameProvider>
      <div className={`min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground relative overflow-hidden ${
        screenInfo.isLandscape ? 'landscape' : 'portrait'
      } ${
        screenInfo.isMobile ? 'mobile' : ''
      } ${
        screenInfo.isTablet ? 'tablet' : ''
      } ${
        screenInfo.isDesktop ? 'desktop' : ''
      }`}>
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.1)_0%,transparent_50%),radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.1)_0%,transparent_50%)] pointer-events-none" />
        
        <OrientationHint />
        <GameContent />
      </div>
    </GameProvider>
  );
}

export default App;
