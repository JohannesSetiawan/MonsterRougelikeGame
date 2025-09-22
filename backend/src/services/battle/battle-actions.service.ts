import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, BattleContext, TYPE_EFFECTIVENESS, StatusEffect, MoveCategory, MoveEffect, TwoTurnMoveType, MultiTurnMoveType } from '../../types';
import { MonsterService } from '../monster.service';
import { DamageCalculationService } from './damage-calculation.service';
import { StatusEffectService } from './status-effect.service';
import { WeatherService } from './weather.service';
import { MultiTurnMoveService } from './multi-turn-move.service';

@Injectable()
export class BattleActionsService {
  constructor(
    private monsterService: MonsterService,
    private damageCalculationService: DamageCalculationService,
    private statusEffectService: StatusEffectService,
    private weatherService: WeatherService,
    private multiTurnMoveService: MultiTurnMoveService
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
    },
    battleContext?: BattleContext
  ): BattleResult {
    switch (action.type) {
      case 'attack':
        return this.processAttack(playerMonster, opponentMonster, action.moveId, battleContext);
      
      case 'catch':
        return this.processCatch(opponentMonster, battleModifiers?.catchRate);
      
      case 'flee':
        return this.processFlee(playerMonster, opponentMonster, battleModifiers?.guaranteedFlee);
      
      case 'item':
        return this.processItem(action.itemId);
      
      case 'switch':
        return this.processSwitch(action.newMonsterId);
      
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

    // Check if monster is in recharge phase
    if (attacker.twoTurnMoveState?.phase === 'recharging') {
      // Monster must recharge this turn
      attacker.twoTurnMoveState = undefined; // Clear recharge state
      return {
        success: false,
        effects: [`${attacker.name} must recharge!`]
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

    // Handle two-turn move continuation
    if (attacker.twoTurnMoveState?.phase === 'charging' && attacker.twoTurnMoveState.moveId === moveId) {
      return this.executeTwoTurnMoveSecondPhase(attacker, defender, move, battleContext);
    }

    // Handle new two-turn move
    if (move.twoTurnMove) {
      return this.initiateTwoTurnMoveFirstPhase(attacker, defender, move, battleContext);
    }

    // Handle locking move continuation - check if this is a continuation of an existing locking move
    const isLockedMove = attacker.lockingMoveState?.moveId === moveId && attacker.lockingMoveState.turnsRemaining > 0;

    // Handle multi-turn moves
    if (move.multiTurnMove) {
      switch (move.multiTurnMove.type) {
        case MultiTurnMoveType.MULTI_HIT:
          return this.processMultiHitMove(attacker, defender, moveId, battleContext);
        case MultiTurnMoveType.LOCKING:
          return this.processLockingMove(attacker, defender, moveId, battleContext);
        case MultiTurnMoveType.TRAPPING:
          return this.processTrappingMove(attacker, defender, moveId, battleContext);
      }
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

    // Check accuracy with weather effects
    const weatherAccuracyMultiplier = battleContext?.weather 
      ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
      : 1.0;
    const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
    const hitChance = Math.random() * 100;
    if (hitChance > effectiveAccuracy) {
      return { 
        success: false, 
        effects: [`${attacker.name} used ${move.name}, but it missed!`] 
      };
    }

    const effects = [
      `${attacker.name} used ${move.name}!`
    ];

    // Handle status moves differently from damaging moves
    if (move.category === MoveCategory.STATUS) {
      // For status moves, process all effects
      const anyEffectApplied = this.processMoveEffects(move, attacker, defender, effects, false, battleContext);
      
      if (!anyEffectApplied) {
        // Status move failed - this happens when target already has a status condition or all effects failed
        effects.push(`But it failed!`);
        return {
          success: false,
          effects,
          battleEnded: false
        };
      }

      return {
        success: true,
        damage: 0,
        isCritical: false,
        effects,
        battleEnded: false
      };
    }

    // Handle damaging moves
    const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, moveId, battleContext);
    const newHp = Math.max(0, defender.currentHp - damage);
    defender.currentHp = newHp;

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

    // Process move effects (like status conditions) for damaging moves - only if target didn't faint
    this.processMoveEffects(move, attacker, defender, effects, battleEnded, battleContext);

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

  private processSwitch(newMonsterId?: string): BattleResult {
    if (!newMonsterId) {
      return { 
        success: false, 
        effects: ['No monster selected for switching'] 
      };
    }

    // The actual monster switching logic will be handled by the controller
    // which has access to the game run and can validate the monster exists
    // Note: Trapping checks will be handled at the game service level
    return {
      success: true,
      effects: [`Switching to new monster...`],
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

  private processMoveEffects(move: any, attacker: MonsterInstance, defender: MonsterInstance, effects: string[], battleEnded: boolean, battleContext?: BattleContext): boolean {
    let anyEffectApplied = false;

    // Process multi-effect system
    if (move.effects && Array.isArray(move.effects)) {
      for (const moveEffect of move.effects) {
        // Skip effects that target fainted monsters (except if they target the user and user isn't fainted)
        if (battleEnded && moveEffect.target === 'opponent') {
          continue;
        }

        const effectResult = this.processSingleMoveEffect(moveEffect, attacker, defender, battleContext);
        if (effectResult.applied) {
          effects.push(effectResult.message);
          anyEffectApplied = true;
        }
      }
    }

    return anyEffectApplied;
  }

  private processSingleMoveEffect(moveEffect: any, attacker: MonsterInstance, defender: MonsterInstance, battleContext?: BattleContext): { applied: boolean; message: string; statChange?: { stat: string; stages: number } } {
    // Determine the actual target based on moveEffect.target field
    const actualTarget = moveEffect.target === 'user' ? attacker : defender;
    const isTargetPlayer = battleContext ? battleContext.playerMonster.id === actualTarget.id : false;

    // Roll for effect chance
    const roll = Math.random() * 100;
    if (roll > moveEffect.chance) {
      return { applied: false, message: '' };
    }

    // Apply the effect based on type
    return this.processEffectByType(moveEffect.effect, actualTarget, isTargetPlayer, battleContext);
  }

  private initiateTwoTurnMoveFirstPhase(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    move: any,
    battleContext?: BattleContext
  ): BattleResult {
    // Check if the move has PP remaining
    const remainingPP = attacker.movePP?.[move.id] || 0;
    if (remainingPP <= 0) {
      return { 
        success: false, 
        effects: [`${attacker.name} tried to use ${move.name}, but there's no PP left!`] 
      };
    }

    // Consume PP for the first turn
    attacker.movePP[move.id] = Math.max(0, remainingPP - 1);

    // Set up two-turn move state
    attacker.twoTurnMoveState = {
      moveId: move.id,
      phase: 'charging',
      semiInvulnerableState: move.twoTurnMove.semiInvulnerableState
    };

    const effects = [
      `${attacker.name} used ${move.name}!`,
      `${attacker.name} ${move.twoTurnMove.chargingMessage}`
    ];

    return {
      success: true,
      damage: 0,
      isCritical: false,
      effects,
      battleEnded: false
    };
  }

  private executeTwoTurnMoveSecondPhase(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    move: any,
    battleContext?: BattleContext
  ): BattleResult {
    // Check if defender can be hit (semi-invulnerable state protection)
    if (move.twoTurnMove.type === 'semi_invulnerable') {
      const canHitSemiInvulnerable = this.canHitSemiInvulnerableTarget(
        defender, 
        move.id, 
        move.twoTurnMove.counterMoves || []
      );
      
      if (!canHitSemiInvulnerable.canHit) {
        // Move misses due to semi-invulnerable state
        attacker.twoTurnMoveState = undefined;
        return {
          success: false,
          effects: [canHitSemiInvulnerable.reason || `${attacker.name} couldn't hit ${defender.name}!`]
        };
      }
    }

    // Check accuracy on the second turn
    const weatherAccuracyMultiplier = battleContext?.weather 
      ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
      : 1.0;
    const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
    const hitChance = Math.random() * 100;
    
    if (hitChance > effectiveAccuracy) {
      attacker.twoTurnMoveState = undefined;
      return { 
        success: false, 
        effects: [`${attacker.name}'s attack missed!`] 
      };
    }

    const effects: string[] = [];

    // Handle damaging moves
    if (move.category !== 'status') {
      const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, move.id, battleContext);
      const newHp = Math.max(0, defender.currentHp - damage);
      defender.currentHp = newHp;

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

      // Process move effects (like status conditions) for damaging moves - only if target didn't faint
      this.processMoveEffects(move, attacker, defender, effects, battleEnded, battleContext);

      // Handle recharge requirement
      if (move.twoTurnMove.rechargeRequired) {
        attacker.twoTurnMoveState = {
          moveId: move.id,
          phase: 'recharging'
        };
      } else {
        attacker.twoTurnMoveState = undefined;
      }

      return {
        success: true,
        damage,
        isCritical,
        effects,
        battleEnded,
        winner: battleEnded ? 'player' : undefined
      };
    } else {
      // Handle status moves
      const anyEffectApplied = this.processMoveEffects(move, attacker, defender, effects, false, battleContext);
      
      if (!anyEffectApplied) {
        effects.push(`But it failed!`);
      }

      attacker.twoTurnMoveState = undefined;

      return {
        success: anyEffectApplied,
        damage: 0,
        isCritical: false,
        effects,
        battleEnded: false
      };
    }
  }

  private canHitSemiInvulnerableTarget(
    target: MonsterInstance, 
    attackingMoveId: string, 
    counterMoves: string[]
  ): { canHit: boolean; reason?: string } {
    // If target is not in semi-invulnerable state, can always hit
    if (!target.twoTurnMoveState?.semiInvulnerableState) {
      return { canHit: true };
    }

    // Check if attacking move is in counter moves list
    if (counterMoves.includes(attackingMoveId)) {
      return { canHit: true };
    }

    // Otherwise, can't hit
    const state = target.twoTurnMoveState.semiInvulnerableState;
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

  private processEffectByType(effectType: string, actualTarget: MonsterInstance, isTargetPlayer: boolean, battleContext?: BattleContext): { applied: boolean; message: string; statChange?: { stat: string; stages: number } } {
    switch (effectType) {
      case 'burn_chance':
        const burnResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.BURN);
        return { applied: burnResult.success, message: burnResult.message };
      
      case 'poison_chance':
        const poisonResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.POISON);
        return { applied: poisonResult.success, message: poisonResult.message };
      
      case 'paralyze_chance':
        const paralyzeResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.PARALYZE);
        return { applied: paralyzeResult.success, message: paralyzeResult.message };
      
      case 'sleep_chance':
        const sleepResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.SLEEP);
        return { applied: sleepResult.success, message: sleepResult.message };
      
      case 'confusion_chance':
        const confusionResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.CONFUSION);
        return { applied: confusionResult.success, message: confusionResult.message };
      
      case 'frostbite_chance':
        // Check if weather prevents this status effect
        if (battleContext?.weather && this.weatherService.shouldPreventStatusEffect('frostbite', battleContext.weather)) {
          return { applied: false, message: `${actualTarget.name} cannot be frozen in this weather!` };
        }
        const frostbiteResult = this.statusEffectService.addStatusEffect(actualTarget, StatusEffect.FROSTBITE);
        return { applied: frostbiteResult.success, message: frostbiteResult.message };
      
      // Stat lowering effects
      case 'attack_lower_chance':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.attack || 0;
          const newStage = Math.max(-6, currentStage - 1);
          targetModifiers.attack = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s attack was lowered!`,
            statChange: { stat: 'attack', stages: -1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s attack was lowered!` };

      case 'defense_lower_chance':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.defense || 0;
          const newStage = Math.max(-6, currentStage - 1);
          targetModifiers.defense = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s defense was lowered!`,
            statChange: { stat: 'defense', stages: -1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s defense was lowered!` };

      case 'special_attack_lower_chance':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.specialAttack || 0;
          const newStage = Math.max(-6, currentStage - 1);
          targetModifiers.specialAttack = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s special attack was lowered!`,
            statChange: { stat: 'specialAttack', stages: -1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s special attack was lowered!` };

      case 'special_defense_lower_chance':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.specialDefense || 0;
          const newStage = Math.max(-6, currentStage - 1);
          targetModifiers.specialDefense = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s special defense was lowered!`,
            statChange: { stat: 'specialDefense', stages: -1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s special defense was lowered!` };

      case 'speed_lower_chance':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.speed || 0;
          const newStage = Math.max(-6, currentStage - 1);
          targetModifiers.speed = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s speed was lowered!`,
            statChange: { stat: 'speed', stages: -1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s speed was lowered!` };

      // Stat boosting effects
      case 'attack_boost':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.attack || 0;
          const newStage = Math.min(6, currentStage + 1);
          targetModifiers.attack = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s attack was raised!`,
            statChange: { stat: 'attack', stages: 1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s attack was raised!` };

      case 'defense_boost':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.defense || 0;
          const newStage = Math.min(6, currentStage + 1);
          targetModifiers.defense = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s defense was raised!`,
            statChange: { stat: 'defense', stages: 1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s defense was raised!` };

      case 'special_attack_boost':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.specialAttack || 0;
          const newStage = Math.min(6, currentStage + 1);
          targetModifiers.specialAttack = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s special attack was raised!`,
            statChange: { stat: 'specialAttack', stages: 1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s special attack was raised!` };

      case 'special_defense_boost':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.specialDefense || 0;
          const newStage = Math.min(6, currentStage + 1);
          targetModifiers.specialDefense = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s special defense was raised!`,
            statChange: { stat: 'specialDefense', stages: 1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s special defense was raised!` };

      case 'speed_boost':
        if (battleContext) {
          const targetModifiers = isTargetPlayer ? battleContext.playerStatModifiers : battleContext.opponentStatModifiers;
          const currentStage = targetModifiers.speed || 0;
          const newStage = Math.min(6, currentStage + 1);
          targetModifiers.speed = newStage;
          return { 
            applied: true, 
            message: `${actualTarget.name}'s speed was raised!`,
            statChange: { stat: 'speed', stages: 1 }
          };
        }
        return { applied: true, message: `${actualTarget.name}'s speed was raised!` };
      
      case 'flinch_chance':
        // Flinching only works if the move hits and the target hasn't acted yet this turn
        // For now, we'll just add it as a temporary status effect
        // Note: Real flinching would require turn order tracking
        return { applied: true, message: `${actualTarget.name} flinched!` };
      
      default:
        return { applied: true, message: 'UNDEFINED MOVE EFFECT' };
    }
  }

  /**
   * Process multi-hit moves (like Bullet Seed, Triple Kick)
   */
  private processMultiHitMove(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return { success: false, effects: ['Move not found'] };
    }

    // Check PP
    const remainingPP = attacker.movePP?.[moveId] || 0;
    if (remainingPP <= 0) {
      return { 
        success: false, 
        effects: [`${attacker.name} tried to use ${move.name}, but there's no PP left!`] 
      };
    }

    // Consume PP
    attacker.movePP[moveId] = Math.max(0, remainingPP - 1);

    // Check for confusion
    const confusionResult = this.statusEffectService.shouldHitSelf(attacker);
    if (confusionResult.hitSelf) {
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

    // Process multi-hit move
    const multiHitData = this.multiTurnMoveService.getMultiHitMoveData(moveId);
    if (!multiHitData) {
      return { success: false, effects: ['Multi-hit data not found!'] };
    }

    const maxHits = Math.floor(Math.random() * (multiHitData.maxHits - multiHitData.minHits + 1)) + multiHitData.minHits;
    let totalDamage = 0;
    let hitCount = 0;
    const criticalHits: boolean[] = [];
    const effects = [`${attacker.name} used ${move.name}!`];

    // Single accuracy check for most multi-hit moves
    if (multiHitData.accuracyType === 'single') {
      const weatherAccuracyMultiplier = battleContext?.weather 
        ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
        : 1.0;
      const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
      const hitChance = Math.random() * 100;
      
      if (hitChance > effectiveAccuracy) {
        effects.push(`But it missed!`);
        return { success: false, effects };
      }

      // All hits land
      for (let i = 0; i < maxHits; i++) {
        const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, moveId, battleContext);
        const actualDamage = multiHitData.powerPerHit ? Math.floor(damage * (multiHitData.powerPerHit / move.power)) : damage;
        
        totalDamage += actualDamage;
        hitCount++;
        criticalHits.push(isCritical);
        
        if (defender.currentHp <= totalDamage) {
          // Target would faint, stop hitting
          break;
        }
      }
    } else {
      // Per-hit accuracy check (Triple Kick, Population Bomb)
      for (let i = 0; i < maxHits; i++) {
        const weatherAccuracyMultiplier = battleContext?.weather 
          ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
          : 1.0;
        const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
        const hitChance = Math.random() * 100;
        
        if (hitChance > effectiveAccuracy) {
          // Miss on this hit, stop the sequence
          if (hitCount === 0) {
            effects.push(`But it missed!`);
          } else {
            effects.push(`The attack stopped after ${hitCount} hit${hitCount === 1 ? '' : 's'}!`);
          }
          break;
        }

        const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, moveId, battleContext);
        const actualDamage = multiHitData.powerPerHit ? Math.floor(damage * (multiHitData.powerPerHit / move.power)) : damage;
        
        totalDamage += actualDamage;
        hitCount++;
        criticalHits.push(isCritical);

        if (defender.currentHp <= totalDamage) {
          // Target would faint, stop hitting
          break;
        }
      }
    }

    if (hitCount > 0) {
      if (hitCount === 1) {
        effects.push(`Hit once!`);
      } else {
        effects.push(`Hit ${hitCount} times!`);
      }
    }

    if (hitCount === 0) {
      return { success: false, effects };
    }

    // Apply damage
    const newHp = Math.max(0, defender.currentHp - totalDamage);
    defender.currentHp = newHp;

    // Add critical hit messages
    if (criticalHits.some(crit => crit)) {
      const critCount = criticalHits.filter(crit => crit).length;
      if (critCount === 1) {
        effects.push('Critical hit!');
      } else {
        effects.push(`${critCount} critical hits!`);
      }
    }

    effects.push(`It dealt ${totalDamage} total damage to ${defender.name}!`);

    // Check effectiveness
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

    // Process move effects if target didn't faint
    this.processMoveEffects(move, attacker, defender, effects, battleEnded, battleContext);

    return {
      success: true,
      damage: totalDamage,
      isCritical: criticalHits.some(crit => crit),
      effects,
      battleEnded,
      winner: battleEnded ? 'player' : undefined
    };
  }

  /**
   * Process locking moves (like Outrage, Rollout)
   */
  private processLockingMove(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return { success: false, effects: ['Move not found'] };
    }

    let effects: string[] = [];
    let isFirstTurn = false;

    // Check if this is the first turn of the locking move
    if (!attacker.lockingMoveState || attacker.lockingMoveState.moveId !== moveId) {
      // Initialize locking move
      const { effects: initEffects } = this.multiTurnMoveService.initializeLockingMove(attacker, moveId);
      effects.push(...initEffects);
      isFirstTurn = true;
    }

    // Check PP only on first turn
    if (isFirstTurn) {
      const remainingPP = attacker.movePP?.[moveId] || 0;
      if (remainingPP <= 0) {
        return { 
          success: false, 
          effects: [`${attacker.name} tried to use ${move.name}, but there's no PP left!`] 
        };
      }

      // Consume PP
      attacker.movePP[moveId] = Math.max(0, remainingPP - 1);
    }

    // Check for confusion
    const confusionResult = this.statusEffectService.shouldHitSelf(attacker);
    if (confusionResult.hitSelf) {
      const { damage } = this.damageCalculationService.calculateDamage(attacker, attacker, moveId, battleContext);
      const newHp = Math.max(0, attacker.currentHp - damage);
      attacker.currentHp = newHp;

      effects = [
        `${attacker.name} used ${move.name}!`,
        confusionResult.reason!,
        `It dealt ${damage} damage to itself!`
      ];

      const battleEnded = newHp === 0;
      if (battleEnded) {
        effects.push(`${attacker.name} fainted!`);
      }

      // Clear locking state on confusion
      attacker.lockingMoveState = undefined;

      return {
        success: true,
        damage,
        isCritical: false,
        effects,
        battleEnded,
        winner: battleEnded ? 'opponent' : undefined
      };
    }

    // Check accuracy - only on first turn or if first turn missed
    let hitMove = false;
    if (isFirstTurn) {
      const weatherAccuracyMultiplier = battleContext?.weather 
        ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
        : 1.0;
      const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
      const hitChance = Math.random() * 100;
      hitMove = hitChance <= effectiveAccuracy;
      this.multiTurnMoveService.setLockingMoveHit(attacker, hitMove);
    } else {
      // Subsequent turns automatically hit if first turn hit
      hitMove = this.multiTurnMoveService.shouldLockingMoveAutoHit(attacker);
    }

    if (!hitMove) {
      effects = [`${attacker.name} used ${move.name}, but it missed!`];
      // Clear locking state on miss
      attacker.lockingMoveState = undefined;
      return { success: false, effects };
    }

    effects.push(`${attacker.name} used ${move.name}!`);

    // Calculate damage with power multiplier
    const powerMultiplier = this.multiTurnMoveService.getLockingMovePowerMultiplier(attacker);
    const { damage: baseDamage, isCritical } = this.damageCalculationService.calculateDamage(
      attacker, defender, moveId, battleContext
    );
    const damage = Math.floor(baseDamage * powerMultiplier);
    
    const newHp = Math.max(0, defender.currentHp - damage);
    defender.currentHp = newHp;

    if (isCritical) {
      effects.push('Critical hit!');
    }

    if (powerMultiplier > 1) {
      effects.push(`The power increased! (${powerMultiplier.toFixed(1)}x)`);
    }

    effects.push(`It dealt ${damage} damage to ${defender.name}!`);

    // Check effectiveness
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

    // Process move effects if target didn't faint
    this.processMoveEffects(move, attacker, defender, effects, battleEnded, battleContext);

    return {
      success: true,
      damage,
      isCritical,
      effects,
      battleEnded,
      winner: battleEnded ? 'player' : undefined
    };
  }

  /**
   * Process trapping moves (like Fire Spin, Whirlpool)
   */
  private processTrappingMove(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
    const move = this.monsterService.getMoveData(moveId);
    
    if (!move) {
      return { success: false, effects: ['Move not found'] };
    }

    // Check PP
    const remainingPP = attacker.movePP?.[moveId] || 0;
    if (remainingPP <= 0) {
      return { 
        success: false, 
        effects: [`${attacker.name} tried to use ${move.name}, but there's no PP left!`] 
      };
    }

    // Consume PP
    attacker.movePP[moveId] = Math.max(0, remainingPP - 1);

    // Check for confusion
    const confusionResult = this.statusEffectService.shouldHitSelf(attacker);
    if (confusionResult.hitSelf) {
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
    const weatherAccuracyMultiplier = battleContext?.weather 
      ? this.weatherService.getWeatherAccuracyMultiplier(battleContext.weather)
      : 1.0;
    const effectiveAccuracy = move.accuracy * weatherAccuracyMultiplier;
    const hitChance = Math.random() * 100;
    if (hitChance > effectiveAccuracy) {
      return { 
        success: false, 
        effects: [`${attacker.name} used ${move.name}, but it missed!`] 
      };
    }

    const effects = [`${attacker.name} used ${move.name}!`];

    // Calculate initial damage
    const { damage, isCritical } = this.damageCalculationService.calculateDamage(attacker, defender, moveId, battleContext);
    const newHp = Math.max(0, defender.currentHp - damage);
    defender.currentHp = newHp;

    if (isCritical) {
      effects.push('Critical hit!');
    }

    effects.push(`It dealt ${damage} damage to ${defender.name}!`);

    // Check effectiveness
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
    } else {
      // Initialize trapping effect if target didn't faint
      const trappingEffects = this.multiTurnMoveService.initializeTrappingMove(attacker, defender, moveId, damage);
      effects.push(...trappingEffects);
    }

    // Process move effects if target didn't faint
    this.processMoveEffects(move, attacker, defender, effects, battleEnded, battleContext);

    return {
      success: true,
      damage,
      isCritical,
      effects,
      battleEnded,
      winner: battleEnded ? 'player' : undefined
    };
  }

}
