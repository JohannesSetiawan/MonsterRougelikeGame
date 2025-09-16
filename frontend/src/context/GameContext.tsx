import React, { createContext, useContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { Player, GameRun, MonsterInstance, Encounter } from '../api/types';

interface GameState {
  player: Player | null;
  currentRun: GameRun | null;
  currentEncounter: Encounter | null;
  battleState: {
    playerMonster: MonsterInstance | null;
    opponentMonster: MonsterInstance | null;
    inBattle: boolean;
  };
  isLoading: boolean;
  error: string | null;
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PLAYER'; payload: Player }
  | { type: 'SET_CURRENT_RUN'; payload: GameRun }
  | { type: 'SET_ENCOUNTER'; payload: Encounter | null }
  | { type: 'START_BATTLE'; payload: { player: MonsterInstance; opponent: MonsterInstance } }
  | { type: 'UPDATE_BATTLE_MONSTERS'; payload: { player: MonsterInstance; opponent: MonsterInstance } }
  | { type: 'END_BATTLE' }
  | { type: 'UPDATE_PLAYER_MONSTER'; payload: MonsterInstance }
  | { type: 'TEAM_WIPE' }
  | { type: 'RESET_GAME' };

const initialState: GameState = {
  player: null,
  currentRun: null,
  currentEncounter: null,
  battleState: {
    playerMonster: null,
    opponentMonster: null,
    inBattle: false,
  },
  isLoading: false,
  error: null,
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_PLAYER':
      return { ...state, player: action.payload };
    
    case 'SET_CURRENT_RUN':
      return { ...state, currentRun: action.payload };
    
    case 'SET_ENCOUNTER':
      return { ...state, currentEncounter: action.payload };
    
    case 'START_BATTLE':
      return {
        ...state,
        battleState: {
          playerMonster: action.payload.player,
          opponentMonster: action.payload.opponent,
          inBattle: true,
        },
      };
    
    case 'UPDATE_BATTLE_MONSTERS':
      return {
        ...state,
        battleState: {
          ...state.battleState,
          playerMonster: action.payload.player,
          opponentMonster: action.payload.opponent,
        },
      };
    
    case 'END_BATTLE':
      return {
        ...state,
        battleState: {
          playerMonster: null,
          opponentMonster: null,
          inBattle: false,
        },
        currentEncounter: null,
      };
    
    case 'UPDATE_PLAYER_MONSTER':
      if (state.currentRun) {
        const updatedTeam = state.currentRun.team.map(monster =>
          monster.id === action.payload.id ? action.payload : monster
        );
        return {
          ...state,
          currentRun: { ...state.currentRun, team: updatedTeam },
        };
      }
      return state;
    
    case 'TEAM_WIPE':
      // Mark the current run as inactive when team wipe occurs
      if (state.currentRun) {
        return {
          ...state,
          currentRun: { ...state.currentRun, isActive: false },
          battleState: {
            playerMonster: null,
            opponentMonster: null,
            inBattle: false,
          },
          currentEncounter: null,
        };
      }
      return state;
    
    case 'RESET_GAME':
      return initialState;
    
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
