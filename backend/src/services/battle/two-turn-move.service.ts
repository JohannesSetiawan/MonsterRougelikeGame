import { Injectable } from '@nestjs/common';
import { MonsterInstance, TwoTurnMoveType, TwoTurnMoveState, BattleContext } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class TwoTurnMoveService {
  constructor(private monsterService: MonsterService) {}

  /**
   * Check if a monster is currently committed to a two-turn move
   */
  isCommittedToTwoTurnMove(monster: MonsterInstance): boolean {
    return monster.twoTurnMoveState?.phase === 'charging';
  }

  /**
   * Check if a monster must recharge this turn
   */
  mustRecharge(monster: MonsterInstance): boolean {
    return monster.twoTurnMoveState?.phase === 'recharging';
  }

  /**
   * Get the forced move for a monster committed to a two-turn move
   */
  getForcedMove(monster: MonsterInstance): string | null {
    if (monster.twoTurnMoveState?.phase === 'charging') {
      return monster.twoTurnMoveState.moveId;
    }
    return null;
  }

  /**
   * Check if a monster is in a semi-invulnerable state
   */
  isSemiInvulnerable(monster: MonsterInstance): boolean {
    return monster.twoTurnMoveState?.phase === 'charging' && 
           !!monster.twoTurnMoveState.semiInvulnerableState;
  }

  /**
   * Get the semi-invulnerable state of a monster
   */
  getSemiInvulnerableState(monster: MonsterInstance): string | null {
    if (this.isSemiInvulnerable(monster)) {
      return monster.twoTurnMoveState!.semiInvulnerableState || null;
    }
    return null;
  }

  /**
   * Check if a move can hit a target in semi-invulnerable state
   */
  canHitSemiInvulnerableTarget(
    attacker: MonsterInstance,
    target: MonsterInstance,
    moveId: string
  ): { canHit: boolean; reason?: string } {
    // If target is not semi-invulnerable, can always hit
    if (!this.isSemiInvulnerable(target)) {
      return { canHit: true };
    }

    const move = this.monsterService.getMoveData(moveId);
    if (!move || !move.twoTurnMove) {
      // Check if this move is a counter to the target's semi-invulnerable state
      const targetState = this.getSemiInvulnerableState(target);
      const isCounterMove = this.isCounterMove(moveId, targetState);
      
      if (isCounterMove) {
        return { canHit: true };
      }
    }

    // If it's another two-turn move, they can't hit each other while both are semi-invulnerable
    const state = target.twoTurnMoveState!.semiInvulnerableState!;
    let reason = `${target.name} avoided the attack!`;
    
    switch (state) {
      case 'flying':
        reason = `${target.name} is too high to be hit!`;
        break;
      case 'underground':
        reason = `${target.name} is underground and can't be hit!`;
        break;
      case 'underwater':
        reason = `${target.name} is underwater and can't be hit!`;
        break;
      case 'vanished':
        reason = `${target.name} is nowhere to be found!`;
        break;
    }

    return { canHit: false, reason };
  }

  /**
   * Check if a move is a counter move for a given semi-invulnerable state
   */
  private isCounterMove(moveId: string, semiInvulnerableState: string | null): boolean {
    if (!semiInvulnerableState) return false;

    const counterMoves: Record<string, string[]> = {
      'flying': ['gust', 'hurricane', 'sky_uppercut', 'smack_down', 'thunder', 'twister'],
      'underground': ['earthquake', 'fissure', 'magnitude'],
      'underwater': ['surf', 'whirlpool'],
      'vanished': [] // Ghost-type moves can't be countered
    };

    return counterMoves[semiInvulnerableState]?.includes(moveId) || false;
  }

  /**
   * Clear two-turn move state
   */
  clearTwoTurnMoveState(monster: MonsterInstance): void {
    monster.twoTurnMoveState = undefined;
  }

  /**
   * Process end of turn for two-turn moves
   */
  processEndOfTurn(monster: MonsterInstance): string[] {
    const effects: string[] = [];

    if (monster.twoTurnMoveState?.phase === 'recharging') {
      // Clear recharge state at end of turn
      monster.twoTurnMoveState = undefined;
    }

    return effects;
  }

  /**
   * Get status message for a monster's two-turn move state
   */
  getStatusMessage(monster: MonsterInstance): string | null {
    if (!monster.twoTurnMoveState) return null;

    const move = this.monsterService.getMoveData(monster.twoTurnMoveState.moveId);
    if (!move) return null;

    switch (monster.twoTurnMoveState.phase) {
      case 'charging':
        if (monster.twoTurnMoveState.semiInvulnerableState) {
          const state = monster.twoTurnMoveState.semiInvulnerableState;
          switch (state) {
            case 'flying': return `${monster.name} is flying high!`;
            case 'underground': return `${monster.name} is underground!`;
            case 'underwater': return `${monster.name} is underwater!`;
            case 'vanished': return `${monster.name} has vanished!`;
            default: return `${monster.name} is in a semi-invulnerable state!`;
          }
        } else {
          return `${monster.name} is charging up ${move.name}!`;
        }
      case 'recharging':
        return `${monster.name} must recharge!`;
      default:
        return null;
    }
  }
}