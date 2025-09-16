import { useState, useCallback } from 'react';
import type { MonsterInstance } from '../api/types';

export interface DoubleBattleAction {
  monsterId: string;
  type: 'attack' | 'item' | 'switch';
  moveId?: string;
  targetId?: string;
  itemId?: string;
  targetMoveId?: string;
  newMonsterId?: string;
}

interface UseDoubleBattleActionsProps {
  playerMonsters: MonsterInstance[];
  isProcessing: boolean;
  battleEnded: boolean;
  onExecuteActions: (actions: DoubleBattleAction[]) => void;
}

export const useDoubleBattleActions = ({
  playerMonsters,
  isProcessing,
  battleEnded,
  onExecuteActions
}: UseDoubleBattleActionsProps) => {
  const [selectedActions, setSelectedActions] = useState<Record<string, DoubleBattleAction>>({});
  const [isSelectionPhase, setIsSelectionPhase] = useState(true);

  // Get alive player monsters
  const alivePlayerMonsters = playerMonsters.filter(m => m.currentHp > 0);

  // Check if all alive monsters have selected an action
  const allActionsSelected = alivePlayerMonsters.every(monster => 
    selectedActions[monster.id] !== undefined
  );

  const selectAction = useCallback((action: DoubleBattleAction) => {
    if (isProcessing || battleEnded || !isSelectionPhase) return;
    
    setSelectedActions(prev => ({
      ...prev,
      [action.monsterId]: action
    }));
  }, [isProcessing, battleEnded, isSelectionPhase]);

  const clearAction = useCallback((monsterId: string) => {
    if (isProcessing || battleEnded || !isSelectionPhase) return;
    
    setSelectedActions(prev => {
      const newActions = { ...prev };
      delete newActions[monsterId];
      return newActions;
    });
  }, [isProcessing, battleEnded, isSelectionPhase]);

  const executeActions = useCallback(() => {
    if (!allActionsSelected || isProcessing || battleEnded) return;
    
    const actionsToExecute = alivePlayerMonsters
      .map(monster => selectedActions[monster.id])
      .filter(action => action !== undefined);
    
    setIsSelectionPhase(false);
    onExecuteActions(actionsToExecute);
    
    // Reset for next turn
    setSelectedActions({});
    setIsSelectionPhase(true);
  }, [allActionsSelected, isProcessing, battleEnded, alivePlayerMonsters, selectedActions, onExecuteActions]);

  const resetActions = useCallback(() => {
    setSelectedActions({});
    setIsSelectionPhase(true);
  }, []);

  // Get the action selected for a specific monster
  const getSelectedAction = useCallback((monsterId: string) => {
    return selectedActions[monsterId];
  }, [selectedActions]);

  // Get summary of selected actions for display
  const getActionSummary = useCallback(() => {
    return alivePlayerMonsters.map(monster => ({
      monster,
      action: selectedActions[monster.id],
      hasSelected: selectedActions[monster.id] !== undefined
    }));
  }, [alivePlayerMonsters, selectedActions]);

  return {
    selectedActions,
    isSelectionPhase,
    allActionsSelected,
    alivePlayerMonsters,
    selectAction,
    clearAction,
    executeActions,
    resetActions,
    getSelectedAction,
    getActionSummary
  };
};