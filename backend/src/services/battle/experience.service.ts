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
