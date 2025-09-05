import { Injectable } from '@nestjs/common';
import { GameRun, Player, MonsterInstance, Item } from '../types';
import { MonsterService } from './monster.service';
import { DataLoaderService } from './data-loader.service';

@Injectable()
export class GameService {
  private players: Map<string, Player> = new Map();
  private gameRuns: Map<string, GameRun> = new Map();

  constructor(
    private monsterService: MonsterService,
    private dataLoaderService: DataLoaderService
  ) {}

  createPlayer(username: string): Player {
    const player: Player = {
      id: this.generateId(),
      username,
      permanentCurrency: 100, // Starting currency
      unlockedStarters: [...this.dataLoaderService.getStarterMonsters()],
      unlockedAbilities: [],
      totalRuns: 0,
      bestStage: 0,
      createdAt: new Date()
    };

    this.players.set(player.id, player);
    return player;
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  startNewRun(playerId: string, starterId: string): GameRun {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (!player.unlockedStarters.includes(starterId)) {
      throw new Error('Starter not unlocked');
    }

    // End any active runs
    const activeRun = this.getActiveRun(playerId);
    if (activeRun) {
      activeRun.isActive = false;
      activeRun.endedAt = new Date();
    }

    // Create starter monster
    const starterMonster = this.monsterService.createMonsterInstance(starterId, 5);

    // Create new run
    const gameRun: GameRun = {
      id: this.generateId(),
      playerId,
      currentStage: 1,
      team: [starterMonster],
      inventory: this.getStartingInventory(),
      currency: this.players.get(playerId)?.permanentCurrency || 100,
      isActive: true,
      createdAt: new Date()
    };

    this.gameRuns.set(gameRun.id, gameRun);
    player.totalRuns++;

    return gameRun;
  }

  getActiveRun(playerId: string): GameRun | undefined {
    for (const run of this.gameRuns.values()) {
      if (run.playerId === playerId && run.isActive) {
        return run;
      }
    }
    return undefined;
  }

  getGameRun(runId: string): GameRun | undefined {
    return this.gameRuns.get(runId);
  }

  progressStage(runId: string): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.currentStage++;
    
    // Update player's best stage
    const player = this.players.get(run.playerId);
    if (player && run.currentStage > player.bestStage) {
      player.bestStage = run.currentStage;
    }

    // Restore PP for all team monsters when progressing to next stage
    run.team.forEach(monster => {
      this.monsterService.restoreAllPP(monster);
    });

    // Check for victory condition (reaching stage 20)
    if (run.currentStage > 200000) {
      this.endRun(runId, 'victory');
      return run;
    }

    return run;
  }

  addMonsterToTeam(runId: string, monster: MonsterInstance): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    if (run.team.length < 6) { // Max team size
      run.team.push(monster);
    } else {
      throw new Error('Team is full');
    }

