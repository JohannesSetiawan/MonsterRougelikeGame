import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, BattleContext, MoveLearnEvent } from '../types';
import { MonsterService } from './monster.service';

// Battle module services
import { StatusEffectService } from './battle/status-effect.service';
import { DamageCalculationService } from './battle/damage-calculation.service';
import { BattleActionsService } from './battle/battle-actions.service';
import { BattleAIService } from './battle/battle-ai.service';
import { ExperienceService } from './battle/experience.service';
import { AbilityEffectsService } from './battle/ability-effects.service';
import { TurnManagementService } from './battle/turn-management.service';

@Injectable()
export class BattleService {
  constructor(
    private monsterService: MonsterService,
    private statusEffectService: StatusEffectService,
    private damageCalculationService: DamageCalculationService,
    private battleActionsService: BattleActionsService,
    private battleAIService: BattleAIService,
    private experienceService: ExperienceService,
    private abilityEffectsService: AbilityEffectsService,
    private turnManagementService: TurnManagementService
  ) {}

  // Delegate to damage calculation service
  calculateDamage(
    attacker: MonsterInstance, 
    defender: MonsterInstance, 
    moveId: string,
    battleContext?: BattleContext,
    temporaryBoosts?: {
      attack?: number;
      defense?: number;
      speed?: number;
    }
  ): { damage: number; isCritical: boolean } {
    return this.damageCalculationService.calculateDamage(
      attacker, 
      defender, 
      moveId, 
      battleContext, 
      temporaryBoosts
    );
  }

  // Delegate to battle actions service
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
    return this.battleActionsService.processBattleAction(
      playerMonster,
      opponentMonster,
      action,
      battleModifiers
    );
  }

  // Delegate to battle actions service
  processAttack(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleContext?: BattleContext
  ): BattleResult {
    return this.battleActionsService.processAttack(attacker, defender, moveId, battleContext);
  }

  // Delegate to experience service
  generateExperience(defeatedMonster: MonsterInstance): number {
    return this.experienceService.generateExperience(defeatedMonster);
  }

  calculateExperienceForNextLevel(monster: MonsterInstance): number {
    return this.experienceService.calculateExperienceForNextLevel(monster);
  }

  addExperienceToMonster(monster: MonsterInstance, expGain: number): { monster: MonsterInstance; leveledUp: boolean; levelsGained: number; moveLearnEvents: MoveLearnEvent[]; autoLearnedMoves: string[] } {
    return this.experienceService.addExperienceToMonster(monster, expGain);
  }

  // For double battles: distribute XP to multiple monsters
  addExperienceToMultipleMonsters(monsters: MonsterInstance[], expGain: number): { 
    monsters: MonsterInstance[]; 
    levelUpResults: Array<{ 
      monster: MonsterInstance; 
      leveledUp: boolean; 
      levelsGained: number; 
      moveLearnEvents: MoveLearnEvent[]; 
      autoLearnedMoves: string[] 
    }> 
  } {
    return this.experienceService.addExperienceToMultipleMonsters(monsters, expGain);
  }

  // Delegate to AI service
  generateEnemyAction(enemy: MonsterInstance, targets?: MonsterInstance[]): BattleAction {
    return this.battleAIService.generateEnemyAction(enemy, targets);
  }

  // Delegate to ability effects service
  initializeBattleContext(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): { battleContext: BattleContext; effects: string[] } {
    return this.abilityEffectsService.initializeBattleContext(playerMonster, opponentMonster);
  }

  // Initialize double battle context
  initializeDoubleBattleContext(
    playerMonster1: MonsterInstance,
    playerMonster2: MonsterInstance,
    opponentMonster1: MonsterInstance,
    opponentMonster2: MonsterInstance
  ): { battleContext: BattleContext; effects: string[] } {
    // Initialize context for primary monsters
    const { battleContext: primaryContext, effects: primaryEffects } = 
      this.abilityEffectsService.initializeBattleContext(playerMonster1, opponentMonster1);

    // Initialize context for secondary monsters
    const { battleContext: secondaryContext, effects: secondaryEffects } = 
      this.abilityEffectsService.initializeBattleContext(playerMonster2, opponentMonster2);

    // Combine into double battle context
    const doubleBattleContext: BattleContext = {
      ...primaryContext,
      isDoubleBattle: true,
      playerMonster2: playerMonster2,
      opponentMonster2: opponentMonster2,
      playerStatModifiers2: secondaryContext.playerStatModifiers,
      opponentStatModifiers2: secondaryContext.opponentStatModifiers
    };

    return {
      battleContext: doubleBattleContext,
      effects: [...primaryEffects, ...secondaryEffects]
    };
  }

  // Legacy method for compatibility - now deprecated
  applyBattleStartEffects(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): string[] {
    return this.abilityEffectsService.applyBattleStartEffects(playerMonster, opponentMonster);
  }

  // Delegate to ability effects service
  applySpeedAbilities(monster: MonsterInstance): number {
    return this.abilityEffectsService.applySpeedAbilities(monster);
  }

  // Delegate to status effect service
  applyStatusDamage(monster: MonsterInstance): { damage: number; effects: string[] } {
    return this.statusEffectService.applyStatusDamage(monster);
  }

  shouldSkipTurn(monster: MonsterInstance): { skip: boolean; reason?: string } {
    return this.statusEffectService.shouldSkipTurn(monster);
  }

  getStatusModifiedStats(monster: MonsterInstance) {
    return this.statusEffectService.getStatusModifiedStats(monster);
  }

  // Delegate to turn management service
  processEndOfTurn(playerMonster: MonsterInstance, opponentMonster: MonsterInstance) {
    return this.turnManagementService.processEndOfTurn(playerMonster, opponentMonster);
  }

  determineTurnOrder(playerMonster: MonsterInstance, opponentMonster: MonsterInstance): 'player' | 'opponent' {
    return this.turnManagementService.determineTurnOrder(playerMonster, opponentMonster);
  }

  checkBattleEnd(playerMonster: MonsterInstance, opponentMonster: MonsterInstance) {
    return this.turnManagementService.checkBattleEnd(playerMonster, opponentMonster);
  }

  // Double battle helper methods
  getValidTargets(monsters: MonsterInstance[]): MonsterInstance[] {
    return monsters.filter(monster => monster.currentHp > 0);
  }

  redirectTargetIfDead(
    targetMonsterId: string, 
    availableTargets: MonsterInstance[]
  ): MonsterInstance | null {
    // First check if the original target is still alive
    const originalTarget = availableTargets.find(m => m.id === targetMonsterId);
    if (originalTarget && originalTarget.currentHp > 0) {
      return originalTarget;
    }

    // If original target is dead, find the first alive target
    const aliveTargets = this.getValidTargets(availableTargets);
    return aliveTargets.length > 0 ? aliveTargets[0] : null;
  }

  checkDoubleBattleEnd(
    playerMonsters: MonsterInstance[], 
    opponentMonsters: MonsterInstance[]
  ): { battleEnded: boolean; winner?: 'player' | 'opponent' | 'draw' } {
    const alivePlayerMonsters = this.getValidTargets(playerMonsters);
    const aliveOpponentMonsters = this.getValidTargets(opponentMonsters);

    if (alivePlayerMonsters.length === 0 && aliveOpponentMonsters.length === 0) {
      return { battleEnded: true, winner: 'draw' };
    }
    
    if (alivePlayerMonsters.length === 0) {
      return { battleEnded: true, winner: 'opponent' };
    }
    
    if (aliveOpponentMonsters.length === 0) {
      return { battleEnded: true, winner: 'player' };
    }

    return { battleEnded: false };
  }


}
