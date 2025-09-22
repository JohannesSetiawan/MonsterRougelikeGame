import { Injectable } from '@nestjs/common';
import { MonsterInstance, Monster, MonsterStats, MoveLearnEvent } from '../types';
import { DataLoaderService } from './data-loader.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MonsterService {
  
  constructor(private dataLoaderService: DataLoaderService) {}
  
  createMonsterInstance(monsterId: string, level: number = 1, shinyBoost: number = 1): MonsterInstance {
    const monster = this.dataLoaderService.getMonster(monsterId);
    if (!monster) {
      throw new Error(`Monster with id ${monsterId} not found`);
    }

    const stats = this.calculateStats(monster.baseStats, level);
    const maxHp = stats.hp;

    // Select a random ability
    const ability = monster.abilities[Math.floor(Math.random() * monster.abilities.length)];

    // Select starting moves (up to 4, prioritize moves learnable at or below current level)
    const availableMoves = monster.learnableMoves
      .filter(([moveId, levelLearned]) => levelLearned <= level)
      .sort(([, a], [, b]) => a - b) // Sort by level learned (ascending)
      .slice(0, 4) // Take first 4 moves
      .map(([moveId]) => moveId); // Extract just the move IDs

    // Initialize PP for each move
    const movePP: Record<string, number> = {};
    availableMoves.forEach(moveId => {
      const moveData = this.dataLoaderService.getMove(moveId);
      movePP[moveId] = moveData ? moveData.pp : 20; // default to 20 if move not found
    });

    // Calculate shiny chance with boost
    const baseShinyRate = 0.001; // 0.1% base rate
    const enhancedShinyRate = Math.min(0.5, baseShinyRate * shinyBoost); // Cap at 50%

    return {
      id: this.generateId(),
      monsterId,
      name: monster.name,
      level,
      currentHp: maxHp,
      maxHp,
      stats,
      moves: availableMoves,
      movePP,
      ability,
      experience: 0,
      isShiny: Math.random() < enhancedShinyRate
    };
  }

  calculateStats(baseStats: MonsterStats, level: number): MonsterStats {
    // Simple stat calculation formula
    return {
      hp: Math.floor(((2 * baseStats.hp + 31) * level) / 100 + level + 10),
      attack: Math.floor(((2 * baseStats.attack + 31) * level) / 100 + 5),
      defense: Math.floor(((2 * baseStats.defense + 31) * level) / 100 + 5),
      specialAttack: Math.floor(((2 * baseStats.specialAttack + 31) * level) / 100 + 5),
      specialDefense: Math.floor(((2 * baseStats.specialDefense + 31) * level) / 100 + 5),
      speed: Math.floor(((2 * baseStats.speed + 31) * level) / 100 + 5)
    };
  }

  levelUpMonster(monster: MonsterInstance): MonsterInstance {
    const newLevel = monster.level + 1;
    const monsterData = this.dataLoaderService.getMonster(monster.monsterId);
    if (!monsterData) {
      throw new Error(`Monster data not found for ${monster.monsterId}`);
    }
    const newStats = this.calculateStats(monsterData.baseStats, newLevel);
    const hpIncrease = newStats.hp - monster.stats.hp;

    return {
      ...monster,
      level: newLevel,
      stats: newStats,
      maxHp: newStats.hp,
      currentHp: monster.currentHp + hpIncrease,
      experience: 0
    };
  }

  calculateExperienceForNextLevel(monster: MonsterInstance): number {
    const monsterData = this.dataLoaderService.getMonster(monster.monsterId);
    if (!monsterData) {
      throw new Error(`Monster data not found for ${monster.monsterId}`);
    }
    
    const nextLevel = monster.level + 1;
    // Formula: 100 + nextLevel * growth_index * 50
    return 100 + nextLevel * monsterData.growth_index * 50;
  }

  addExperience(monster: MonsterInstance, expGain: number): { monster: MonsterInstance; leveledUp: boolean; levelsGained: number; moveLearnEvents: MoveLearnEvent[]; autoLearnedMoves: string[] } {
    const monsterData = this.dataLoaderService.getMonster(monster.monsterId);
    if (!monsterData) {
      throw new Error(`Monster data not found for ${monster.monsterId}`);
    }

    let updatedMonster = { ...monster };
    updatedMonster.experience += expGain;
    
    let leveledUp = false;
    let levelsGained = 0;
    const moveLearnEvents: MoveLearnEvent[] = [];
    const autoLearnedMoves: string[] = [];
    
    // Check for level ups (can gain multiple levels at once)
    while (true) {
      const expNeeded = this.calculateExperienceForNextLevel(updatedMonster);
      
      if (updatedMonster.experience >= expNeeded) {
        const oldLevel = updatedMonster.level;
        updatedMonster.experience -= expNeeded;
        updatedMonster = this.levelUpMonster(updatedMonster);
        leveledUp = true;
        levelsGained++;
        
        // Check for moves learned at this level
        const moveCheckResult = this.checkMovesLearnedAtLevel(updatedMonster, updatedMonster.level);
        moveLearnEvents.push(...moveCheckResult.moveLearnEvents);
        autoLearnedMoves.push(...moveCheckResult.autoLearnedMoves);
      } else {
        break;
      }
    }
    
    return { monster: updatedMonster, leveledUp, levelsGained, moveLearnEvents, autoLearnedMoves };
  }

  getRandomWildMonster(stageLevel: number, shinyBoost: number = 1): MonsterInstance {
    const monsters = this.dataLoaderService.getMonsters();
    const monsterIds = Object.keys(monsters);
    const availableMonsters = monsterIds.filter(id => {
      const monster = monsters[id];
      // Simple rarity-based availability
      if (stageLevel < 30) return monster.rarity === 'common' || monster.rarity === 'uncommon';
      if (stageLevel < 600) return monster.rarity !== 'legendary' && monster.rarity !== 'debug';
      return monster.rarity !== 'debug';
    });

    var randomId = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    
    const level = Math.max(1, Math.ceil(stageLevel / 10) + Math.floor(Math.random() * 3) - 1); // ±1 level variance
    
    return this.createMonsterInstance(randomId, level, shinyBoost);
  }

  healMonster(monster: MonsterInstance, amount: number): MonsterInstance {
    return {
      ...monster,
      currentHp: Math.min(monster.maxHp, monster.currentHp + amount)
    };
  }

  private generateId(): string {
    return uuidv4();
  }

  getMonsterData(monsterId: string): Monster {
    return this.dataLoaderService.getMonster(monsterId);
  }

  getMoveData(moveId: string) {
    return this.dataLoaderService.getMove(moveId);
  }

  getAllMoves() {
    return this.dataLoaderService.getMoves();
  }

  getAllMonsters() {
    return this.dataLoaderService.getMonsters();
  }

  getAbilityData(abilityId: string) {
    return this.dataLoaderService.getAbility(abilityId);
  }

  // PP Management Methods
  restoreAllPP(monster: MonsterInstance): void {
    // Initialize movePP if it doesn't exist (for backwards compatibility)
    if (!monster.movePP) {
      monster.movePP = {};
    }
    
    monster.moves.forEach(moveId => {
      const moveData = this.dataLoaderService.getMove(moveId);
      monster.movePP[moveId] = moveData ? moveData.pp : 20; // default to 20 if move not found
    });
  }

  restoreMovePP(monster: MonsterInstance, moveId: string, amount?: number): void {
    // Initialize movePP if it doesn't exist (for backwards compatibility)
    if (!monster.movePP) {
      monster.movePP = {};
    }
    
    const moveData = this.dataLoaderService.getMove(moveId);
    if (moveData && monster.moves.includes(moveId)) {
      if (amount) {
        monster.movePP[moveId] = Math.min(moveData.pp, (monster.movePP[moveId] || 0) + amount);
      } else {
        monster.movePP[moveId] = moveData.pp;
      }
    }
  }

  getMovePP(monster: MonsterInstance, moveId: string): { current: number; max: number } {
    // Initialize movePP if it doesn't exist (for backwards compatibility)
    if (!monster.movePP) {
      monster.movePP = {};
      monster.moves.forEach(mId => {
        const moveData = this.dataLoaderService.getMove(mId);
        monster.movePP[mId] = moveData ? moveData.pp : 20;
      });
    }
    
    const moveData = this.dataLoaderService.getMove(moveId);
    return {
      current: monster.movePP[moveId] || 0,
      max: moveData ? moveData.pp : 0
    };
  }

  // Move Learning Methods
  checkMovesLearnedAtLevel(monster: MonsterInstance, level: number): { moveLearnEvents: MoveLearnEvent[]; autoLearnedMoves: string[] } {
    const monsterData = this.dataLoaderService.getMonster(monster.monsterId);
    if (!monsterData) {
      return { moveLearnEvents: [], autoLearnedMoves: [] };
    }

    const moveLearnEvents: MoveLearnEvent[] = [];
    const autoLearnedMoves: string[] = [];
    const movesAtLevel = monsterData.learnableMoves.filter(([, levelLearned]) => levelLearned === level);

    for (const [moveId] of movesAtLevel) {
      // Skip if monster already knows this move
      if (monster.moves.includes(moveId)) {
        continue;
      }

      const canLearn = monster.moves.length < 4;
      
      if (canLearn) {
        // Automatically learn the move if there's space
        monster.moves.push(moveId);
        // Initialize PP for the new move
        const moveData = this.dataLoaderService.getMove(moveId);
        if (moveData) {
          monster.movePP[moveId] = moveData.pp;
        }
        autoLearnedMoves.push(moveId);
      } else {
        // Need player choice for replacement
        moveLearnEvents.push({
          monsterId: monster.id,
          newMove: moveId,
          level,
          canLearn: false,
          currentMoves: [...monster.moves]
        });
      }
    }

    return { moveLearnEvents, autoLearnedMoves };
  }

  learnMove(monster: MonsterInstance, moveId: string, moveToReplace?: string): MonsterInstance {
    const updatedMonster = { ...monster };
    
    // If monster has less than 4 moves, just add the new move
    if (updatedMonster.moves.length < 4) {
      updatedMonster.moves = [...updatedMonster.moves, moveId];
    } else if (moveToReplace && updatedMonster.moves.includes(moveToReplace)) {
      // Replace the specified move
      updatedMonster.moves = updatedMonster.moves.map(move => 
        move === moveToReplace ? moveId : move
      );
      // Remove PP tracking for the old move and add for the new move
      delete updatedMonster.movePP[moveToReplace];
    } else {
      throw new Error('Cannot learn move: no space and no move specified to replace');
    }

    // Initialize PP for the new move
    const moveData = this.dataLoaderService.getMove(moveId);
    if (moveData) {
      updatedMonster.movePP[moveId] = moveData.pp;
    }

    return updatedMonster;
  }

  getMovesLearnableAtLevel(monsterId: string, level: number): string[] {
    const monsterData = this.dataLoaderService.getMonster(monsterId);
    if (!monsterData) {
      return [];
    }

    return monsterData.learnableMoves
      .filter(([, levelLearned]) => levelLearned === level)
      .map(([moveId]) => moveId);
  }
}
