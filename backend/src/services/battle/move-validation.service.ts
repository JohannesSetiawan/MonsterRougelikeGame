import { Injectable } from '@nestjs/common';
import { MonsterInstance } from '../../types';
import { FieldTrackerService } from './field-tracker.service';
import { MonsterService } from '../monster.service';

interface MoveValidationResult {
  canUse: boolean;
  reason?: string;
}

@Injectable()
export class MoveValidationService {
  constructor(
    private readonly fieldTracker: FieldTrackerService,
    private readonly monsterService: MonsterService
  ) {}

  /**
   * Validate if a move can be used by a monster in the current battle context
   */
  validateMove(
    battleId: string,
    monsterId: string,
    moveId: string,
    monster?: MonsterInstance
  ): MoveValidationResult {
    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return {
        canUse: false,
        reason: 'Move not found'
      };
    }
    if (!battleId){
        throw new Error('Battle ID is required for move validation');
    }
    // Check first turn only restriction (like Fake Out)
    if (move.restrictions?.firstTurnOnly) {
      const isFirstTurn = this.fieldTracker.isFirstTurnOnField(battleId, monsterId);
      
      if (!isFirstTurn) {
        return {
          canUse: false,
          reason: `${move.name} can only be used on the first turn the user is in battle!`
        };
      }
    }

    // Check PP if monster instance is provided
    if (monster) {
      const remainingPP = monster.movePP?.[moveId] || 0;
      if (remainingPP <= 0) {
        return {
          canUse: false,
          reason: `${move.name} has no PP left!`
        };
      }
    }

    // Add other move restrictions here as needed
    // For example: moves that require specific weather, status conditions, etc.
    
    return { canUse: true };
  }

  /**
   * Get all usable moves for a monster, filtering out restricted ones
   */
  getUsableMoves(
    battleId: string,
    monster: MonsterInstance
  ): { moveId: string; reason?: string }[] {
    return monster.moves.map(moveId => {
      const validation = this.validateMove(battleId, monster.id, moveId, monster);
      return {
        moveId,
        reason: validation.canUse ? undefined : validation.reason
      };
    });
  }

  /**
   * Check if a monster has any usable moves
   */
  hasUsableMoves(battleId: string, monster: MonsterInstance): boolean {
    return monster.moves.some(moveId => {
      const validation = this.validateMove(battleId, monster.id, moveId, monster);
      return validation.canUse;
    });
  }

  /**
   * Get the first usable move for a monster (useful for AI when all preferred moves are restricted)
   */
  getFirstUsableMove(battleId: string, monster: MonsterInstance): string | null {
    for (const moveId of monster.moves) {
      const validation = this.validateMove(battleId, monster.id, moveId, monster);
      if (validation.canUse) {
        return moveId;
      }
    }
    return null;
  }
}