    return run;
  }

  addCurrency(runId: string, amount: number): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.currency += amount;
    return run;
  }

  addItem(runId: string, item: Item): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    const existingItem = run.inventory.find(i => i.id === item.id);
    if (existingItem) {
      existingItem.quantity += item.quantity;
    } else {
      run.inventory.push(item);
    }

    return run;
  }

  useItem(runId: string, itemId: string, targetMonsterId?: string): { success: boolean; message: string; run: GameRun } {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    const item = run.inventory.find(i => i.id === itemId && i.quantity > 0);
    if (!item) {
      return { success: false, message: 'Item not found or out of stock', run };
    }

    const targetMonster = targetMonsterId 
      ? run.team.find(m => m.id === targetMonsterId)
      : run.team.find(m => m.currentHp < m.maxHp); // Auto-target injured monster

    if (!targetMonster && item.type === 'healing') {
      return { success: false, message: 'No valid target for this item', run };
    }

    let success = false;
    let message = '';

    switch (item.effect) {
      case 'heal_50':
        if (targetMonster) {
          const healAmount = Math.min(50, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_200':
        if (targetMonster) {
          const healAmount = Math.min(200, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_500':
        if (targetMonster) {
          const healAmount = Math.min(500, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_full':
        if (targetMonster) {
          const healAmount = targetMonster.maxHp - targetMonster.currentHp;
          targetMonster.currentHp = targetMonster.maxHp;
          success = true;
          message = `${targetMonster.name} fully recovered ${healAmount} HP!`;
        }
        break;
      
      case 'revive_half':
        if (targetMonster && targetMonster.currentHp === 0) {
          targetMonster.currentHp = Math.floor(targetMonster.maxHp / 2);
          success = true;
          message = `${targetMonster.name} was revived with half HP!`;
        } else if (targetMonster && targetMonster.currentHp > 0) {
          message = `${targetMonster.name} is not fainted!`;
        }
        break;
      
      case 'revive_full':
        if (targetMonster && targetMonster.currentHp === 0) {
          targetMonster.currentHp = targetMonster.maxHp;
          success = true;
          message = `${targetMonster.name} was revived with full HP!`;
        } else if (targetMonster && targetMonster.currentHp > 0) {
          message = `${targetMonster.name} is not fainted!`;
        }
        break;
      
      case 'level_up':
        if (targetMonster) {
          const leveledUpMonster = this.monsterService.levelUpMonster(targetMonster);
          // Update the target monster with the leveled up stats
          Object.assign(targetMonster, leveledUpMonster);
          success = true;
          message = `${targetMonster.name} leveled up to level ${targetMonster.level}!`;
        }
        break;
      
      default:
        message = 'Unknown item effect';
        break;
    }

    if (success) {
      item.quantity--;
      if (item.quantity === 0) {
        run.inventory = run.inventory.filter(i => i.id !== itemId);
      }
    }

    return { success, message, run };
  }

  endRun(runId: string, reason: 'victory' | 'defeat'): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.isActive = false;
    run.endedAt = new Date();

    // Award permanent currency based on performance
    const player = this.players.get(run.playerId);
    if (player) {
      const currencyReward = run.currentStage * 10 + (reason === 'victory' ? 100 : 0);
      player.permanentCurrency += currencyReward;
    }

    return run;
  }

  generateRandomEncounter(stageLevel: number): {
    type: 'wild_monster' | 'trainer' | 'item' | 'rest_site';
    data?: any;
  } {
    const encounterTypes = ['wild_monster', 'wild_monster','wild_monster', 'wild_monster','wild_monster', 'wild_monster', 'item', 'rest_site']; // Higher chance for monsters
    const randomType = encounterTypes[Math.floor(Math.random() * encounterTypes.length)] as any;

    switch (randomType) {
      case 'wild_monster':
        return {
          type: 'wild_monster',
          data: this.monsterService.getRandomWildMonster(stageLevel)
        };
      
      case 'item':
        return {
          type: 'item',
          data: this.generateRandomItem()
        };
      
      case 'rest_site':
        return {
          type: 'rest_site',
          data: { healPercentage: 50 }
        };
      
      default:
        return {
          type: 'wild_monster',
          data: this.monsterService.getRandomWildMonster(stageLevel)
        };
    }
  }

  private generateRandomItem(): Item {
    const allItems = this.dataLoaderService.getItems();
    const commonItems = Object.values(allItems).filter(item => 
      item.rarity === 'common' || item.rarity === 'uncommon'
    );
    
    if (commonItems.length === 0) {
      // Fallback if no items are loaded
      return { 
        id: 'potion', 
        name: 'Potion', 
        description: 'Restores 50 HP', 
        type: 'healing', 
        effect: 'heal_50', 
        quantity: 1 
      };
    }

    const selectedItem = commonItems[Math.floor(Math.random() * commonItems.length)];
    return { ...selectedItem, quantity: 1 };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  restoreMonsterPP(
    runId: string, 
    monsterId: string, 
    options: { moveId?: string; amount?: number; restoreAll?: boolean }
  ) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    const monster = run.team.find(m => m.id === monsterId);
    if (!monster) {
      throw new Error('Monster not found in team');
    }

    if (options.restoreAll) {
      this.monsterService.restoreAllPP(monster);
    } else if (options.moveId) {
      this.monsterService.restoreMovePP(monster, options.moveId, options.amount);
    }

    return { success: true, monster };
  }

  restoreTeamPP(runId: string) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    run.team.forEach(monster => {
      this.monsterService.restoreAllPP(monster);
    });

    return { success: true, team: run.team };
  }

  useRestSite(runId: string) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    // Fully restore HP and PP for all team members
    run.team.forEach(monster => {
      monster.currentHp = monster.maxHp; // Full HP restoration
      this.monsterService.restoreAllPP(monster); // Full PP restoration
    });

    return { 
      success: true, 
      message: 'Your team has been fully healed and all PP has been restored!',
      team: run.team 
    };
  }

  private getStartingInventory(): Item[] {
    const allItems = this.dataLoaderService.getItems();
    
    // Get specific starting items from the JSON data
    const potionItem = allItems['potion'];
    const monsterBallItem = allItems['monster_ball'];
    
    const startingItems: Item[] = [];
    
    if (potionItem) {
      startingItems.push({
        ...potionItem,
        quantity: 3
      });
    }
    
    if (monsterBallItem) {
      startingItems.push({
        ...monsterBallItem,
        quantity: 5
      });
    }
    
    return startingItems;
  }
}
