import React, { useState, memo, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import { useBattleState } from '../hooks/useBattleState';
import { useBattleActions } from '../hooks/useBattleActions';
import { useBattleInitialization } from '../hooks/useBattleInitialization';
import { useMoveLearning } from '../hooks/useMoveLearning';
import type { DoubleBattleAction } from '../hooks/useDoubleBattleActions';
import ItemBag from './ItemBag';
import MonsterStatsModal from './MonsterStatsModal';
import MoveInfo from './MoveInfo';
import AbilityInfo from './AbilityInfo';
import BattleMonsterCard from './BattleMonsterCard';
import TurnOrderDisplay from './TurnOrderDisplay';
import BattleLog from './BattleLog';
import MoveSelection from './MoveSelection';
import BattleActions from './BattleActions';
import MonsterSwitchModal from './MonsterSwitchModal';
import MoveLearningModal from './MoveLearningModal';
import MoveLearnedNotification from './MoveLearnedNotification';
import type { MoveLearnEvent } from '../api/types';

const BattleInterface: React.FC = () => {
  const { state } = useGame();
  const [showItemBag, setShowItemBag] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showOpponentStats, setShowOpponentStats] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const playerMonster = state.battleState.playerMonster;
  const opponentMonster = state.battleState.opponentMonster;
  const currentRun = state.currentRun;
  const { dispatch } = useGame();

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

  // Callback to end battle after move learning is complete
  const handleMoveLearningComplete = useCallback(() => {
    if (battleEnded) {
      setTimeout(() => {
        dispatch({ type: 'END_BATTLE' });
        resetBattleState();
      }, 2000);
    }
  }, [battleEnded, dispatch, resetBattleState]);

  // Move learning state
  const {
    isHandlingMoveLearning,
    currentMoveLearnEvent,
    startMoveLearningProcess,
    handleMoveSelection,
    handleAutoLearnedMoves,
    autoLearnedMoves,
    showAutoLearnedNotification,
    closeAutoLearnedNotification
  } = useMoveLearning(handleMoveLearningComplete);

  // Use battle actions hook
  const { handleAttack, handleUseItem, handleFlee, handleSwitch } = useBattleActions({
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
    resetBattleState,
    onMoveLearning: startMoveLearningProcess,
    onAutoLearnedMoves: (moveIds: string[]) => handleAutoLearnedMoves(moveIds, movesData || {})
  });

  if (!playerMonster || !opponentMonster || !currentRun) return null;

  // Detect if any modal is open to prevent state updates
  const isAnyModalOpen = isHandlingMoveLearning || showAutoLearnedNotification || showItemBag || 
                         showPlayerStats || showOpponentStats || showSwitchModal || 
                         !!selectedMove || !!selectedAbility;

  const handleOpenBag = () => {
    if (isProcessing || battleEnded) return;
    setShowItemBag(true);
  };

  const handleCloseBag = () => {
    if (!isProcessing) {
      setShowItemBag(false);
    }
  };

  const handleOpenSwitchModal = () => {
    if (isProcessing || battleEnded) return;
    setShowSwitchModal(true);
  };

  const handleExecuteDoubleBattleActions = async (actions: DoubleBattleAction[]) => {
    if (isProcessing || battleEnded) return;
    
    setBattleLog(prev => [...prev, { text: '⚔️ Both monsters are ready to act!' }]);
    
    // Execute each action with the existing system
    // The actions will be executed in the order selected, creating a more coordinated feel
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      if (action.type === 'attack' && action.moveId) {
        const monster = playerMonsters.find(m => m.id === action.monsterId);
        if (monster && monster.currentHp > 0) {
          setBattleLog(prev => [...prev, { text: `${monster.name} is executing their move...` }]);
          
          // Execute the attack
          handleAttack(action.moveId, action.targetId, action.monsterId);
          
          // Wait a bit before the next action
          if (i < actions.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
      // Add other action types (item, switch) as needed
    }
  };

  const handleCloseSwitchModal = () => {
    if (!isProcessing) {
      setShowSwitchModal(false);
    }
  };

  const handleMoveLearning = async (learnMove: boolean, moveToReplace?: string) => {
    if (!currentMoveLearnEvent) return;
    
    try {
      await handleMoveSelection(
        currentRun.id,
        currentMoveLearnEvent,
        learnMove,
        moveToReplace
      );
    } catch (error) {
      console.error('Error handling move learning:', error);
    }
  };

  // Check if switching is available (has other healthy monsters)
  const canSwitch = currentRun.team.filter(monster => 
    monster.id !== playerMonster.id && monster.currentHp > 0
  ).length > 0;

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
            shouldDeferUpdates={isAnyModalOpen}
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
            shouldDeferUpdates={isAnyModalOpen}
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
          {isDoubleBattle ? (
            <div className="lg:col-span-3">
              <DoubleBattleMoveSelection
                playerMonsters={playerMonsters}
                opponentMonsters={opponentMonsters}
                movesData={movesData}
                onExecuteActions={handleExecuteDoubleBattleActions}
                onMoveInfo={setSelectedMove}
                isProcessing={isProcessing}
                battleEnded={battleEnded}
              />
            </div>
          ) : (
            <MoveSelection
              playerMonster={playerMonster}
              movesData={movesData}
              onAttack={handleAttack}
              onMoveInfo={setSelectedMove}
              isProcessing={isProcessing}
              battleEnded={battleEnded}
            />
          )}

          {/* Other Actions */}
          <BattleActions
            onOpenBag={handleOpenBag}
            onSwitch={handleOpenSwitchModal}
            onFlee={handleFlee}
            isProcessing={isProcessing}
            battleEnded={battleEnded}
            canSwitch={canSwitch}
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

        <MonsterSwitchModal
          isOpen={showSwitchModal}
          onClose={handleCloseSwitchModal}
          team={currentRun.team}
          currentMonsterId={playerMonster.id}
          onSwitchMonster={handleSwitch}
          isProcessing={isProcessing}
        />

        {/* Move Learning Modal */}
        {isHandlingMoveLearning && currentMoveLearnEvent && (
          <MoveLearningModal
            key={`move-learning-${currentMoveLearnEvent.monsterId}-${currentMoveLearnEvent.newMove}`}
            isOpen={true}
            onClose={() => {}}
            moveLearnEvent={currentMoveLearnEvent}
            monster={playerMonster}
            allMoves={movesData}
            onMoveSelection={handleMoveLearning}
          />
        )}

        {/* Auto-learned Moves Notification */}
        {showAutoLearnedNotification && autoLearnedMoves.length > 0 && (
          <MoveLearnedNotification
            isOpen={showAutoLearnedNotification}
            onClose={closeAutoLearnedNotification}
            monsterName={playerMonster.name}
            learnedMoves={autoLearnedMoves}
          />
        )}
      </div>
    </div>
  );
};

export default memo(BattleInterface);
