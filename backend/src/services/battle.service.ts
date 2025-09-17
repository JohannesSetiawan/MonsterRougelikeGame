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
    },
    battleContext?: BattleContext
  ): BattleResult {
    return this.battleActionsService.processBattleAction(
      playerMonster,
      opponentMonster,
      action,
      battleModifiers,
      battleContext
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

  // Delegate to AI service
  generateEnemyAction(enemy: MonsterInstance): BattleAction {
    return this.battleAIService.generateEnemyAction(enemy);
  }

  // Delegate to ability effects service
  initializeBattleContext(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance
  ): { battleContext: BattleContext; effects: string[] } {
    return this.abilityEffectsService.initializeBattleContext(playerMonster, opponentMonster);
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




}
