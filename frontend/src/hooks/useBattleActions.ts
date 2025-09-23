import { useCallback } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import { useGame } from '../context/GameContext';
import type { BattleAction, MonsterInstance, GameRun, StatModifiers, MoveLearnEvent } from '../api/types';

interface UseBattleActionsProps {
  currentRun: GameRun;
  playerMonster: MonsterInstance;
  opponentMonster: MonsterInstance;
  battleContext: {
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  } | null;
  playerGoesFirst: boolean;
  isProcessing: boolean;
  battleEnded: boolean;
  battleId: string | null;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleLog: React.Dispatch<React.SetStateAction<Array<{text: string, isCritical?: boolean}>>>;
  setBattleEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleContext: React.Dispatch<React.SetStateAction<{
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  } | null>>;
  setCriticalHitEffect: React.Dispatch<React.SetStateAction<'player' | 'opponent' | null>>;
  resetBattleState: () => void;
  onMoveLearning?: (moveLearnEvents: MoveLearnEvent[]) => void;
  onAutoLearnedMoves?: (moveIds: string[], allMoves: Record<string, any>) => void;
}

export const useBattleActions = ({
  currentRun,
  playerMonster,
  opponentMonster,
  battleContext,
  playerGoesFirst,
  isProcessing,
  battleEnded,
  battleId,
  setIsProcessing,
  setBattleLog,
  setBattleEnded,
  setBattleContext,
  setCriticalHitEffect,
  resetBattleState,
  onMoveLearning,
  onAutoLearnedMoves
}: UseBattleActionsProps) => {
  const { state, dispatch } = useGame();

  const handleBattleAction = useCallback(async (action: BattleAction) => {
    if (isProcessing || battleEnded) return;
    
    if (!battleId) {
      console.error('Battle ID is required for battle actions');
      setBattleLog(prev => [...prev, { text: '⚠️ Battle not properly initialized - missing battle ID' }]);
      return;
    }
    
    setIsProcessing(true);
    try {
      const result = await gameApi.performBattleAction(
        currentRun.id,
        action,
        playerMonster.id,
        opponentMonster,
        battleId,
        battleContext || undefined,
        playerGoesFirst
      );

      // Update battle log and check for critical hits
      if (result.result.effects) {
        const hasCriticalHit = result.result.isCritical;
        setBattleLog(prev => [...prev, ...result.result.effects!.map(text => ({ 
          text, 
          isCritical: text.includes('Critical hit!') 
        }))]);
        
        // Add speed advantage message if battle ended due to speed
        if (result.result.battleEnded && 
            result.result.winner === 'player' && 
            result.result.effects!.some(effect => effect.includes('fainted')) &&
            !result.result.effects!.some(effect => effect.includes('Items are used with priority')) &&
            !result.result.effects!.some(effect => effect.includes('Catching attempts are made with priority'))) {
          const speedAdvantageMsg = playerGoesFirst ? 
            `⚡ ${playerMonster.name}'s superior speed prevented retaliation!` :
            `⚡ ${playerMonster.name} struck back with lightning speed!`;
          setBattleLog(prev => [...prev, { text: speedAdvantageMsg, isCritical: false }]);
        }
        
        // Trigger critical hit animation
        if (hasCriticalHit) {
          setCriticalHitEffect('opponent');
          setTimeout(() => setCriticalHitEffect(null), 600);
        }
      }

      // Update battle context if returned
      if (result.battleContext) {
        setBattleContext(result.battleContext);
      }

      // Update monsters
      dispatch({
        type: 'UPDATE_BATTLE_MONSTERS',
        payload: {
          player: result.updatedPlayerMonster,
          opponent: result.updatedOpponentMonster
        }
      });

      // Update run
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.updatedRun });

      // Check for move learning events
      if (result.result.moveLearnEvents && result.result.moveLearnEvents.length > 0 && onMoveLearning) {
        onMoveLearning(result.result.moveLearnEvents);
      }
      
      // Handle auto-learned moves
      if (result.result.autoLearnedMoves && result.result.autoLearnedMoves.length > 0 && onAutoLearnedMoves) {
        // We'll fetch moves data in the component that uses this hook
        onAutoLearnedMoves(result.result.autoLearnedMoves, {});
      }

      // Check for auto-switch scenario
      if (result.result.requiresAutoSwitch) {
        // The backend has already handled the auto-switch
        // Just update the display to show the new monster is active
        setBattleLog(prev => [...prev, { text: '⚡ Battle continues with your next monster!' }]);
        return; // Don't end the battle, continue with the new monster
      }

      // Check for team wipe
      if (result.teamWipe) {
        setBattleEnded(true);
        setBattleLog(prev => [...prev, { text: '💀 All your monsters have fainted! Your adventure ends here.' }]);
        setTimeout(async () => {
          if (currentRun) {
            try {
              await gameApi.endRun(currentRun.id, 'defeat');
              dispatch({ type: 'RESET_GAME' });
              resetBattleState();
              // Reload player data
              if (state.player) {
                const updatedPlayer = await gameApi.getPlayer(state.player.id);
                dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
              }
            } catch (error) {
              dispatch({ type: 'RESET_GAME' });
              resetBattleState();
            }
          }
          setBattleLog([]);
        }, 3000);
        return;
      }

      // Check if battle ended
      if (result.result.battleEnded) {
        setBattleEnded(true);
        let endDelay = 2000;
        
        // Show winner message
        if (result.result.winner === 'player') {
          setBattleLog(prev => [...prev, { text: '🎉 Victory! You won the battle!' }]);
        } else if (result.result.winner === 'opponent') {
          setBattleLog(prev => [...prev, { text: '💀 Defeat! Your monster fainted!' }]);
          endDelay = 3000;
        }
        
        // Only end battle if there are no pending move learning events
        const hasMoveEvents = result.result.moveLearnEvents && result.result.moveLearnEvents.length > 0;
        const hasAutoLearnedMoves = result.result.autoLearnedMoves && result.result.autoLearnedMoves.length > 0;
        
        if (!hasMoveEvents && !hasAutoLearnedMoves) {
          setTimeout(() => {
            dispatch({ type: 'END_BATTLE' });
            resetBattleState();
          }, endDelay);
        }
        // If there are move events, the battle will end after move learning is complete
      }

    } catch (error) {
      const errorMessage = ErrorHandler.getDisplayMessage(error, 'Action failed');
      setBattleLog(prev => [...prev, { text: `⚠️ ${errorMessage}` }]);
      ErrorHandler.handle(error, 'BattleInterface.handleBattleAction');
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing, battleEnded, battleId, currentRun, playerMonster, opponentMonster, 
    battleContext, playerGoesFirst, state.player, dispatch, setIsProcessing, 
    setBattleLog, setBattleEnded, setBattleContext, setCriticalHitEffect, resetBattleState, onMoveLearning
  ]);

  const handleAttack = useCallback((moveId: string) => {
    if (isProcessing || battleEnded) return;
    handleBattleAction({ type: 'attack', moveId });
  }, [isProcessing, battleEnded, handleBattleAction]);

  const handleUseItem = useCallback((itemId: string, targetMoveId?: string, targetMonsterId?: string) => {
    if (isProcessing || battleEnded) return;
    
    const action: BattleAction = { 
      type: 'item', 
      itemId,
      ...(targetMoveId && { targetMoveId }),
      ...(targetMonsterId && { targetId: targetMonsterId })
    };
    
    handleBattleAction(action);
  }, [isProcessing, battleEnded, handleBattleAction]);

  const handleFlee = useCallback(() => {
    if (isProcessing || battleEnded) return;
    handleBattleAction({ type: 'flee' });
  }, [isProcessing, battleEnded, handleBattleAction]);

  const handleSwitch = useCallback((newMonsterId: string) => {
    if (isProcessing || battleEnded) return;
    handleBattleAction({ type: 'switch', newMonsterId });
  }, [isProcessing, battleEnded, handleBattleAction]);

  return {
    handleAttack,
    handleUseItem,
    handleFlee,
    handleSwitch
  };
};
