import { Injectable } from '@nestjs/common';
import { MonsterInstance } from '../../types';
import { StatusEffectService } from './status-effect.service';

@Injectable()
export class TurnManagementService {
  constructor(private statusEffectService: StatusEffectService) {}

  /**
   * Process end of turn effects for both monsters
   */
  processEndOfTurn(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): {
    playerEffects: string[];
    opponentEffects: string[];
    playerDamage: number;
    opponentDamage: number;
  } {
    const playerStatusResult = this.statusEffectService.applyStatusDamage(playerMonster);
    const opponentStatusResult = this.statusEffectService.applyStatusDamage(opponentMonster);

    // Process natural recovery
    const playerRecovery = this.statusEffectService.processStatusRecovery(playerMonster);
    const opponentRecovery = this.statusEffectService.processStatusRecovery(opponentMonster);

    return {
      playerEffects: [...playerStatusResult.effects, ...playerRecovery.effects],
      opponentEffects: [...opponentStatusResult.effects, ...opponentRecovery.effects],
      playerDamage: playerStatusResult.damage,
      opponentDamage: opponentStatusResult.damage
    };
  }

  /**
   * Determine turn order based on speed (with status effect modifiers)
   */
  determineTurnOrder(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): 'player' | 'opponent' {
    const playerModifiedStats = this.statusEffectService.getStatusModifiedStats(playerMonster);
    const opponentModifiedStats = this.statusEffectService.getStatusModifiedStats(opponentMonster);

    const playerSpeed = playerModifiedStats.speed;
    const opponentSpeed = opponentModifiedStats.speed;

    if (playerSpeed === opponentSpeed) {
      // Tie breaker: random
      return Math.random() < 0.5 ? 'player' : 'opponent';
    }

    return playerSpeed > opponentSpeed ? 'player' : 'opponent';
  }

  /**
   * Check if battle should end due to fainting
   */
  checkBattleEnd(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): {
    battleEnded: boolean;
    winner?: 'player' | 'opponent';
    reason?: string;
  } {
    const playerFainted = playerMonster.currentHp <= 0;
    const opponentFainted = opponentMonster.currentHp <= 0;

    if (playerFainted && opponentFainted) {
      return {
        battleEnded: true,
        winner: undefined, // Draw
        reason: 'Both monsters fainted!'
      };
    }

    if (playerFainted) {
      return {
        battleEnded: true,
        winner: 'opponent',
        reason: `${playerMonster.name} fainted!`
      };
    }

    if (opponentFainted) {
      return {
        battleEnded: true,
        winner: 'player',
        reason: `${opponentMonster.name} fainted!`
      };
    }

    return { battleEnded: false };
  }
}
