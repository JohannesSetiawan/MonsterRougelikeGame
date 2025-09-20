import { Injectable } from '@nestjs/common';
import { GameRun, Item } from '../../types';
import { MonsterService } from '../monster.service';
import { InventoryService } from './inventory.service';

export interface EncounterResult {
  type: 'wild_monster' | 'trainer' | 'item' | 'rest_site';
  data?: any;
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
        return {
          type: 'wild_monster',
          data: this.monsterService.getRandomWildMonster(stageLevel, shinyBoost)
        };
      
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

    return shinyBoost;
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
}