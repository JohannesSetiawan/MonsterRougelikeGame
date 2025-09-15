import { Injectable } from '@nestjs/common';
import { GameRun, Item } from '../../types';
import { MonsterService } from '../monster.service';
import { InventoryService } from './inventory.service';

export interface EncounterResult {
  type: 'wild_monster' | 'trainer' | 'item' | 'rest_site';
  data?: any;
  isDoubleBattle?: boolean;
}

@Injectable()
export class EncounterService {
  constructor(
    private monsterService: MonsterService,
    private inventoryService: InventoryService
  ) {}

  generateRandomEncounter(stageLevel: number, run?: GameRun): EncounterResult {
    const encounterTypes = ['wild_monster', 'wild_monster','wild_monster', 'wild_monster','wild_monster', 'wild_monster', 'item', 'rest_site']; // Higher chance for monsters
    const randomType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)] as any;

    // Check for shiny boost if run is provided
    let shinyBoost = 1;
    if (run) {
      shinyBoost = this.calculateShinyBoost(run);
    }

    switch (randomType) {
      case 'wild_monster':
        // Check for double battle conditions (10% chance if player has 2+ healthy monsters)
        const isDoubleBattle = this.shouldGenerateDoubleBattle(run);
        
        if (isDoubleBattle) {
          return {
            type: 'wild_monster',
            data: {
              isDoubleBattle: true,
              monster1: this.monsterService.getRandomWildMonster(stageLevel, shinyBoost),
              monster2: this.monsterService.getRandomWildMonster(stageLevel, shinyBoost)
            }
          };
        } else {
          return {
            type: 'wild_monster',
            data: this.monsterService.getRandomWildMonster(stageLevel, shinyBoost)
          };
        }
      
      case 'item':
        return {
          type: 'item',
          data: this.inventoryService.generateRandomItem()
        };
      
      case 'rest_site':
        return {
          type: 'rest_site',
          data: { healPercentage: 50 }
        };
      
      default:
        return {
          type: 'wild_monster',
          data: this.monsterService.getRandomWildMonster(stageLevel, shinyBoost)
        };
    }
  }

  private calculateShinyBoost(run: GameRun): number {
    let shinyBoost = 1;
    
    // Check for permanent luck charms
    if (run?.permanentItems) {
      const luckCharmCount = run.permanentItems.filter(item => item === 'luck_charm').length;
      shinyBoost *= Math.pow(2, luckCharmCount); // 2x multiplier per luck charm, stacks
    }
    
    // Check for temporary shiny boost (legacy)
    if (run?.temporaryEffects?.shinyBoost?.active) {
      shinyBoost *= run.temporaryEffects.shinyBoost.multiplier;
      
      // Decrease duration and deactivate if expired
      run.temporaryEffects.shinyBoost.duration--;
      if (run.temporaryEffects.shinyBoost.duration <= 0) {
        run.temporaryEffects.shinyBoost.active = false;
      }
    }

    return shinyBoost;
  }

  applyTemporaryEffect(run: GameRun, effectType: string, duration: number, multiplier?: number): void {
    if (!run.temporaryEffects) {
      run.temporaryEffects = {};
    }

    switch (effectType) {
      case 'shiny_boost':
        run.temporaryEffects.shinyBoost = {
          active: true,
          duration,
          multiplier: multiplier || 2
        };
        break;
      // Add more temporary effects as needed
    }
  }

  applyPermanentEffect(run: GameRun, effectType: string): void {
    if (!run.permanentItems) {
      run.permanentItems = [];
    }

    switch (effectType) {
      case 'luck_charm':
        run.permanentItems.push('luck_charm');
        break;
      // Add more permanent effects as needed
    }
  }

  private shouldGenerateDoubleBattle(run?: GameRun): boolean {
    // Double battles can only occur if player has at least 2 non-fainted monsters
    if (!run || !run.team) {
      return false;
    }

    const healthyMonsters = run.team.filter(monster => monster.currentHp > 0);
    
    // Need at least 2 healthy monsters for double battles
    if (healthyMonsters.length < 2) {
      return false;
    }

    // Temporarily 100% chance for testing double battle fix
    return Math.random() < 1;
  }

  updateTemporaryEffects(run: GameRun): void {
    if (!run.temporaryEffects) {
      return;
    }

    // Update shiny boost duration
    if (run.temporaryEffects.shinyBoost?.active) {
      run.temporaryEffects.shinyBoost.duration--;
      if (run.temporaryEffects.shinyBoost.duration <= 0) {
        run.temporaryEffects.shinyBoost.active = false;
      }
    }

    // Add more temporary effect updates as needed
  }
}