import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';

export const useGameActions = () => {
  const { state, dispatch } = useGame();
  const [isEndingRun, setIsEndingRun] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleEndRun = React.useCallback(async (reason: 'victory' | 'defeat') => {
    if (!state.currentRun || isEndingRun) return;

    setIsEndingRun(true);
    try {
      await gameApi.endRun(state.currentRun.id, reason);
      dispatch({ type: 'RESET_GAME' });
      // Reload player data
      if (state.player) {
        const updatedPlayer = await gameApi.getPlayer(state.player.id);
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to end run' });
    } finally {
      setIsEndingRun(false);
    }
  }, [state.currentRun, state.player, dispatch, isEndingRun]);

  const handleSaveProgress = React.useCallback(async () => {
    if (!state.player || isSaving) return;

    setIsSaving(true);
    try {
      const result = await gameApi.savePlayerProgress(state.player.id);
      if (result.success) {
        alert('Progress saved successfully!');
      } else {
        alert('Failed to save progress: ' + result.message);
      }
    } catch (error) {
      alert('Failed to save progress. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [state.player, isSaving]);

  const handleProgressStage = async () => {
    if (!state.currentRun) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await gameApi.progressStage(state.currentRun.id);
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      
      // Check if game ended due to victory
      if (result.gameEnded && result.reason === 'victory') {
        alert(result.message || 'Congratulations! You completed the adventure!');
        await handleEndRun('victory');
        return;
      }
      
      if (result.encounter) {
        dispatch({ type: 'SET_ENCOUNTER', payload: result.encounter });
        
        // If it's a wild monster encounter, start battle
        if (result.encounter.type === 'wild_monster') {
          const activeMonster = result.run.team.find(m => m.currentHp > 0);
          if (activeMonster) {
            dispatch({ 
              type: 'START_BATTLE', 
              payload: { player: activeMonster, opponent: result.encounter.data } 
            });
          } else {
            // All monsters fainted - trigger defeat
            alert('All your monsters have fainted! Your adventure ends here.');
            await handleEndRun('defeat');
          }
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to progress stage' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return {
    handleEndRun,
    handleSaveProgress,
    handleProgressStage,
    isEndingRun,
    isSaving
  };
};
