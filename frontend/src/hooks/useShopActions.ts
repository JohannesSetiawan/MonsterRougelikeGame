import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';

export const useShopActions = () => {
  const { state, dispatch } = useGame();

  const handleShopPurchase = React.useCallback(async (itemId: string, quantity: number, totalCost: number) => {
    if (!state.currentRun) return;

    try {
      const result = await gameApi.buyItem(state.currentRun.id, itemId, quantity);
      if (result.success) {
        dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      }
    } catch (error) {
      ErrorHandler.handle(error, 'useShopActions.handleShopPurchase');
    }
  }, [state.currentRun, dispatch]);

  return {
    handleShopPurchase
  };
};
