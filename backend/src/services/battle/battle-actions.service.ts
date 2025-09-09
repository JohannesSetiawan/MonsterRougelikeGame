import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, BattleContext, TYPE_EFFECTIVENESS } from '../../types';
import { MonsterService } from '../monster.service';
import { DamageCalculationService } from './damage-calculation.service';
import { StatusEffectService } from './status-effect.service';

@Injectable()
export class BattleActionsService {
  constructor(
    private monsterService: MonsterService,
    private damageCalculationService: DamageCalculationService,
    private statusEffectService: StatusEffectService
  ) {}

  processBattleAction(
    playerMonster: MonsterInstance,
    opponentMonster: MonsterInstance,
    action: BattleAction,
    battleModifiers?: {
      catchRate?: 'improved' | 'excellent';
      guaranteedFlee?: boolean;
      statBoosts?: {
        attack?: number;
        defense?: number;
        speed?: number;
      };
    }
  ): BattleResult {
    switch (action.type) {
      case 'attack':
        return this.processAttack(playerMonster, opponentMonster, action.moveId);
      
      case 'catch':
        return this.processCatch(opponentMonster, battleModifiers?.catchRate);
      
      case 'flee':
        return this.processFlee(playerMonster, opponentMonster, battleModifiers?.guaranteedFlee);
      
      case 'item':
        return this.processItem(action.itemId);
      
      default:
        return { success: false, effects: ['Invalid action'] };
    }
  }

  processAttack(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
    // Safety check: dead monsters can't attack
    if (attacker.currentHp <= 0) {
      return { 
        success: false, 
        effects: [`${attacker.name} is unable to attack! (Fainted)`] 
      };
    }

    // Check if monster should skip turn due to status effects
    const skipResult = this.statusEffectService.shouldSkipTurn(attacker);
    if (skipResult.skip) {
      return {
        success: false,
        effects: [skipResult.reason!]
      };
    }

    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return { success: false, effects: ['Move not found'] };
    }

    // Check if the move has PP remaining
    const remainingPP = attacker.movePP?.[moveId] || 0;
    
    // Initialize PP if it doesn't exist (backwards compatibility)
    if (!attacker.movePP) {
      attacker.movePP = {};
      attacker.moves.forEach(mId => {
        const moveData = this.monsterService.getMoveData(mId);
        attacker.movePP[mId] = moveData ? moveData.pp : 20;
      });
    }
    
    if (remainingPP <= 0) {
      return { 
        success: false, 
        effects: [`${attacker.name} tried to use ${move.name}, but there's no PP left!`] 
      };
    }

    // Consume PP
    attacker.movePP[moveId] = Math.max(0, remainingPP - 1);

    // Check for confusion - might hit self instead
    const confusionResult = this.statusEffectService.shouldHitSelf(attacker);
    if (confusionResult.hitSelf) {
      // Calculate self-damage
      const { damage } = this.damageCalculationService.calculateDamage(attacker, attacker, moveId, battleContext);
      const newHp = Math.max(0, attacker.currentHp - damage);
      attacker.currentHp = newHp;

      const effects = [
        `${attacker.name} used ${move.name}!`,
        confusionResult.reason!,
        `It dealt ${damage} damage to itself!`
      ];

      const battleEnded = newHp === 0;
      if (battleEnded) {
        effects.push(`${attacker.name} fainted!`);
      }

      return {
        success: true,
        damage,
        isCritical: false,
        effects,
        battleEnded,
        winner: battleEnded ? 'opponent' : undefined
      };
    }

    // Check accuracy
    const hitChance = Math.random() * 100;
    if (hitChance > move.accuracy) {
      return { 
        success: false, 
        effects: [`${attacker.name} used ${move.name}, but it missed!`] 
      };
    }

