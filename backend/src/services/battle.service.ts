import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, TYPE_EFFECTIVENESS, MoveCategory } from '../types';
import { MonsterService } from './monster.service';

@Injectable()
export class BattleService {
  constructor(private monsterService: MonsterService) {}

  calculateDamage(
    attacker: MonsterInstance, 
    defender: MonsterInstance, 
    moveId: string
  ): number {
    const move = this.monsterService.getMoveData(moveId);
    const attackerData = this.monsterService.getMonsterData(attacker.monsterId);
    const defenderData = this.monsterService.getMonsterData(defender.monsterId);

    if (!move || move.power === 0) return 0;

    // Base attack and defense stats
    const attack = move.category === MoveCategory.PHYSICAL 
      ? attacker.stats.attack 
      : attacker.stats.specialAttack;
    
    const defense = move.category === MoveCategory.PHYSICAL 
      ? defender.stats.defense 
      : defender.stats.specialDefense;

    // Level factor
    const levelFactor = (2 * attacker.level / 5 + 2);

    // Type effectiveness
    let effectiveness = 1;
    for (const defenderType of defenderData.type) {
      effectiveness *= TYPE_EFFECTIVENESS[move.type]?.[defenderType] ?? 1;
    }

    // STAB (Same Type Attack Bonus)
    const stab = attackerData.type.includes(move.type) ? 1.5 : 1;

    // Random factor (85-100%)
    const randomFactor = (Math.random() * 0.15) + 0.85;

    // Damage calculation
    const baseDamage = ((levelFactor * move.power * attack / defense) / 50 + 2);
    const finalDamage = Math.floor(baseDamage * stab * effectiveness * randomFactor);

    return Math.max(1, finalDamage);
  }

  processBattleAction(
    playerMonster: MonsterInstance,
    opponentMonster: MonsterInstance,
    action: BattleAction
  ): BattleResult {
    switch (action.type) {
      case 'attack':
        return this.processAttack(playerMonster, opponentMonster, action.moveId);
      
      case 'catch':
        return this.processCatch(opponentMonster);
      
      case 'flee':
        return this.processFlee();
      
      case 'item':
        return this.processItem(action.itemId);
      
      default:
        return { success: false, effects: ['Invalid action'] };
    }
  }

  private processAttack(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string
  ): BattleResult {
    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return { success: false, effects: ['Move not found'] };
    }

    // Check accuracy
    const hitChance = Math.random() * 100;
    if (hitChance > move.accuracy) {
      return { 
        success: false, 
        effects: [`${attacker.name} used ${move.name}, but it missed!`] 
      };
    }

    const damage = this.calculateDamage(attacker, defender, moveId);
    const newHp = Math.max(0, defender.currentHp - damage);
    
    const effects = [
      `${attacker.name} used ${move.name}!`,
      `It dealt ${damage} damage to ${defender.name}!`
    ];

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
      effects,
      battleEnded,
      winner: battleEnded ? 'player' : undefined
    };
  }

  private processCatch(target: MonsterInstance): BattleResult {
    // Simple catch rate calculation
    const catchRate = this.calculateCatchRate(target);
    const success = Math.random() * 100 < catchRate;

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

  private processFlee(): BattleResult {
    // For now, flee always succeeds
    return {
      success: true,
      effects: ['Got away safely!'],
      battleEnded: true
    };
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

  generateExperience(defeatedMonster: MonsterInstance): number {
    const baseExp = defeatedMonster.level * 10;
    const rarityMultiplier = this.getRarityMultiplier(defeatedMonster.monsterId);
    return Math.floor(baseExp * rarityMultiplier);
  }

  private getRarityMultiplier(monsterId: string): number {
    const monster = this.monsterService.getMonsterData(monsterId);
    switch (monster.rarity) {
      case 'common': return 1;
      case 'uncommon': return 1.2;
      case 'rare': return 1.5;
      case 'legendary': return 2;
      default: return 1;
    }
  }

  generateEnemyAction(enemy: MonsterInstance): BattleAction {
    // Simple AI: randomly choose from available moves
    if (enemy.moves.length === 0) {
      // Fallback if no moves available
      return { type: 'attack', moveId: 'scratch' };
    }

    // More intelligent AI: prefer higher power moves when enemy HP is low
    const enemyHpPercentage = enemy.currentHp / enemy.maxHp;
    
    if (enemyHpPercentage < 0.3) {
      // When low on health, prefer stronger moves
      const strongMoves = enemy.moves.filter(moveId => {
        const move = this.monsterService.getMoveData(moveId);
        return move && move.power >= 60;
      });
      
      if (strongMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * strongMoves.length);
        return { type: 'attack', moveId: strongMoves[randomIndex] };
      }
    }

    // Normal strategy: randomly choose any available move
    const randomMoveIndex = Math.floor(Math.random() * enemy.moves.length);
    const selectedMove = enemy.moves[randomMoveIndex];

    return { type: 'attack', moveId: selectedMove };
  }
}
