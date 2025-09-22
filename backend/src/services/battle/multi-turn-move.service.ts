import { Injectable } from '@nestjs/common';
import { MonsterInstance, MultiTurnMoveType, BattleContext, StatusEffect, LockingMoveState, TrappingMoveState } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class MultiTurnMoveService {
  constructor(
    private monsterService: MonsterService
  ) {}

  /**
   * Check if a monster is locked into using a specific move
   */
  isLockedIntoMove(monster: MonsterInstance): boolean {
    return !!monster.lockingMoveState && monster.lockingMoveState.turnsRemaining > 0;
  }

  /**
   * Get the forced move for a monster locked into a move
   */
  getForcedMove(monster: MonsterInstance): string | null {
    if (this.isLockedIntoMove(monster)) {
      return monster.lockingMoveState!.moveId;
    }
    return null;
  }

  /**
   * Check if a monster is trapped by an opponent's move
   */
  isTrapped(monster: MonsterInstance): boolean {
    return !!monster.trappedBy && monster.trappedBy.turnsRemaining > 0;
  }

  /**
   * Initialize a locking move (like Outrage, Rollout)
   */
  initializeLockingMove(monster: MonsterInstance, moveId: string): { turnsToLock: number; effects: string[] } {
    const move = this.monsterService.getMoveData(moveId);
    const effects: string[] = [];

    if (!move?.multiTurnMove?.lockingData) {
      return { turnsToLock: 0, effects };
    }

    const lockingData = move.multiTurnMove.lockingData;
    const turnsToLock = Math.floor(Math.random() * (lockingData.maxTurns - lockingData.minTurns + 1)) + lockingData.minTurns;

    monster.lockingMoveState = {
      moveId,
      turnsRemaining: turnsToLock - 1, // -1 because first turn is happening now
      totalTurns: turnsToLock,
      hitOnFirstTurn: false // Will be set after accuracy check
    };

    effects.push(`${monster.name} is locked into using ${move.name}!`);
    return { turnsToLock, effects };
  }

  /**
   * Set whether the locking move hit on the first turn
   */
  setLockingMoveHit(monster: MonsterInstance, hit: boolean): void {
    if (monster.lockingMoveState) {
      monster.lockingMoveState.hitOnFirstTurn = hit;
    }
  }

  /**
   * Check if a locking move should automatically hit (after first turn)
   */
  shouldLockingMoveAutoHit(monster: MonsterInstance): boolean {
    return !!monster.lockingMoveState && 
           monster.lockingMoveState.hitOnFirstTurn && 
           monster.lockingMoveState.turnsRemaining > 0;
  }

  /**
   * Process end of turn for locking moves
   */
  processLockingMoveEndOfTurn(monster: MonsterInstance): string[] {
    const effects: string[] = [];

    if (monster.lockingMoveState && monster.lockingMoveState.turnsRemaining > 0) {
      monster.lockingMoveState.turnsRemaining--;

      if (monster.lockingMoveState.turnsRemaining === 0) {
        // Locking sequence ended
        const move = this.monsterService.getMoveData(monster.lockingMoveState.moveId);
        
        if (move?.multiTurnMove?.lockingData?.confusesAfter) {
          // Apply confusion
          monster.statusCondition = {
            effect: StatusEffect.CONFUSION,
            duration: Math.floor(Math.random() * 4) + 2, // 2-5 turns
            turnsActive: 0
          };
          effects.push(`${monster.name} became confused from exhaustion!`);
        }

        monster.lockingMoveState = undefined;
      }
    }

    return effects;
  }

  /**
   * Calculate power multiplier for locking moves (like Rollout)
   */
  getLockingMovePowerMultiplier(monster: MonsterInstance): number {
    if (!monster.lockingMoveState) return 1;

    const move = this.monsterService.getMoveData(monster.lockingMoveState.moveId);
    const lockingData = move?.multiTurnMove?.lockingData;

    if (!lockingData?.powerMultiplier) return 1;

    // Calculate which turn we're on
    const currentTurn = monster.lockingMoveState.totalTurns - monster.lockingMoveState.turnsRemaining;
    return Math.pow(lockingData.powerMultiplier, currentTurn - 1);
  }

  /**
   * Initialize a trapping move (like Fire Spin, Whirlpool)
   */
  initializeTrappingMove(
    attacker: MonsterInstance, 
    target: MonsterInstance, 
    moveId: string,
    damage: number
  ): string[] {
    const move = this.monsterService.getMoveData(moveId);
    const effects: string[] = [];

    if (!move?.multiTurnMove?.trappingData) {
      return effects;
    }

    const trappingData = move.multiTurnMove.trappingData;
    const duration = Math.floor(Math.random() * (trappingData.maxTurns - trappingData.minTurns + 1)) + trappingData.minTurns;
    
    // Calculate damage per turn based on target's max HP
    const damagePerTurn = Math.max(1, Math.floor(target.maxHp * trappingData.damagePerTurn));

    target.trappedBy = {
      moveId,
      turnsRemaining: duration,
      damagePerTurn
    };

    effects.push(`${target.name} was trapped by ${move.name}!`);
    return effects;
  }

  /**
   * Process trapping damage at end of turn
   */
  processTrappingDamage(monster: MonsterInstance): { damage: number; effects: string[] } {
    const effects: string[] = [];
    let damage = 0;

    if (monster.trappedBy && monster.trappedBy.turnsRemaining > 0) {
      const move = this.monsterService.getMoveData(monster.trappedBy.moveId);
      damage = monster.trappedBy.damagePerTurn;
      
      monster.currentHp = Math.max(0, monster.currentHp - damage);
      monster.trappedBy.turnsRemaining--;

      effects.push(`${monster.name} is hurt by ${move?.name}! (${damage} damage)`);

      if (monster.trappedBy.turnsRemaining === 0) {
        effects.push(`${monster.name} is freed from ${move?.name}!`);
        monster.trappedBy = undefined;
      }
    }

    return { damage, effects };
  }

  /**
   * Check if a monster can be switched out (blocked by trapping moves)
   */
  canSwitchOut(monster: MonsterInstance): { canSwitch: boolean; reason?: string } {
    if (this.isTrapped(monster)) {
      const move = this.monsterService.getMoveData(monster.trappedBy!.moveId);
      return { 
        canSwitch: false, 
        reason: `${monster.name} is trapped by ${move?.name} and cannot be switched out!` 
      };
    }

    return { canSwitch: true };
  }

  /**
   * Get multi-hit move data for processing
   */
  getMultiHitMoveData(moveId: string): { minHits: number; maxHits: number; accuracyType: 'single' | 'per_hit'; powerPerHit?: number } | null {
    const move = this.monsterService.getMoveData(moveId);
    if (!move?.multiTurnMove?.multiHitData) {
      return null;
    }

    const multiHitData = move.multiTurnMove.multiHitData;
    return {
      minHits: multiHitData.minHits,
      maxHits: multiHitData.maxHits,
      accuracyType: multiHitData.accuracyType,
      powerPerHit: multiHitData.powerPerHit
    };
  }

  /**
   * Get status message for multi-turn move states
   */
  getStatusMessage(monster: MonsterInstance): string | null {
    if (monster.lockingMoveState && monster.lockingMoveState.turnsRemaining > 0) {
      const move = this.monsterService.getMoveData(monster.lockingMoveState.moveId);
      return `${monster.name} must continue using ${move?.name}! (${monster.lockingMoveState.turnsRemaining} turns left)`;
    }

    if (monster.trappedBy && monster.trappedBy.turnsRemaining > 0) {
      const move = this.monsterService.getMoveData(monster.trappedBy.moveId);
      return `${monster.name} is trapped by ${move?.name}! (${monster.trappedBy.turnsRemaining} turns left)`;
    }

    return null;
  }

  /**
   * Clear all multi-turn move states
   */
  clearMultiTurnMoveStates(monster: MonsterInstance): void {
    monster.lockingMoveState = undefined;
    monster.trappedBy = undefined;
  }
}