import { Injectable } from '@nestjs/common';
import { MonsterInstance, MoveLearnEvent } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class ExperienceService {
  constructor(private monsterService: MonsterService) {}

  generateExperience(defeatedMonster: MonsterInstance): number {
    const baseExp = defeatedMonster.level * 100;
    const rarityMultiplier = this.getRarityMultiplier(defeatedMonster.monsterId);
    return Math.floor(baseExp * rarityMultiplier);
  }

  calculateExperienceForNextLevel(monster: MonsterInstance): number {
    return this.monsterService.calculateExperienceForNextLevel(monster);
  }

  addExperienceToMonster(monster: MonsterInstance, expGain: number): { monster: MonsterInstance; leveledUp: boolean; levelsGained: number; moveLearnEvents: MoveLearnEvent[]; autoLearnedMoves: string[] } {
    return this.monsterService.addExperience(monster, expGain);
  }

  // For double battles: distribute the same amount of XP to all active player monsters
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
    const results = monsters.map(monster => {
      const result = this.monsterService.addExperience(monster, expGain);
      return {
        monster: result.monster,
        leveledUp: result.leveledUp,
        levelsGained: result.levelsGained,
        moveLearnEvents: result.moveLearnEvents,
        autoLearnedMoves: result.autoLearnedMoves
      };
    });

    return {
      monsters: results.map(r => r.monster),
      levelUpResults: results
    };
  }

  private getRarityMultiplier(monsterId: string): number {
    const monster = this.monsterService.getMonsterData(monsterId);
    switch (monster.rarity) {
      case 'common': return 1;
      case 'uncommon': return 1.2;
      case 'rare': return 1.5;
      case 'legendary': return 2;
      default: return 1;
    }
  }
}
