import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, BattleContext, TYPE_EFFECTIVENESS, MoveCategory } from '../types';
import { MonsterService } from './monster.service';

@Injectable()
export class BattleService {
  constructor(private monsterService: MonsterService) {}

  calculateDamage(
    attacker: MonsterInstance, 
    defender: MonsterInstance, 
    moveId: string,
    battleContext?: BattleContext
  ): number {
    const move = this.monsterService.getMoveData(moveId);
    const attackerData = this.monsterService.getMonsterData(attacker.monsterId);
    const defenderData = this.monsterService.getMonsterData(defender.monsterId);

    if (!move || move.power === 0) return 0;

    // Get base stats
    let attack = move.category === MoveCategory.PHYSICAL 
      ? attacker.stats.attack 
      : attacker.stats.specialAttack;
    
    let defense = move.category === MoveCategory.PHYSICAL 
      ? defender.stats.defense 
      : defender.stats.specialDefense;

    // Apply battle context stat modifiers if available
    if (battleContext) {
      const isPlayerAttacker = battleContext.playerMonster.id === attacker.id;
      const isPlayerDefender = battleContext.playerMonster.id === defender.id;

      if (isPlayerAttacker) {
        const modifier = move.category === MoveCategory.PHYSICAL 
          ? battleContext.playerStatModifiers.attack 
          : battleContext.playerStatModifiers.specialAttack;
        if (modifier !== undefined) attack = Math.floor(attack * modifier);
      } else {
        const modifier = move.category === MoveCategory.PHYSICAL 
          ? battleContext.opponentStatModifiers.attack 
          : battleContext.opponentStatModifiers.specialAttack;
        if (modifier !== undefined) attack = Math.floor(attack * modifier);
      }

      if (isPlayerDefender) {
        const modifier = move.category === MoveCategory.PHYSICAL 
          ? battleContext.playerStatModifiers.defense 
          : battleContext.playerStatModifiers.specialDefense;
        if (modifier !== undefined) defense = Math.floor(defense * modifier);
      } else {
        const modifier = move.category === MoveCategory.PHYSICAL 
          ? battleContext.opponentStatModifiers.defense 
          : battleContext.opponentStatModifiers.specialDefense;
        if (modifier !== undefined) defense = Math.floor(defense * modifier);
      }
    }

    // Level factor
    const levelFactor = (2 * attacker.level / 5 + 2);

    // Type effectiveness
    let effectiveness = 1;
    for (const defenderType of defenderData.type) {
      effectiveness *= TYPE_EFFECTIVENESS[move.type]?.[defenderType] ?? 1;
    }

    // STAB (Same Type Attack Bonus)
    let stab = attackerData.type.includes(move.type) ? 1.5 : 1;

    // Apply ability effects to damage multipliers
    stab = this.applyAbilityEffectsToStab(attacker, stab, move);

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
        return this.processFlee(playerMonster, opponentMonster);
      
      case 'item':
        return this.processItem(action.itemId);
      
      default:
        return { success: false, effects: ['Invalid action'] };
    }
  }

  private processAttack(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
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

    // Check accuracy
    const hitChance = Math.random() * 100;
    if (hitChance > move.accuracy) {
      return { 
        success: false, 
        effects: [`${attacker.name} used ${move.name}, but it missed!`] 
      };
    }

    const damage = this.calculateDamage(attacker, defender, moveId, battleContext);
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

  private processFlee(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): BattleResult {
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

  // Ability effect methods
  private applyAbilityEffectsToStab(
    attacker: MonsterInstance, 
    baseSTab: number, 
    move: any
  ): number {
    const abilityData = this.monsterService.getAbilityData(attacker.ability);
    if (!abilityData) return baseSTab;

    const isLowHp = attacker.currentHp / attacker.maxHp <= 0.33; // Low HP threshold
    let modifiedStab = baseSTab;

    switch (abilityData.effect) {
      case 'fire_boost_low_hp':
        // Blaze: Boost Fire-type moves when HP is low
        if (isLowHp && move.type === 'fire') {
          modifiedStab *= 1.5; // Additional 50% boost when low HP
        }
        break;
        
      case 'water_boost_low_hp':
        // Torrent: Boost Water-type moves when HP is low
        if (isLowHp && move.type === 'water') {
          modifiedStab *= 1.5; // Additional 50% boost when low HP
        }
        break;
        
      default:
        break;
    }

    return modifiedStab;
  }

  // Apply battle start effects (like Intimidate) and return battle context
  initializeBattleContext(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): { battleContext: BattleContext; effects: string[] } {
    const effects: string[] = [];
    const battleContext: BattleContext = {
      playerMonster,
      opponentMonster,
      playerStatModifiers: {},
      opponentStatModifiers: {}
    };

    // Check player monster's ability
    const playerAbility = this.monsterService.getAbilityData(playerMonster.ability);
    if (playerAbility?.effect === 'lower_opponent_attack') {
      // Intimidate reduces opponent's attack by 25%
      battleContext.opponentStatModifiers.attack = 0.75;
      effects.push(`${playerMonster.name}'s Intimidate lowered ${opponentMonster.name}'s Attack!`);
    }

    // Check opponent monster's ability
    const opponentAbility = this.monsterService.getAbilityData(opponentMonster.ability);
    if (opponentAbility?.effect === 'lower_opponent_attack') {
      // Intimidate reduces player's attack by 25%
      battleContext.playerStatModifiers.attack = 0.75;
      effects.push(`${opponentMonster.name}'s Intimidate lowered ${playerMonster.name}'s Attack!`);
    }

    return { battleContext, effects };
  }

  // Legacy method for compatibility - now deprecated
  applyBattleStartEffects(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): string[] {
    const result = this.initializeBattleContext(playerMonster, opponentMonster);
    return result.effects;
  }

  // Apply speed-based abilities
  applySpeedAbilities(monster: MonsterInstance): number {
    const abilityData = this.monsterService.getAbilityData(monster.ability);
    if (!abilityData) return monster.stats.speed;

    let modifiedSpeed = monster.stats.speed;

    switch (abilityData.effect) {
      case 'speed_boost_water':
        // Swift Swim: Double speed in water environments (for now, just a 50% boost)
        modifiedSpeed = Math.floor(modifiedSpeed * 1.5);
        break;
        
      default:
        break;
    }

    return modifiedSpeed;
  }
}
