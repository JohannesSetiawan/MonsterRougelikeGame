import { Injectable } from '@nestjs/common';
import { MonsterInstance, Monster, MonsterStats } from '../types';
import { DataLoaderService } from './data-loader.service';

@Injectable()
export class MonsterService {
  
  constructor(private dataLoaderService: DataLoaderService) {}
  
  createMonsterInstance(monsterId: string, level: number = 1): MonsterInstance {
    const monster = this.dataLoaderService.getMonster(monsterId);
    if (!monster) {
      throw new Error(`Monster with id ${monsterId} not found`);
    }

    const stats = this.calculateStats(monster.baseStats, level);
    const maxHp = stats.hp;

    // Select a random ability
    const ability = monster.abilities[Math.floor(Math.random() * monster.abilities.length)];

    // Select starting moves (up to 4, prioritize lower level moves)
    const availableMoves = monster.learnableMoves.slice(0, Math.min(4, monster.learnableMoves.length));

    // Initialize PP for each move
    const movePP: Record<string, number> = {};
    availableMoves.forEach(moveId => {
      const moveData = this.dataLoaderService.getMove(moveId);
      movePP[moveId] = moveData ? moveData.pp : 20; // default to 20 if move not found
    });

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
      isShiny: Math.random() < 0.001 // 0.1% chance for shiny
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

  getRandomWildMonster(stageLevel: number): MonsterInstance {
    const monsters = this.dataLoaderService.getMonsters();
    const monsterIds = Object.keys(monsters);
    const availableMonsters = monsterIds.filter(id => {
      const monster = monsters[id];
      // Simple rarity-based availability
      if (stageLevel < 30) return monster.rarity === 'common' || monster.rarity === 'uncommon';
      if (stageLevel < 600) return monster.rarity !== 'legendary';
      return true;
    });

    const randomId = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    const level = Math.max(1, Math.ceil(stageLevel / 10) + Math.floor(Math.random() * 3) - 1); // ±1 level variance
    
    return this.createMonsterInstance(randomId, level);
  }

  healMonster(monster: MonsterInstance, amount: number): MonsterInstance {
    return {
      ...monster,
      currentHp: Math.min(monster.maxHp, monster.currentHp + amount)
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
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
    monster.moves.forEach(moveId => {
      const moveData = this.dataLoaderService.getMove(moveId);
      if (moveData) {
        monster.movePP[moveId] = moveData.pp;
      }
    });
  }

  restoreMovePP(monster: MonsterInstance, moveId: string, amount?: number): void {
    const moveData = this.dataLoaderService.getMove(moveId);
    if (moveData && monster.movePP[moveId] !== undefined) {
      if (amount) {
        monster.movePP[moveId] = Math.min(moveData.pp, monster.movePP[moveId] + amount);
      } else {
        monster.movePP[moveId] = moveData.pp;
      }
    }
  }

  getMovePP(monster: MonsterInstance, moveId: string): { current: number; max: number } {
    const moveData = this.dataLoaderService.getMove(moveId);
    return {
      current: monster.movePP[moveId] || 0,
      max: moveData ? moveData.pp : 0
    };
  }
}
