import { Injectable } from '@nestjs/common';
import { GameRun, Item, MonsterInstance } from '../../types';
import { MonsterService } from '../monster.service';
import { DataLoaderService } from '../data-loader.service';

@Injectable()
export class InventoryService {
  constructor(
    private monsterService: MonsterService,
    private dataLoaderService: DataLoaderService
  ) {}

  getStartingInventory(): Item[] {
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

  addCurrency(run: GameRun, amount: number): GameRun {
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.currency += amount;
    return run;
  }

  addItem(run: GameRun, item: Item): GameRun {
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

  useItem(
    run: GameRun, 
    itemId: string, 
    targetMonsterId?: string, 
    moveId?: string
  ): { success: boolean; message: string; run: GameRun } {
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    const item = run.inventory.find(i => i.id === itemId && i.quantity > 0);
    if (!item) {
      return { success: false, message: 'Item not found or out of stock', run };
    }

    // For healing items, require explicit target selection
    const isHealingItem = item.type === 'healing';
    const targetMonster = targetMonsterId 
      ? run.team.find(m => m.id === targetMonsterId)
      : (isHealingItem ? null : run.team.find(m => m.currentHp < m.maxHp)); // Only auto-target for non-healing items

    // For healing items, always require a target monster ID
    if (isHealingItem && !targetMonsterId) {
      return { success: false, message: 'Please select a target monster for this healing item', run };
    }

    if (!targetMonster && (item.type === 'healing' || item.effect.startsWith('pp_restore') || item.effect.startsWith('boost_'))) {
      return { success: false, message: 'No valid target for this item', run };
    }

    let success = false;
    let message = '';

    switch (item.effect) {
      case 'heal_50':
        if (targetMonster) {
          if (targetMonster.currentHp === 0) {
            message = `${targetMonster.name} is fainted and cannot be healed with a regular potion!`;
            break;
          }
          if (targetMonster.currentHp >= targetMonster.maxHp) {
            message = `${targetMonster.name} is already at full health!`;
            break;
          }
          const healAmount = Math.min(50, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_200':
        if (targetMonster) {
          if (targetMonster.currentHp === 0) {
            message = `${targetMonster.name} is fainted and cannot be healed with a regular potion!`;
            break;
          }
          if (targetMonster.currentHp >= targetMonster.maxHp) {
            message = `${targetMonster.name} is already at full health!`;
            break;
          }
          const healAmount = Math.min(200, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_500':
        if (targetMonster) {
          if (targetMonster.currentHp === 0) {
            message = `${targetMonster.name} is fainted and cannot be healed with a regular potion!`;
            break;
          }
          if (targetMonster.currentHp >= targetMonster.maxHp) {
            message = `${targetMonster.name} is already at full health!`;
            break;
          }
          const healAmount = Math.min(500, targetMonster.maxHp - targetMonster.currentHp);
          targetMonster.currentHp += healAmount;
          success = true;
          message = `${targetMonster.name} recovered ${healAmount} HP!`;
        }
        break;
      
      case 'heal_full':
        if (targetMonster) {
          if (targetMonster.currentHp === 0) {
            message = `${targetMonster.name} is fainted and cannot be healed with a regular potion!`;
            break;
          }
          if (targetMonster.currentHp >= targetMonster.maxHp) {
            message = `${targetMonster.name} is already at full health!`;
            break;
          }
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

      case 'catch_improved':
        // This will be handled in battle context, just mark as successful for inventory management
        success = true;
        message = 'Great Ball is ready to use!';
        break;

      case 'catch_excellent':
        // This will be handled in battle context, just mark as successful for inventory management
        success = true;
        message = 'Ultra Ball is ready to use!';
        break;

      case 'pp_restore_10':
        if (targetMonster && moveId) {
          const moveData = this.monsterService.getMoveData(moveId);
          if (moveData && targetMonster.moves.includes(moveId)) {
            if (!targetMonster.movePP) targetMonster.movePP = {};
            const currentPP = targetMonster.movePP[moveId] || 0;
            const maxPP = moveData.pp;
            const restoreAmount = Math.min(10, maxPP - currentPP);
            targetMonster.movePP[moveId] = currentPP + restoreAmount;
            success = true;
            message = `${moveData.name} recovered ${restoreAmount} PP!`;
          } else {
            message = 'Invalid move selected!';
          }
        } else {
          message = 'Please select a move to restore PP!';
        }
        break;

      case 'pp_restore_full':
        if (targetMonster && moveId) {
          const moveData = this.monsterService.getMoveData(moveId);
          if (moveData && targetMonster.moves.includes(moveId)) {
            if (!targetMonster.movePP) targetMonster.movePP = {};
            const currentPP = targetMonster.movePP[moveId] || 0;
            const maxPP = moveData.pp;
            const restoreAmount = maxPP - currentPP;
            targetMonster.movePP[moveId] = maxPP;
            success = true;
            message = `${moveData.name} fully recovered ${restoreAmount} PP!`;
          } else {
            message = 'Invalid move selected!';
          }
        } else {
          message = 'Please select a move to restore PP!';
        }
        break;

      case 'pp_restore_all_10':
        if (targetMonster) {
          if (!targetMonster.movePP) targetMonster.movePP = {};
          let totalRestored = 0;
          targetMonster.moves.forEach(moveId => {
            const moveData = this.monsterService.getMoveData(moveId);
            if (moveData) {
              const currentPP = targetMonster.movePP[moveId] || 0;
              const maxPP = moveData.pp;
              const restoreAmount = Math.min(10, maxPP - currentPP);
              targetMonster.movePP[moveId] = currentPP + restoreAmount;
              totalRestored += restoreAmount;
            }
          });
          success = true;
          message = `All moves recovered ${totalRestored} total PP!`;
        }
        break;

      case 'pp_restore_all_full':
        if (targetMonster) {
          this.monsterService.restoreAllPP(targetMonster);
          success = true;
          message = `${targetMonster.name}'s PP was fully restored for all moves!`;
        }
        break;

      case 'guaranteed_flee':
        // This will be handled in battle context, just mark as successful for inventory management
        success = true;
        message = 'Escape Rope is ready to use!';
        break;

      case 'boost_attack':
        if (targetMonster) {
          // Add temporary battle boost - this will be handled in battle context
          success = true;
          message = `${targetMonster.name}'s Attack was boosted!`;
        }
        break;

      case 'boost_defense':
        if (targetMonster) {
          // Add temporary battle boost - this will be handled in battle context
          success = true;
          message = `${targetMonster.name}'s Defense was boosted!`;
        }
        break;

      case 'boost_speed':
        if (targetMonster) {
          // Add temporary battle boost - this will be handled in battle context
          success = true;
          message = `${targetMonster.name}'s Speed was boosted!`;
        }
        break;

      case 'permanent_shiny_boost':
        // Add permanent luck charm effect
        if (!run.permanentItems) run.permanentItems = [];
        run.permanentItems.push('luck_charm');
        success = true;
        message = 'Luck Charm activated! Shiny encounter rate permanently increased by 2x!';
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

  getItemData(itemId: string) {
    const allItems = this.dataLoaderService.getItems();
    return allItems[itemId];
  }

  generateRandomItem(): Item {
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
}