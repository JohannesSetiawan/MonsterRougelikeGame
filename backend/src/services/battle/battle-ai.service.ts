import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class BattleAIService {
  constructor(private monsterService: MonsterService) {}

  generateEnemyAction(enemy: MonsterInstance): BattleAction {
    // Safety check: dead monsters can't take actions
    if (enemy.currentHp <= 0) {
      throw new Error('Dead monster cannot take actions');
    }
    
    // Simple AI: randomly choose from available moves
    if (enemy.moves.length === 0) {
      // Fallback if no moves available
      return { type: 'attack', moveId: 'scratch' };
    }

    // More intelligent AI: prefer higher power moves when enemy HP is low
    const enemyHpPercentage = enemy.currentHp / enemy.maxHp;
    
    if (enemyHpPercentage < 0.3) {
      // When low on health, prefer stronger moves
      const strongMoves = enemy.moves.filter(moveId => {
        const move = this.monsterService.getMoveData(moveId);
        return move && move.power >= 60;
      });
      
      if (strongMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * strongMoves.length);
        return { type: 'attack', moveId: strongMoves[randomIndex] };
      }
    }

    // Normal strategy: randomly choose any available move
    const randomMoveIndex = Math.floor(Math.random() * enemy.moves.length);
    const selectedMove = enemy.moves[randomMoveIndex];

    return { type: 'attack', moveId: selectedMove };
  }
}
