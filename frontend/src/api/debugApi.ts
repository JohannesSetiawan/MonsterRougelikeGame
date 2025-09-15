import type { GameRun } from './types';

const API_BASE_URL = 'http://localhost:3001';

export interface DebugAddMonsterRequest {
  monsterId: string;
  level?: number;
  isShiny?: boolean;
}

export interface DebugResponse<T = any> {
  success: boolean;
  run?: GameRun;
  message?: string;
  data?: T;
}

export interface AvailableMonster {
  id: string;
  name: string;
  type: string[];
  rarity: string;
  description: string;
}

export interface AvailableItem {
  id: string;
  name: string;
  description: string;
  type: string;
  rarity?: string;
}

export interface AvailableMove {
  id: string;
  name: string;
  type: string;
  category: string;
  power: number;
  accuracy: number;
  pp: number;
  description: string;
}

export interface LearnableMove extends AvailableMove {
  levelLearned: number;
  alreadyKnows: boolean;
}

export interface LearnableMovesResponse {
  success: boolean;
  learnableMoves: LearnableMove[];
  currentMoves: AvailableMove[];
}

class DebugApi {
  async addMonsterToTeam(runId: string, request: DebugAddMonsterRequest): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/add-monster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add monster to team');
    }

    return response.json();
  }

  async addCurrency(runId: string, amount: number): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/add-currency`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add currency');
    }

    return response.json();
  }

  async addItem(runId: string, itemId: string, quantity?: number): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/add-item`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ itemId, quantity }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add item');
    }

    return response.json();
  }

  async healTeam(runId: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/heal-team`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to heal team');
    }

    return response.json();
  }

  async levelUpMonster(runId: string, monsterId: string, levels?: number): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/level-up-monster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monsterId, levels }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to level up monster');
    }

    return response.json();
  }

  async setStage(runId: string, stage: number): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/set-stage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stage }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to set stage');
    }

    return response.json();
  }

  async removeMonster(runId: string, monsterId: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/remove-monster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monsterId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to remove monster');
    }

    return response.json();
  }

  async clearInventory(runId: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/clear-inventory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to clear inventory');
    }

    return response.json();
  }

  async toggleMonsterShiny(runId: string, monsterId: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/make-monster-shiny`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monsterId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle monster shiny status');
    }

    return response.json();
  }

  async getAvailableMonsters(): Promise<AvailableMonster[]> {
    const response = await fetch(`${API_BASE_URL}/debug/monsters/available`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get available monsters');
    }

    return response.json();
  }

  async getAvailableItems(): Promise<AvailableItem[]> {
    const response = await fetch(`${API_BASE_URL}/debug/items/available`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get available items');
    }

    return response.json();
  }

  async getAvailableMoves(): Promise<AvailableMove[]> {
    const response = await fetch(`${API_BASE_URL}/debug/moves/available`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get available moves');
    }

    return response.json();
  }

  async getLearnableMoves(runId: string, monsterId: string): Promise<LearnableMovesResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/monster/${monsterId}/learnable-moves`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get learnable moves');
    }

    return response.json();
  }

  async learnMove(runId: string, monsterId: string, moveId: string, moveToReplace?: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/learn-move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monsterId, moveId, moveToReplace }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to learn move');
    }

    return response.json();
  }

  async forgetMove(runId: string, monsterId: string, moveId: string): Promise<DebugResponse> {
    const response = await fetch(`${API_BASE_URL}/debug/run/${runId}/forget-move`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ monsterId, moveId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to forget move');
    }

    return response.json();
  }
}

export const debugApi = new DebugApi();
