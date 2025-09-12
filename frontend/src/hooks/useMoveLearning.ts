import { useState, useCallback, useMemo, useRef } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import { useGame } from '../context/GameContext';
import type { MoveLearnEvent } from '../api/types';

export const useMoveLearning = (onAllMoveLearningComplete?: () => void) => {
  const { dispatch } = useGame();
  const [pendingMoveLearnEvents, setPendingMoveLearnEvents] = useState<MoveLearnEvent[]>([]);
  const [currentMoveLearnIndex, setCurrentMoveLearnIndex] = useState(0);
  const [isHandlingMoveLearning, setIsHandlingMoveLearning] = useState(false);
  
  // Auto-learned moves notification state
  const [autoLearnedMoves, setAutoLearnedMoves] = useState<{ id: string; name: string; type: string }[]>([]);
  const [showAutoLearnedNotification, setShowAutoLearnedNotification] = useState(false);

  const startMoveLearningProcess = useCallback((moveLearnEvents: MoveLearnEvent[]) => {
    if (moveLearnEvents && moveLearnEvents.length > 0) {
      setPendingMoveLearnEvents(moveLearnEvents);
      setCurrentMoveLearnIndex(0);
      setIsHandlingMoveLearning(true);
    }
  }, []);

  const handleMoveSelection = useCallback(async (
    runId: string,
    moveLearnEvent: MoveLearnEvent,
    learnMove: boolean,
    moveToReplace?: string
  ): Promise<boolean> => {
    try {
      const result = await gameApi.learnMove(
        runId,
        moveLearnEvent.monsterId,
        moveLearnEvent.newMove,
        moveToReplace,
        learnMove
      );

      if (result.success) {
        // Update the monster in the game state with the updated data from the backend
        if (result.run && result.run.team) {
          const updatedMonster = result.run.team.find(monster => monster.id === moveLearnEvent.monsterId);
          if (updatedMonster) {
            dispatch({ type: 'UPDATE_PLAYER_MONSTER', payload: updatedMonster });
          }
        }
        
        // Move to the next event or finish
        const nextIndex = currentMoveLearnIndex + 1;
        if (nextIndex >= pendingMoveLearnEvents.length) {
          // All move learning events processed
          setPendingMoveLearnEvents([]);
          setCurrentMoveLearnIndex(0);
          setIsHandlingMoveLearning(false);
          // Call completion callback after a short delay
          setTimeout(() => {
            onAllMoveLearningComplete?.();
          }, 500);
        } else {
          setCurrentMoveLearnIndex(nextIndex);
        }
        return true;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      ErrorHandler.handle(error, 'useMoveLearning.handleMoveSelection');
      throw error;
    }
  }, [currentMoveLearnIndex, pendingMoveLearnEvents.length]);

  const skipAllRemaining = useCallback(() => {
    setPendingMoveLearnEvents([]);
    setCurrentMoveLearnIndex(0);
    setIsHandlingMoveLearning(false);
  }, []);

  const handleAutoLearnedMoves = useCallback(async (moveIds: string[], allMoves: Record<string, any>) => {
    if (moveIds.length > 0) {
      const learnedMoveData = moveIds.map(moveId => {
        const move = allMoves[moveId];
        return {
          id: moveId,
          name: move?.name || moveId,
          type: move?.type || 'unknown'
        };
      });
      
      setAutoLearnedMoves(learnedMoveData);
      setShowAutoLearnedNotification(true);
    }
  }, []);

  const closeAutoLearnedNotification = useCallback(() => {
    setShowAutoLearnedNotification(false);
    setAutoLearnedMoves([]);
    // Also call completion callback when closing auto-learned notification
    setTimeout(() => {
      onAllMoveLearningComplete?.();
    }, 100);
  }, [onAllMoveLearningComplete]);

  // Calculate current move learn event with memoization
  const currentMoveLearnEvent = useMemo(() => {
    if (isHandlingMoveLearning && currentMoveLearnIndex < pendingMoveLearnEvents.length) {
      return pendingMoveLearnEvents[currentMoveLearnIndex];
    }
    return null;
  }, [isHandlingMoveLearning, currentMoveLearnIndex, pendingMoveLearnEvents]);

  return {
    // Move choice learning
    isHandlingMoveLearning,
    currentMoveLearnEvent,
    startMoveLearningProcess,
    handleMoveSelection,
    skipAllRemaining,
    remainingEvents: isHandlingMoveLearning ? pendingMoveLearnEvents.length - currentMoveLearnIndex : 0,
    
    // Auto-learned moves notification
    autoLearnedMoves,
    showAutoLearnedNotification,
    handleAutoLearnedMoves,
    closeAutoLearnedNotification
  };
};
