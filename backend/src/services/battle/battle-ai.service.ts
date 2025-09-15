import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class BattleAIService {
  constructor(private monsterService: MonsterService) {}

  generateEnemyAction(enemy: MonsterInstance, targets?: MonsterInstance[]): BattleAction {
    // Safety check: dead monsters can't take actions
    if (enemy.currentHp <= 0) {
      throw new Error('Dead monster cannot take actions');
    }
    
    // Simple AI: randomly choose from available moves
    if (enemy.moves.length === 0) {
      // Fallback if no moves available
      const action: BattleAction = { type: 'attack', moveId: 'scratch' };
      
      // For double battles, target the lowest HP opponent
      if (targets && targets.length > 1) {
        const lowestHpTarget = this.findLowestHpTarget(targets);
        if (lowestHpTarget) {
          action.targetMonsterId = lowestHpTarget.id;
        }
      }
      
      return action;
    }

    // More intelligent AI: prefer higher power moves when enemy HP is low
    const enemyHpPercentage = enemy.currentHp / enemy.maxHp;
    let selectedMove: string;
    
    if (enemyHpPercentage < 0.3) {
      // When low on health, prefer stronger moves
      const strongMoves = enemy.moves.filter(moveId => {
        const move = this.monsterService.getMoveData(moveId);
        return move && move.power >= 60;
      });
      
      if (strongMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * strongMoves.length);
        selectedMove = strongMoves[randomIndex];
      } else {
        // Fall back to random move if no strong moves available
        const randomMoveIndex = Math.floor(Math.random() * enemy.moves.length);
        selectedMove = enemy.moves[randomMoveIndex];
      }
    } else {
      // Normal strategy: randomly choose any available move
      const randomMoveIndex = Math.floor(Math.random() * enemy.moves.length);
      selectedMove = enemy.moves[randomMoveIndex];
    }

    const action: BattleAction = { type: 'attack', moveId: selectedMove };
    
    // For double battles, target the lowest HP opponent
    if (targets && targets.length > 1) {
      const lowestHpTarget = this.findLowestHpTarget(targets);
      if (lowestHpTarget) {
        action.targetMonsterId = lowestHpTarget.id;
      }
    }

    return action;
  }

  private findLowestHpTarget(targets: MonsterInstance[]): MonsterInstance | null {
    // Filter out fainted monsters
    const alivTargets = targets.filter(monster => monster.currentHp > 0);
    
    if (alivTargets.length === 0) {
      return null;
    }

    // Find the target with the lowest HP percentage
    return alivTargets.reduce((lowest, current) => {
      const lowestHpPercentage = lowest.currentHp / lowest.maxHp;
      const currentHpPercentage = current.currentHp / current.maxHp;
      return currentHpPercentage < lowestHpPercentage ? current : lowest;
    });
  }
}
