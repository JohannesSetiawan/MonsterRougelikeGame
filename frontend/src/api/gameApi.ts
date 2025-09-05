import axios from 'axios';
import type { Player, GameRun, Monster, BattleAction, MonsterInstance, BattleResult, Encounter, ProgressStageResponse, BattleActionResponse } from './types';

const API_BASE_URL = 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const gameApi = {
  // Player endpoints
  createPlayer: async (username: string): Promise<Player> => {
    const response = await api.post('/game/player', { username });
    return response.data;
  },

  getPlayer: async (playerId: string): Promise<Player> => {
    const response = await api.get(`/game/player/${playerId}`);
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
  ): Promise<{
    effects: string[];
    playerGoesFirst: boolean;
    updatedPlayerMonster: MonsterInstance;
    updatedOpponentMonster: MonsterInstance;
  }> => {
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
    opponentMonster: MonsterInstance
  ): Promise<BattleActionResponse> => {
    const response = await api.post(`/battle/${runId}/action`, {
      action,
      playerMonsterId,
      opponentMonster,
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
};

export default api;
