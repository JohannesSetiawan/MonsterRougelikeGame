import { useEffect, useCallback } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import { useGame } from '../context/GameContext';
import type { MonsterInstance, GameRun, StatModifiers, Move } from '../api/types';

interface UseBattleInitializationProps {
  playerMonster: MonsterInstance | null;
  opponentMonster: MonsterInstance | null;
  currentRun: GameRun | null;
  battleInitializationRef: React.MutableRefObject<{
    isInitialized: boolean;
    isInitializing: boolean;
    runId: string | null;
  }>;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleLog: React.Dispatch<React.SetStateAction<Array<{text: string, isCritical?: boolean}>>>;
  setBattleContext: React.Dispatch<React.SetStateAction<{
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  } | null>>;
  setPlayerGoesFirst: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTurnOrder: React.Dispatch<React.SetStateAction<boolean>>;
  setMovesData: React.Dispatch<React.SetStateAction<Record<string, Move>>>;
  setBattleId: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useBattleInitialization = ({
  playerMonster,
  opponentMonster,
  currentRun,
  battleInitializationRef,
  setIsProcessing,
  setBattleLog,
  setBattleContext,
  setPlayerGoesFirst,
  setShowTurnOrder,
  setMovesData,
  setBattleId
}: UseBattleInitializationProps) => {
  const { dispatch } = useGame();

  // Load game data on mount
  useEffect(() => {
    const loadGameData = async () => {
      try {
        const moves = await gameApi.getAllMoves();
        setMovesData(moves);
      } catch (error) {
        ErrorHandler.handle(error, 'BattleInterface.loadGameData');
        setMovesData({});
      }
    };
    loadGameData();
  }, [setMovesData]);

  // Reset battle initialization when component unmounts or game resets
  useEffect(() => {
    return () => {
      battleInitializationRef.current.isInitialized = false;
      battleInitializationRef.current.runId = null;
    };
  }, [battleInitializationRef]);

  // Reset battle initialization if run changes significantly
  useEffect(() => {
    if (!currentRun) {
      battleInitializationRef.current.isInitialized = false;
      battleInitializationRef.current.runId = null;
    }
  }, [currentRun?.id, battleInitializationRef]);

  const initializeBattle = useCallback(async () => {
    if (!playerMonster || !opponentMonster || !currentRun) {
      logger.debug('Battle initialization skipped: missing requirements', 'BattleInterface');
      return;
    }

    if (battleInitializationRef.current.isInitializing || 
        (battleInitializationRef.current.isInitialized && 
         battleInitializationRef.current.runId === currentRun.id)) {
      logger.debug('Battle initialization skipped: already initialized or in progress', 'BattleInterface');
      return;
    }
    
    logger.debug('Starting battle initialization for run: ' + currentRun.id, 'BattleInterface');
    
    try {
      setIsProcessing(true);
      battleInitializationRef.current.isInitializing = true;
      
      const battleInit = await gameApi.initializeBattle(
        currentRun.id,
        playerMonster.id,
        opponentMonster
      );

      logger.debug('Battle initialization response received', 'BattleInterface');

      // Store battle ID for subsequent actions
      setBattleId(battleInit.battleId);

      if (battleInit.effects && battleInit.effects.length > 0) {
        setBattleLog(prev => [...prev, ...battleInit.effects.map(text => ({ text }))]);
      }

      // Store battle context with stat modifiers
      setBattleContext(battleInit.battleContext);

      // Set turn order and show turn order display
      setPlayerGoesFirst(battleInit.playerGoesFirst);
      setShowTurnOrder(true);
      
      // Hide turn order display after 3 seconds
      setTimeout(() => setShowTurnOrder(false), 3000);

      // Update monsters with battle start effects
      dispatch({
        type: 'UPDATE_BATTLE_MONSTERS',
        payload: {
          player: battleInit.updatedPlayerMonster,
          opponent: battleInit.updatedOpponentMonster
        }
      });

      // Mark as successfully initialized
      battleInitializationRef.current.isInitialized = true;
      battleInitializationRef.current.runId = currentRun.id;

    } catch (error) {
      ErrorHandler.handle(error, 'BattleInterface.initializeBattle');
      setBattleLog(prev => [...prev, { text: 'Battle initialization failed!' }]);
      // Reset on error so it can be retried
      battleInitializationRef.current.isInitialized = false;
    } finally {
      setIsProcessing(false);
      battleInitializationRef.current.isInitializing = false;
    }
  }, [
    playerMonster, opponentMonster, currentRun, battleInitializationRef,
    setIsProcessing, setBattleLog, setBattleContext, setPlayerGoesFirst, 
    setShowTurnOrder, setBattleId, dispatch
  ]);

  // Initialize battle on first render
  useEffect(() => {
    const needsInitialization = playerMonster && 
                               opponentMonster && 
                               currentRun && 
                               (!battleInitializationRef.current.isInitialized || 
                                battleInitializationRef.current.runId !== currentRun.id) &&
                               !battleInitializationRef.current.isInitializing;
    
    if (needsInitialization) {
      logger.debug('Initializing battle for run: ' + currentRun.id, 'BattleInterface');
      initializeBattle();
    }
  }, [playerMonster?.id, opponentMonster?.id, currentRun?.id, initializeBattle]);

  return { initializeBattle };
};
