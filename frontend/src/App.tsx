import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { useResponsive } from './hooks/useResponsive';
import PlayerSetup from './components/PlayerSetup';
import StarterSelection from './components/StarterSelection';
import GameInterface from './components/GameInterface';
import BattleInterface from './components/BattleInterface';
import OrientationHint from './components/OrientationHint';
import './App.css';

const GameContent: React.FC = () => {
  const { state } = useGame();

  // Show error if any
  if (state.error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{state.error}</p>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }

  // Show battle interface if in battle
  if (state.battleState.inBattle) {
    return <BattleInterface />;
  }

  // Show game interface if player has active run
  if (state.currentRun) {
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

  const appClasses = [
    'App',
    screenInfo.isLandscape ? 'landscape' : 'portrait',
    screenInfo.isMobile ? 'mobile' : '',
    screenInfo.isTablet ? 'tablet' : '',
    screenInfo.isDesktop ? 'desktop' : '',
  ].filter(Boolean).join(' ');

  return (
    <GameProvider>
      <div className={appClasses}>
        <OrientationHint />
        <GameContent />
      </div>
    </GameProvider>
  );
}

export default App;
