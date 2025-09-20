import { Injectable } from '@nestjs/common';
import { MonsterInstance, BattleAction, TwoTurnMoveType } from '../../types';
import { MonsterService } from '../monster.service';

@Injectable()
export class BattleAIService {
  constructor(private monsterService: MonsterService) {}

  generateEnemyAction(enemy: MonsterInstance): BattleAction {
    // Safety check: dead monsters can't take actions
    if (enemy.currentHp <= 0) {
      throw new Error('Dead monster cannot take actions');
    }

    // If the enemy is committed to a two-turn move, continue with it
    if (enemy.twoTurnMoveState?.phase === 'charging') {
      return { type: 'attack', moveId: enemy.twoTurnMoveState.moveId };
    }

    // If the enemy must recharge, it can't take any action (will be handled by battle service)
    if (enemy.twoTurnMoveState?.phase === 'recharging') {
      // This should not happen as the battle service handles recharge turns
      // But just in case, return a basic attack
      return { type: 'attack', moveId: enemy.moves[0] || 'scratch' };
    }
    
    // Simple AI: randomly choose from available moves
    if (enemy.moves.length === 0) {
      // Fallback if no moves available
      return { type: 'attack', moveId: 'scratch' };
    }

    // AI Strategy for two-turn moves:
    // - Use two-turn moves when at high HP (safer to commit to multi-turn attack)
    // - Avoid two-turn moves when at low HP (too risky)
    const enemyHpPercentage = enemy.currentHp / enemy.maxHp;
    const availableMoves = enemy.moves.filter(moveId => {
      const remainingPP = enemy.movePP?.[moveId] || 0;
      return remainingPP > 0;
    });

    if (availableMoves.length === 0) {
      // No moves with PP, return first move (will fail but handled by battle service)
      return { type: 'attack', moveId: enemy.moves[0] };
    }

    // Categorize moves
    const twoTurnMoves = availableMoves.filter(moveId => {
      const move = this.monsterService.getMoveData(moveId);
      return move && move.twoTurnMove;
    });

    const regularMoves = availableMoves.filter(moveId => {
      const move = this.monsterService.getMoveData(moveId);
      return move && !move.twoTurnMove;
    });

    // At high HP, sometimes use two-turn moves for powerful attacks
    if (enemyHpPercentage > 0.6 && twoTurnMoves.length > 0 && Math.random() < 0.3) {
      const randomIndex = Math.floor(Math.random() * twoTurnMoves.length);
      return { type: 'attack', moveId: twoTurnMoves[randomIndex] };
    }

    // When low on health, prefer stronger regular moves
    if (enemyHpPercentage < 0.3) {
      const strongMoves = regularMoves.filter(moveId => {
        const move = this.monsterService.getMoveData(moveId);
        return move && move.power >= 60;
      });
      
      if (strongMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * strongMoves.length);
        return { type: 'attack', moveId: strongMoves[randomIndex] };
      }
    }

    // Normal strategy: randomly choose from regular moves first, then all moves
    const preferredMoves = regularMoves.length > 0 ? regularMoves : availableMoves;
    const randomMoveIndex = Math.floor(Math.random() * preferredMoves.length);
    const selectedMove = preferredMoves[randomMoveIndex];

    return { type: 'attack', moveId: selectedMove };
  }
}
