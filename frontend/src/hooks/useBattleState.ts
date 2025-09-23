import React, { useState, useRef, useCallback } from 'react';
import type { Move, StatModifiers, WeatherCondition } from '../api/types';

type BattleLogEntry = {text: string, isCritical?: boolean};
type BattleContextType = {
  playerStatModifiers: StatModifiers;
  opponentStatModifiers: StatModifiers;
  weather?: WeatherCondition;
} | null;

interface BattleState {
  isProcessing: boolean;
  battleLog: BattleLogEntry[];
  battleEnded: boolean;
  movesData: Record<string, Move>;
  battleContext: BattleContextType;
  criticalHitEffect: 'player' | 'opponent' | null;
  playerGoesFirst: boolean;
  showTurnOrder: boolean;
  battleId: string | null;
}

interface UseBattleStateReturn extends BattleState {
  setBattleLog: React.Dispatch<React.SetStateAction<BattleLogEntry[]>>;
  setIsProcessing: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleEnded: React.Dispatch<React.SetStateAction<boolean>>;
  setMovesData: React.Dispatch<React.SetStateAction<Record<string, Move>>>;
  setBattleContext: React.Dispatch<React.SetStateAction<BattleContextType>>;
  setCriticalHitEffect: React.Dispatch<React.SetStateAction<'player' | 'opponent' | null>>;
  setPlayerGoesFirst: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTurnOrder: React.Dispatch<React.SetStateAction<boolean>>;
  setBattleId: React.Dispatch<React.SetStateAction<string | null>>;
  battleInitializationRef: React.MutableRefObject<{
    isInitialized: boolean;
    isInitializing: boolean;
    runId: string | null;
  }>;
  resetBattleState: () => void;
}

export const useBattleState = (): UseBattleStateReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleLog, setBattleLog] = useState<Array<{text: string, isCritical?: boolean}>>([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [movesData, setMovesData] = useState<Record<string, Move>>({});
  const [battleContext, setBattleContext] = useState<{
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
    weather?: WeatherCondition;
  } | null>(null);
  const [criticalHitEffect, setCriticalHitEffect] = useState<'player' | 'opponent' | null>(null);
  const [playerGoesFirst, setPlayerGoesFirst] = useState<boolean>(true);
  const [showTurnOrder, setShowTurnOrder] = useState<boolean>(false);
  const [battleId, setBattleId] = useState<string | null>(null);
  
  const battleInitializationRef = useRef<{
    isInitialized: boolean;
    isInitializing: boolean;
    runId: string | null;
  }>({
    isInitialized: false,
    isInitializing: false,
    runId: null
  });

  const resetBattleState = useCallback(() => {
    setBattleLog([]);
    setBattleEnded(false);
    setBattleId(null);
    battleInitializationRef.current.isInitialized = false;
    battleInitializationRef.current.runId = null;
  }, []);

  return {
    isProcessing,
    battleLog,
    battleEnded,
    movesData,
    battleContext,
    criticalHitEffect,
    playerGoesFirst,
    showTurnOrder,
    battleId,
    setBattleLog,
    setIsProcessing,
    setBattleEnded,
    setMovesData,
    setBattleContext,
    setCriticalHitEffect,
    setPlayerGoesFirst,
    setShowTurnOrder,
    setBattleId,
    battleInitializationRef,
    resetBattleState
  };
};
