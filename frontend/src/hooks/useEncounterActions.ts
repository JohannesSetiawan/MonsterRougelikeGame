import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';

export const useEncounterActions = () => {
  const { state, dispatch } = useGame();
  const [isProcessingEncounter, setIsProcessingEncounter] = React.useState(false);

  const handleItemEncounter = async () => {
    if (state.currentRun && state.currentEncounter?.data && !isProcessingEncounter) {
      setIsProcessingEncounter(true);
      try {
        const updatedRun = await gameApi.addItemToInventory(state.currentRun.id, state.currentEncounter.data);
        dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
        dispatch({ type: 'SET_ENCOUNTER', payload: null });
      } catch (error) {
        dispatch({ type: 'SET_ENCOUNTER', payload: null });
      } finally {
        setIsProcessingEncounter(false);
      }
    } else {
      dispatch({ type: 'SET_ENCOUNTER', payload: null });
    }
  };

  const handleRestSiteEncounter = async () => {
    if (isProcessingEncounter) return;
    setIsProcessingEncounter(true);
    
    try {
      if (state.currentRun) {
        const result = await gameApi.useRestSite(state.currentRun.id);
        
        if (result.success) {
          const updatedRun = { ...state.currentRun, team: result.team };
          dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
        }
      }
    } catch (error) {
      ErrorHandler.handle(error, 'useEncounterActions.useRestSite');
    } finally {
      dispatch({ type: 'SET_ENCOUNTER', payload: null });
      setIsProcessingEncounter(false);
    }
  };

  return {
    handleItemEncounter,
    handleRestSiteEncounter,
    isProcessingEncounter
  };
};
