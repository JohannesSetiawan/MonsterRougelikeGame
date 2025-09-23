import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, BattleResult, BattleContext, MoveLearnEvent, StatModifiers } from '../types';
import { MonsterService } from './monster.service';

// Battle module services
import { StatusEffectService } from './battle/status-effect.service';
import { DamageCalculationService } from './battle/damage-calculation.service';
import { BattleActionsService } from './battle/battle-actions.service';
import { BattleAIService } from './battle/battle-ai.service';
import { ExperienceService } from './battle/experience.service';
import { AbilityEffectsService } from './battle/ability-effects.service';
import { TurnManagementService } from './battle/turn-management.service';
import { WeatherService } from './battle/weather.service';
import { TwoTurnMoveService } from './battle/two-turn-move.service';
import { MultiTurnMoveService } from './battle/multi-turn-move.service';
import { FieldTrackerService } from './battle/field-tracker.service';
import { MoveValidationService } from './battle/move-validation.service';

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
    private turnManagementService: TurnManagementService,
    private weatherService: WeatherService,
    private twoTurnMoveService: TwoTurnMoveService,
    private multiTurnMoveService: MultiTurnMoveService,
    private fieldTrackerService: FieldTrackerService,
    private moveValidationService: MoveValidationService
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
    battleId: string,
    battleModifiers?: {
      catchRate?: 'improved' | 'excellent';
      guaranteedFlee?: boolean;
      statBoosts?: {
        attack?: number;
        defense?: number;
        speed?: number;
      };
    },
    battleContext?: BattleContext,
    opponentAction?: BattleAction
  ): BattleResult {
    return this.battleActionsService.processBattleAction(
      playerMonster,
      opponentMonster,
      action,
      battleId,
      battleModifiers,
      battleContext,
      opponentAction
    );
  }

  // Delegate to battle actions service
  processAttack(
    attacker: MonsterInstance,
    defender: MonsterInstance,
    moveId: string,
    battleId: string,
    battleContext?: BattleContext,
    opponentAction?: BattleAction
  ): BattleResult {
    return this.battleActionsService.processAttack(attacker, defender, moveId, battleId, battleContext, opponentAction);
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

  // Initialize battle context with abilities and weather
  initializeBattleContext(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance,
    battleId?: string
  ): { battleContext: BattleContext; effects: string[] } {
    // Initialize field tracking if battleId is provided
    if (battleId) {
      this.fieldTrackerService.initializeBattle(battleId, playerMonster, opponentMonster);
    }

    // Clear any existing multi-turn move states from previous battles
    this.multiTurnMoveService.clearMultiTurnMoveStates(playerMonster);
    this.multiTurnMoveService.clearMultiTurnMoveStates(opponentMonster);
    
    // Clear two-turn move states as well
    this.twoTurnMoveService.clearTwoTurnMoveState(playerMonster);
    this.twoTurnMoveService.clearTwoTurnMoveState(opponentMonster);

    // Clear only confusion status effect at battle start (other status effects persist)
    this.statusEffectService.clearConfusion(playerMonster);
    this.statusEffectService.clearConfusion(opponentMonster);

    // Get ability effects first
    const { battleContext, effects } = this.abilityEffectsService.initializeBattleContext(playerMonster, opponentMonster);
    
    // Generate and apply weather
    const weather = this.weatherService.generateRandomWeather();
    battleContext.weather = weather;
    
    // Add weather initialization message
    if (weather) {
      effects.push(this.weatherService.getWeatherDescription(weather.weather));
      
      // Apply weather-based stat boosts
      const playerWeatherBoosts = this.weatherService.applyWeatherStatBoosts(playerMonster, weather);
      const opponentWeatherBoosts = this.weatherService.applyWeatherStatBoosts(opponentMonster, weather);
      
      // Apply player weather boosts
      if (Object.keys(playerWeatherBoosts).length > 0) {
        Object.entries(playerWeatherBoosts).forEach(([stat, boost]) => {
          const currentBoost = battleContext.playerStatModifiers[stat as keyof StatModifiers] || 0;
          battleContext.playerStatModifiers[stat as keyof StatModifiers] = currentBoost + boost;
        });
      }
      
      // Apply opponent weather boosts
      if (Object.keys(opponentWeatherBoosts).length > 0) {
        Object.entries(opponentWeatherBoosts).forEach(([stat, boost]) => {
          const currentBoost = battleContext.opponentStatModifiers[stat as keyof StatModifiers] || 0;
          battleContext.opponentStatModifiers[stat as keyof StatModifiers] = currentBoost + boost;
        });
      }
    }
    
    return { battleContext, effects };
  }

  // Delegate to ability effects service
  applySpeedAbilities(monster: MonsterInstance, weather?: any): number {
    return this.abilityEffectsService.applySpeedAbilities(monster, weather);
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
  processEndOfTurn(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance,
    battleContext?: BattleContext,
    battleId?: string
  ) {
    return this.turnManagementService.processEndOfTurn(playerMonster, opponentMonster, battleContext, battleId);
  }

  determineTurnOrder(
    playerMonster: MonsterInstance, 
    opponentMonster: MonsterInstance,
    playerMove?: { priority: number },
    opponentMove?: { priority: number },
    battleContext?: BattleContext
  ): 'player' | 'opponent' {
    return this.turnManagementService.determineTurnOrder(playerMonster, opponentMonster, playerMove, opponentMove, battleContext);
  }

  checkBattleEnd(playerMonster: MonsterInstance, opponentMonster: MonsterInstance) {
    return this.turnManagementService.checkBattleEnd(playerMonster, opponentMonster);
  }

  // Delegate to turn management service for all forced moves
  getForcedMove(monster: MonsterInstance): string | null {
    return this.turnManagementService.getForcedMove(monster);
  }

  mustRecharge(monster: MonsterInstance): boolean {
    return this.twoTurnMoveService.mustRecharge(monster);
  }

  getTwoTurnMoveStatusMessage(monster: MonsterInstance): string | null {
    return this.twoTurnMoveService.getStatusMessage(monster);
  }

  getAllMoveStatusMessages(monster: MonsterInstance): string[] {
    return this.turnManagementService.getAllMoveStatusMessages(monster);
  }

  // Delegate to status effect service
  clearAllStatusEffects(monster: MonsterInstance): void {
    this.statusEffectService.clearAllStatusEffects(monster);
  }

  clearConfusion(monster: MonsterInstance): void {
    this.statusEffectService.clearConfusion(monster);
  }

  isSemiInvulnerable(monster: MonsterInstance): boolean {
    return this.twoTurnMoveService.isSemiInvulnerable(monster);
  }

  isCommittedToTwoTurnMove(monster: MonsterInstance): boolean {
    return this.twoTurnMoveService.isCommittedToTwoTurnMove(monster);
  }

  // Delegate to multi-turn move service
  isLockedIntoMove(monster: MonsterInstance): boolean {
    return this.multiTurnMoveService.isLockedIntoMove(monster);
  }

  getMultiTurnForcedMove(monster: MonsterInstance): string | null {
    return this.multiTurnMoveService.getForcedMove(monster);
  }

  isTrapped(monster: MonsterInstance): boolean {
    return this.multiTurnMoveService.isTrapped(monster);
  }

  canSwitchOut(monster: MonsterInstance): { canSwitch: boolean; reason?: string } {
    return this.multiTurnMoveService.canSwitchOut(monster);
  }

  getMultiTurnMoveStatusMessage(monster: MonsterInstance): string | null {
    return this.multiTurnMoveService.getStatusMessage(monster);
  }

  // Delegate to field tracker service
  switchMonsterInField(battleId: string, isPlayer: boolean, newMonster: MonsterInstance): void {
    this.fieldTrackerService.switchMonster(battleId, isPlayer, newMonster);
  }

  processFieldTurnEnd(battleId: string): void {
    this.fieldTrackerService.processEndOfTurn(battleId);
  }

  isFirstTurnOnField(battleId: string, monsterId: string): boolean {
    return this.fieldTrackerService.isFirstTurnOnField(battleId, monsterId);
  }

  cleanupBattleField(battleId: string): void {
    this.fieldTrackerService.cleanupBattle(battleId);
  }

  // Delegate to move validation service
  validateMove(battleId: string, monsterId: string, moveId: string, monster?: MonsterInstance): { canUse: boolean; reason?: string } {
    return this.moveValidationService.validateMove(battleId, monsterId, moveId, monster);
  }

  getUsableMoves(battleId: string, monster: MonsterInstance): { moveId: string; reason?: string }[] {
    return this.moveValidationService.getUsableMoves(battleId, monster);
  }

  hasUsableMoves(battleId: string, monster: MonsterInstance): boolean {
    return this.moveValidationService.hasUsableMoves(battleId, monster);
  }

  getFirstUsableMove(battleId: string, monster: MonsterInstance): string | null {
    return this.moveValidationService.getFirstUsableMove(battleId, monster);
  }

  recordMonsterAction(battleId: string, monsterId: string): void {
    this.fieldTrackerService.recordMonsterAction(battleId, monsterId);
  }
}
