import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';

export const useItemActions = () => {
  const { state, dispatch } = useGame();
  const [processingItemId, setProcessingItemId] = React.useState<string | null>(null);
  const [showMonsterSelection, setShowMonsterSelection] = React.useState<string | null>(null);

  const handleUseItem = async (itemId: string, targetMonsterId?: string) => {
    if (!state.currentRun || processingItemId === itemId) return;

    setProcessingItemId(itemId);
    try {
      let result;
      
      // Handle items that require monster selection
      if (targetMonsterId) {
        result = await gameApi.useItem(state.currentRun.id, itemId, targetMonsterId);
      } else {
        result = await gameApi.useItem(state.currentRun.id, itemId);
      }
      
      if (result.success) {
        dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
        // Show success message to user
        alert(result.message);
      } else {
        // Show error message to user
        alert(result.message);
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to use item' });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleItemClick = (item: { id: string; type?: string }) => {
    // Items that require monster selection
    if (item.id === 'rare_candy' || 
        item.id === 'elixir' || 
        item.id === 'max_elixir' ||
        item.type === 'healing') { // All healing items now require target selection
      setShowMonsterSelection(item.id);
    } else {
      handleUseItem(item.id);
    }
  };

  const handleMonsterSelection = (itemId: string, monsterId: string) => {
    setShowMonsterSelection(null);
    handleUseItem(itemId, monsterId);
  };

  return {
    handleUseItem,
    handleItemClick,
    handleMonsterSelection,
    processingItemId,
    showMonsterSelection,
    setShowMonsterSelection
  };
};
