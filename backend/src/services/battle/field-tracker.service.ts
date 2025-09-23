import { Injectable } from '@nestjs/common';
import { MonsterInstance } from '../../types';

interface MonsterFieldData {
  monsterId: string;
  turnsOnField: number;
  justEntered: boolean; // True if monster just entered field this turn
}

@Injectable()
export class FieldTrackerService {
  private battleFieldData = new Map<string, {
    playerMonster: MonsterFieldData | null;
    opponentMonster: MonsterFieldData | null;
  }>();

  /**
   * Initialize field tracking for a new battle
   */
  initializeBattle(battleId: string, playerMonster: MonsterInstance, opponentMonster: MonsterInstance): void {
    this.battleFieldData.set(battleId, {
      playerMonster: {
        monsterId: playerMonster.id,
        turnsOnField: 0,
        justEntered: true
      },
      opponentMonster: {
        monsterId: opponentMonster.id,
        turnsOnField: 0,
        justEntered: true
      }
    });
  }

  /**
   * Switch a monster in the field (for player or opponent)
   */
  switchMonster(battleId: string, isPlayer: boolean, newMonster: MonsterInstance): void {
    const battleData = this.battleFieldData.get(battleId);
    if (!battleData) return;

    const newFieldData: MonsterFieldData = {
      monsterId: newMonster.id,
      turnsOnField: 0,
      justEntered: true
    };

    if (isPlayer) {
      battleData.playerMonster = newFieldData;
    } else {
      battleData.opponentMonster = newFieldData;
    }
  }

  /**
   * Process end of turn - clear just entered flags
   */
  processEndOfTurn(battleId: string): void {
    const battleData = this.battleFieldData.get(battleId);
    if (!battleData) return;

    if (battleData.playerMonster) {
      battleData.playerMonster.justEntered = false;
    }

    if (battleData.opponentMonster) {
      battleData.opponentMonster.justEntered = false;
    }
  }

  /**
   * Record that a monster has taken an action (used a move)
   */
  recordMonsterAction(battleId: string, monsterId: string): void {
    const battleData = this.battleFieldData.get(battleId);
    if (!battleData) return;

    if (battleData.playerMonster && battleData.playerMonster.monsterId === monsterId) {
      battleData.playerMonster.turnsOnField++;
    }

    if (battleData.opponentMonster && battleData.opponentMonster.monsterId === monsterId) {
      battleData.opponentMonster.turnsOnField++;
    }
  }

  /**
   * Check if this is the first turn for a monster on the field
   */
  isFirstTurnOnField(battleId: string, monsterId: string): boolean {
    const battleData = this.battleFieldData.get(battleId);
    if (!battleData) return true; // Default to true if no data

    const playerData = battleData.playerMonster;
    const opponentData = battleData.opponentMonster;

    if (playerData && playerData.monsterId === monsterId) {
      // First turn is when turnsOnField === 0 (regardless of justEntered flag)
      return playerData.turnsOnField === 0;
    }

    if (opponentData && opponentData.monsterId === monsterId) {
      // First turn is when turnsOnField === 0 (regardless of justEntered flag)
      return opponentData.turnsOnField === 0;
    }

    return true; // Default to true if monster not found
  }

  /**
   * Get turns a monster has been on field
   */
  getTurnsOnField(battleId: string, monsterId: string): number {
    const battleData = this.battleFieldData.get(battleId);
    if (!battleData) return 0;

    const playerData = battleData.playerMonster;
    const opponentData = battleData.opponentMonster;

    if (playerData && playerData.monsterId === monsterId) {
      return playerData.turnsOnField;
    }

    if (opponentData && opponentData.monsterId === monsterId) {
      return opponentData.turnsOnField;
    }

    return 0;
  }

  /**
   * Clean up battle data when battle ends
   */
  cleanupBattle(battleId: string): void {
    this.battleFieldData.delete(battleId);
  }

  /**
   * Get current field data for debugging
   */
  getBattleFieldData(battleId: string): any {
    return this.battleFieldData.get(battleId);
  }
}