    const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, moveId, battleContext);
    const newHp = Math.max(0, defender.currentHp - damage);
    defender.currentHp = newHp;
    
    const effects = [
      `${attacker.name} used ${move.name}!`
    ];

    if (isCritical) {
      effects.push('Critical hit!');
    }

    effects.push(`It dealt ${damage} damage to ${defender.name}!`);

    // Check for effectiveness messages
    const defenderData = this.monsterService.getMonsterData(defender.monsterId);
    let effectiveness = 1;
    for (const defenderType of defenderData.type) {
      effectiveness *= TYPE_EFFECTIVENESS[move.type]?.[defenderType] ?? 1;
    }

    if (effectiveness > 1) {
      effects.push("It's super effective!");
    } else if (effectiveness < 1) {
      effects.push("It's not very effective...");
    }

    const battleEnded = newHp === 0;
    if (battleEnded) {
      effects.push(`${defender.name} fainted!`);
    }

    return {
      success: true,
      damage,
      isCritical,
      effects,
      battleEnded,
      winner: battleEnded ? 'player' : undefined
    };
  }

  private processCatch(target: MonsterInstance, catchRate?: 'improved' | 'excellent'): BattleResult {
    // Calculate catch rate with potential modifiers
    let finalCatchRate = this.calculateCatchRate(target);
    
    // Apply ball type modifiers
    if (catchRate === 'improved') {
      finalCatchRate *= 1.5; // Great Ball: 50% better catch rate
    } else if (catchRate === 'excellent') {
      finalCatchRate *= 2.5; // Ultra Ball: 150% better catch rate
    }
    
    // Cap the catch rate at 95%
    finalCatchRate = Math.min(95, finalCatchRate);
    
    const success = Math.random() * 100 < finalCatchRate;

    if (success) {
      return {
        success: true,
        monsterCaught: true,
        effects: [`${target.name} was caught successfully!`],
        battleEnded: true
      };
    } else {
      return {
        success: false,
        effects: [`${target.name} broke free from the capture attempt!`]
      };
    }
  }

  private processFlee(playerMonster: MonsterInstance, opponentMonster: MonsterInstance, guaranteed?: boolean): BattleResult {
    // If guaranteed flee (from Escape Rope), always succeed
    if (guaranteed) {
      return {
        success: true,
        effects: ['Used Escape Rope! Got away safely!'],
        battleEnded: true
      };
    }

    const levelDiff = opponentMonster.level - playerMonster.level;

    // If player monster level is same or higher, guaranteed flee
    if (levelDiff <= 0) {
      return {
        success: true,
        effects: ['Got away safely!'],
        battleEnded: true
      };
    }

    // Calculate flee chance based on level difference
    const maxRange = 2 * levelDiff;
    const randomNumber = Math.floor(Math.random() * (maxRange + 1)); // 0 to maxRange inclusive
    const fleeThreshold = levelDiff;

    if (randomNumber < fleeThreshold) {
      return {
        success: true,
        effects: ['Got away safely!'],
        battleEnded: true
      };
    } else {
      return {
        success: false,
        effects: ['Could not escape!'],
        battleEnded: false
      };
    }
  }

  private processItem(itemId: string): BattleResult {
    // This will be handled by the controller which manages inventory
    // The service just returns a success result indicating the action was valid
    return {
      success: true,
      effects: [`Used ${itemId}!`],
    };
  }

  private calculateCatchRate(monster: MonsterInstance): number {
    // Base catch rate depends on rarity and current HP
    const monsterData = this.monsterService.getMonsterData(monster.monsterId);
    let baseCatchRate = 50;

    switch (monsterData.rarity) {
      case 'common': baseCatchRate = 70; break;
      case 'uncommon': baseCatchRate = 50; break;
      case 'rare': baseCatchRate = 30; break;
      case 'legendary': baseCatchRate = 10; break;
    }

    // Lower HP increases catch rate
    const hpFactor = 1 - (monster.currentHp / monster.maxHp);
    const finalRate = baseCatchRate + (hpFactor * 30);

    return Math.min(95, finalRate);
  }
}
