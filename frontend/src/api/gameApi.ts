import axios from 'axios';
import type { Player, GameRun, Monster, BattleAction, MonsterInstance, BattleResult, Encounter, ProgressStageResponse, BattleActionResponse, BattleInitResponse } from './types';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gameApi = {
  // Player endpoints
  createPlayer: async (username: string, password: string): Promise<Player> => {
    const response = await api.post('/game/player', { username, password });
    return response.data;
  },

  loginPlayer: async (identifier: string, password: string): Promise<Player> => {
    const response = await api.post('/game/player/login', { identifier, password });
    return response.data;
  },

  getPlayer: async (playerId: string): Promise<Player> => {
    const response = await api.get(`/game/player/${playerId}`);
    return response.data;
  },

  loadPlayer: async (playerId: string): Promise<Player> => {
    const response = await api.post(`/game/player/${playerId}/load`);
    return response.data;
  },



  savePlayerProgress: async (playerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/game/player/${playerId}/save`);
    return response.data;
  },

  // Game run endpoints
  startRun: async (playerId: string, starterId: string): Promise<GameRun> => {
    const response = await api.post('/game/run/start', { playerId, starterId });
    return response.data;
  },

  getGameRun: async (runId: string): Promise<GameRun> => {
    const response = await api.get(`/game/run/${runId}`);
    return response.data;
  },

  getActiveRun: async (playerId: string): Promise<GameRun> => {
    const response = await api.get(`/game/run/active/${playerId}`);
    return response.data;
  },

  progressStage: async (runId: string): Promise<ProgressStageResponse> => {
    const response = await api.post(`/game/run/${runId}/progress`);
    return response.data;
  },

  useItem: async (runId: string, itemId: string, targetMonsterId?: string): Promise<{ success: boolean; message: string; run: GameRun }> => {
    const response = await api.post(`/game/run/${runId}/item/use`, { itemId, targetMonsterId });
    return response.data;
  },

  addItemToInventory: async (runId: string, item: any): Promise<GameRun> => {
    const response = await api.post(`/game/run/${runId}/item/add`, { item });
    return response.data;
  },

  endRun: async (runId: string, reason: 'victory' | 'defeat'): Promise<GameRun> => {
    const response = await api.post(`/game/run/${runId}/end`, { reason });
    return response.data;
  },

  // Static data endpoints
  getStarters: async (): Promise<Monster[]> => {
    const response = await api.get('/game/starters');
    return response.data;
  },

  getRandomEncounter: async (stageLevel: number): Promise<Encounter> => {
    const response = await api.get(`/game/encounter/${stageLevel}`);
    return response.data;
  },

  // Move data endpoints
  getAllMoves: async (): Promise<Record<string, any>> => {
    const response = await api.get('/game/moves');
    return response.data;
  },

  getMoveData: async (moveId: string): Promise<any> => {
    const response = await api.get(`/game/move/${moveId}`);
    return response.data;
  },

  // Ability data endpoints
  getAllAbilities: async (): Promise<Record<string, any>> => {
    const response = await api.get('/game/abilities');
    return response.data;
  },

  getAbilityData: async (abilityId: string): Promise<any> => {
    const response = await api.get(`/game/ability/${abilityId}`);
    return response.data;
  },

  // Monster data endpoints
  getAllMonsters: async (): Promise<Record<string, any>> => {
    const response = await api.get('/game/monsters');
    return response.data;
  },

  getMonsterData: async (monsterId: string): Promise<any> => {
    const response = await api.get(`/game/monster/${monsterId}`);
    return response.data;
  },

  getExperienceForLevel: async (monsterId: string, level: number): Promise<{ experienceForNextLevel: number }> => {
    const response = await api.get(`/game/monster/${monsterId}/exp-for-level/${level}`);
    return response.data;
  },

  getMovesLearnableAtLevel: async (monsterId: string, level: number): Promise<{ moves: string[] }> => {
    const response = await api.get(`/game/monster/${monsterId}/learnable-moves/${level}`);
    return response.data;
  },

  learnMove: async (
    runId: string, 
    monsterId: string, 
    moveId: string, 
    moveToReplace?: string, 
    learnMove?: boolean
  ): Promise<{ success: boolean; message: string; run: GameRun }> => {
    const response = await api.post(`/game/run/${runId}/monster/${monsterId}/learn-move`, {
      moveId,
      moveToReplace,
      learnMove: learnMove !== false, // default to true if not specified
    });
    return response.data;
  },

  // Item data endpoints
  getAllItems: async (): Promise<Record<string, any>> => {
    const response = await api.get('/game/items');
    return response.data;
  },

  getItemData: async (itemId: string): Promise<any> => {
    const response = await api.get(`/game/item/${itemId}`);
    return response.data;
  },

  // Battle endpoints
  initializeBattle: async (
    runId: string,
    playerMonsterId: string,
    opponentMonster: MonsterInstance
  ): Promise<BattleInitResponse> => {
    const response = await api.post(`/battle/${runId}/initialize`, {
      playerMonsterId,
      opponentMonster,
    });
    return response.data;
  },

  performBattleAction: async (
    runId: string,
    action: BattleAction,
    playerMonsterId: string,
    opponentMonster: MonsterInstance,
    battleContext?: {
      playerStatModifiers?: any;
      opponentStatModifiers?: any;
      weather?: any;
    },
    playerGoesFirst?: boolean
  ): Promise<BattleActionResponse> => {
    const response = await api.post(`/battle/${runId}/action`, {
      action,
      playerMonsterId,
      opponentMonster,
      battleContext,
      playerGoesFirst,
    });
    return response.data;
  },

  calculateDamage: async (
    runId: string,
    attackerId: string,
    defenderId: string,
    moveId: string,
    opponent: MonsterInstance
  ): Promise<{ damage: number }> => {
    const response = await api.post(`/battle/${runId}/damage`, {
      attackerId,
      defenderId,
      moveId,
      opponent,
    });
    return response.data;
  },

  useRestSite: async (runId: string): Promise<{ success: boolean; message: string; team: MonsterInstance[] }> => {
    const response = await api.post(`/game/run/${runId}/rest-site`);
    return response.data;
  },

  // Shop endpoints
  getShopItems: async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    type: string;
  }>> => {
    const response = await api.get('/shop/items');
    return response.data;
  },

  buyItem: async (runId: string, itemId: string, quantity?: number): Promise<{
    success: boolean;
    message: string;
    run: GameRun;
    remainingCurrency: number;
  }> => {
    const response = await api.post(`/shop/${runId}/buy`, { itemId, quantity });
    return response.data;
  },
};

export default api;
