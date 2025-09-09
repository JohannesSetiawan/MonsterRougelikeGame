import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { useBattleState } from '../hooks/useBattleState';
import { useBattleActions } from '../hooks/useBattleActions';
import { useBattleInitialization } from '../hooks/useBattleInitialization';
import ItemBag from './ItemBag';
import MonsterStatsModal from './MonsterStatsModal';
import MoveInfo from './MoveInfo';
import AbilityInfo from './AbilityInfo';
import BattleMonsterCard from './BattleMonsterCard';
import TurnOrderDisplay from './TurnOrderDisplay';
import BattleLog from './BattleLog';
import MoveSelection from './MoveSelection';
import BattleActions from './BattleActions';

const BattleInterface: React.FC = () => {
  const { state } = useGame();
  const [showItemBag, setShowItemBag] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showOpponentStats, setShowOpponentStats] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  const playerMonster = state.battleState.playerMonster;
  const opponentMonster = state.battleState.opponentMonster;
  const currentRun = state.currentRun;

  // Use battle state hook
  const {
    isProcessing,
    battleLog,
    battleEnded,
    movesData,
    battleContext,
    criticalHitEffect,
    playerGoesFirst,
    showTurnOrder,
    setBattleLog,
    setIsProcessing,
    setBattleEnded,
    setMovesData,
    setBattleContext,
    setCriticalHitEffect,
    setPlayerGoesFirst,
    setShowTurnOrder,
    battleInitializationRef,
    resetBattleState
  } = useBattleState();

  // Use battle initialization hook
  useBattleInitialization({
    playerMonster,
    opponentMonster,
    currentRun,
    battleInitializationRef,
    setIsProcessing,
    setBattleLog,
    setBattleContext,
    setPlayerGoesFirst,
    setShowTurnOrder,
    setMovesData
  });

  // Use battle actions hook
  const { handleAttack, handleUseItem, handleFlee } = useBattleActions({
    currentRun: currentRun!,
    playerMonster: playerMonster!,
    opponentMonster: opponentMonster!,
    battleContext,
    playerGoesFirst,
    isProcessing,
    battleEnded,
    setIsProcessing,
    setBattleLog,
    setBattleEnded,
    setBattleContext,
    setCriticalHitEffect,
    resetBattleState
  });

  if (!playerMonster || !opponentMonster || !currentRun) return null;

  const handleOpenBag = () => {
    if (isProcessing || battleEnded) return;
    setShowItemBag(true);
  };

  const handleCloseBag = () => {
    if (!isProcessing) {
      setShowItemBag(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Battle Field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opponent Monster */}
          <BattleMonsterCard
            monster={opponentMonster}
            isPlayer={false}
            goesFirst={!playerGoesFirst}
            showTurnOrder={showTurnOrder}
            criticalHitEffect={criticalHitEffect}
            onStatsClick={() => setShowOpponentStats(true)}
            onAbilityClick={setSelectedAbility}
            isProcessing={isProcessing}
          />

          {/* Player Monster */}
          <BattleMonsterCard
            monster={playerMonster}
            isPlayer={true}
            goesFirst={playerGoesFirst}
            showTurnOrder={showTurnOrder}
            criticalHitEffect={criticalHitEffect}
            onStatsClick={() => setShowPlayerStats(true)}
            onAbilityClick={setSelectedAbility}
            isProcessing={isProcessing}
          />
        </div>

        {/* Turn Order Display */}
        <TurnOrderDisplay
          showTurnOrder={showTurnOrder}
          playerMonster={playerMonster}
          opponentMonster={opponentMonster}
          playerGoesFirst={playerGoesFirst}
          battleLog={battleLog}
        />

        {/* Battle Log */}
        <BattleLog
          battleLog={battleLog}
          isProcessing={isProcessing}
        />

        {/* Battle Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Moves Section */}
          <MoveSelection
            playerMonster={playerMonster}
            movesData={movesData}
            onAttack={handleAttack}
            onMoveInfo={setSelectedMove}
            isProcessing={isProcessing}
            battleEnded={battleEnded}
          />

          {/* Other Actions */}
          <BattleActions
            onOpenBag={handleOpenBag}
            onFlee={handleFlee}
            isProcessing={isProcessing}
            battleEnded={battleEnded}
          />
        </div>

        {/* Modals */}
        {showItemBag && (
          <ItemBag
            inventory={currentRun.inventory}
            onUseItem={handleUseItem}
            onClose={handleCloseBag}
            isProcessing={isProcessing}
            inBattle={true}
            activeMonster={playerMonster}
            movesData={movesData}
          />
        )}

        {showPlayerStats && (
          <MonsterStatsModal
            monster={{
              ...playerMonster,
              statModifiers: battleContext?.playerStatModifiers
            }}
            onClose={() => setShowPlayerStats(false)}
          />
        )}

        {showOpponentStats && (
          <MonsterStatsModal
            monster={{
              ...opponentMonster,
              statModifiers: battleContext?.opponentStatModifiers
            }}
            onClose={() => setShowOpponentStats(false)}
          />
        )}

        {selectedMove && (
          <MoveInfo 
            moveId={selectedMove} 
            onClose={() => setSelectedMove(null)} 
          />
        )}

        {selectedAbility && (
          <AbilityInfo 
            abilityId={selectedAbility} 
            onClose={() => setSelectedAbility(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default BattleInterface;
