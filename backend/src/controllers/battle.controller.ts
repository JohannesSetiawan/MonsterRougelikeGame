import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { BattleService } from '../services/battle.service';
import { GameService } from '../services/game.service';
import { MonsterService } from '../services/monster.service';
import { BattleAction, MonsterInstance } from '../types';

@Controller('battle')
export class BattleController {
  constructor(
    private battleService: BattleService,
    private gameService: GameService,
    private monsterService: MonsterService
  ) {}

  @Post(':runId/action')
  performBattleAction(
    @Param('runId') runId: string,
    @Body() body: {
      action: BattleAction;
      playerMonsterId: string;
      opponentMonster: MonsterInstance;
    }
  ) {
    const run = this.gameService.getGameRun(runId);
    if (!run || !run.isActive) {
      throw new HttpException('Game run not found or not active', HttpStatus.BAD_REQUEST);
    }

    const playerMonster = run.team.find(m => m.id === body.playerMonsterId);
    if (!playerMonster) {
      throw new HttpException('Player monster not found', HttpStatus.BAD_REQUEST);
    }

    if (playerMonster.currentHp <= 0) {
      throw new HttpException('Player monster has fainted', HttpStatus.BAD_REQUEST);
    }

    // Check if trying to catch but no monster balls available
    if (body.action.type === 'catch') {
      const monsterBall = run.inventory.find(item => item.id === 'monster_ball' && item.quantity > 0);
      if (!monsterBall) {
        throw new HttpException('No Monster Balls available', HttpStatus.BAD_REQUEST);
      }
    }

    // Check if trying to use an item but item not available
    if (body.action.type === 'item') {
      if (!body.action.itemId) {
        throw new HttpException('Item ID is required for item action', HttpStatus.BAD_REQUEST);
      }
      const item = run.inventory.find(item => item.id === body.action.itemId && item.quantity > 0);
      if (!item) {
        throw new HttpException(`Item ${body.action.itemId} not available`, HttpStatus.BAD_REQUEST);
      }
    }

    try {
      // Process player's action
      const playerResult = this.battleService.processBattleAction(
        playerMonster,
        body.opponentMonster,
        body.action
      );

      let allEffects = [...(playerResult.effects || [])];
      let battleEnded = false;
      let winner: 'player' | 'opponent' | undefined;

      // Handle post-battle effects for player action
      if (body.action.type === 'attack' && playerResult.success && playerResult.damage) {
        // Apply damage to opponent
        body.opponentMonster.currentHp = Math.max(0, body.opponentMonster.currentHp - playerResult.damage);
      }

      if (body.action.type === 'catch') {
        // Always reduce monster ball quantity when attempting to catch (regardless of success)
        const monsterBall = run.inventory.find(item => item.id === 'monster_ball');
        if (monsterBall && monsterBall.quantity > 0) {
          monsterBall.quantity--;
          if (monsterBall.quantity === 0) {
            run.inventory = run.inventory.filter(item => item.id !== 'monster_ball');
          }
        }

        if (playerResult.success && playerResult.monsterCaught) {
          // Add caught monster to team
          this.gameService.addMonsterToTeam(runId, body.opponentMonster);
          battleEnded = true;
          winner = 'player';
        }
      }

      if (body.action.type === 'flee') {
        battleEnded = true;
        allEffects.push(`${playerMonster.name} fled from battle!`);
      }

      // Handle item usage
      if (body.action.type === 'item' && body.action.itemId) {
        const item = run.inventory.find(item => item.id === body.action.itemId);
        if (item && item.quantity > 0) {
          // Reduce item quantity
          item.quantity--;
          if (item.quantity === 0) {
            run.inventory = run.inventory.filter(inv => inv.id !== body.action.itemId);
          }

          // Apply item effect
          switch (body.action.itemId) {
            case 'potion':
              const healAmount = Math.min(50, playerMonster.maxHp - playerMonster.currentHp);
              playerMonster.currentHp += healAmount;
              allEffects.push(`${playerMonster.name} recovered ${healAmount} HP!`);
              break;
            
            case 'monster_ball':
              // Handle monster ball as catch action
              const catchResult = this.battleService.processBattleAction(
                playerMonster,
                body.opponentMonster,
                { type: 'catch' }
              );
              
              allEffects.push(...(catchResult.effects || []));
              
              if (catchResult.success && catchResult.monsterCaught) {
                // Add caught monster to team
                this.gameService.addMonsterToTeam(runId, body.opponentMonster);
                battleEnded = true;
                winner = 'player';
              }
              break;
            
            default:
              allEffects.push(`Used ${item.name}!`);
              break;
          }
        }
      }

      // Check if opponent fainted from player's attack
      if (body.opponentMonster.currentHp <= 0) {
        battleEnded = true;
        winner = 'player';
        allEffects.push(`Wild ${body.opponentMonster.name} fainted!`);
      }

      // Process enemy turn if battle hasn't ended and action wasn't flee or catch or successful monster ball
      if (!battleEnded && body.action.type !== 'flee' && !playerResult.monsterCaught) {
        const enemyAction = this.battleService.generateEnemyAction(body.opponentMonster);
        const enemyResult = this.battleService.processBattleAction(
          body.opponentMonster,
          playerMonster,
          enemyAction
        );

        if (enemyResult.success && enemyResult.damage) {
          // Apply damage to player monster
          playerMonster.currentHp = Math.max(0, playerMonster.currentHp - enemyResult.damage);
          
          // Check if player monster fainted
          if (playerMonster.currentHp <= 0) {
            battleEnded = true;
            winner = 'opponent';
            allEffects.push(...(enemyResult.effects || []));
            allEffects.push(`${playerMonster.name} fainted!`);
          } else {
            allEffects.push(...(enemyResult.effects || []));
          }
        }
      }

      // Award experience and currency if player won
      if (battleEnded && winner === 'player' && !playerResult.monsterCaught) {
        const expGained = this.battleService.generateExperience(body.opponentMonster);
        playerMonster.experience += expGained;
        allEffects.push(`${playerMonster.name} gained ${expGained} experience!`);
        
        // Check for level up
        const expRequired = playerMonster.level * 100; // Simple exp requirement
        if (playerMonster.experience >= expRequired) {
          const leveledUp = this.monsterService.levelUpMonster(playerMonster);
          Object.assign(playerMonster, leveledUp);
          allEffects.push(`${playerMonster.name} leveled up to ${playerMonster.level}!`);
        }

        // Award currency
        const currencyReward = Math.floor(body.opponentMonster.level * 5 + Math.random() * 10);
        this.gameService.addCurrency(runId, currencyReward);
        allEffects.push(`Gained ${currencyReward} coins!`);
      }

      return {
        result: {
          success: playerResult.success,
          damage: playerResult.damage,
          effects: allEffects,
          monsterCaught: playerResult.monsterCaught,
          battleEnded,
          winner
        },
        updatedPlayerMonster: playerMonster,
        updatedOpponentMonster: body.opponentMonster,
        updatedRun: run,
        teamWipe: this.checkForTeamWipe(run)
      };

    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  private checkForTeamWipe(run: any): boolean {
    // Check if all monsters in team have 0 HP without ending the run yet
    return run.team.every(monster => monster.currentHp <= 0);
  }

  @Post(':runId/damage')
  calculateDamage(
    @Param('runId') runId: string,
    @Body() body: {
      attackerId: string;
      defenderId: string;
      moveId: string;
      opponent: MonsterInstance;
    }
  ) {
    const run = this.gameService.getGameRun(runId);
    if (!run || !run.isActive) {
      throw new HttpException('Game run not found or not active', HttpStatus.BAD_REQUEST);
    }

    const attacker = run.team.find(m => m.id === body.attackerId);
    if (!attacker) {
      throw new HttpException('Attacker monster not found', HttpStatus.BAD_REQUEST);
    }

    const defender = body.opponent;

    try {
      const damage = this.battleService.calculateDamage(attacker, defender, body.moveId);
      return { damage };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
