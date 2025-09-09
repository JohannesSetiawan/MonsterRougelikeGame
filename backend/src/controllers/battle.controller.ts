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

  @Post(':runId/initialize')
  initializeBattle(
    @Param('runId') runId: string,
    @Body() body: {
      playerMonsterId: string;
      opponentMonster: MonsterInstance;
    }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.BAD_REQUEST);
      }

      const playerMonster = run.team.find(m => m.id === body.playerMonsterId);
      if (!playerMonster) {
        throw new HttpException('Player monster not found', HttpStatus.BAD_REQUEST);
      }

      // Initialize battle context with ability effects like Intimidate
      const { battleContext, effects: battleStartEffects } = this.battleService.initializeBattleContext(playerMonster, body.opponentMonster);
      
      // Reset stat boost usage for new battle
      if (run?.temporaryEffects?.usedStatBoosts) {
        run.temporaryEffects.usedStatBoosts = {};
      }
      
      // Determine turn order with speed abilities applied
      const playerSpeed = this.battleService.applySpeedAbilities(playerMonster);
      const opponentSpeed = this.battleService.applySpeedAbilities(body.opponentMonster);
      const playerGoesFirst = playerSpeed >= opponentSpeed;

      return {
        effects: battleStartEffects,
        playerGoesFirst,
        updatedPlayerMonster: playerMonster,
        updatedOpponentMonster: body.opponentMonster,
        battleContext: {
          playerStatModifiers: battleContext.playerStatModifiers,
          opponentStatModifiers: battleContext.opponentStatModifiers
        }
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':runId/action')
  async performBattleAction(
    @Param('runId') runId: string,
    @Body() body: {
      action: BattleAction;
      playerMonsterId: string;
      opponentMonster: MonsterInstance;
      battleContext?: {
        playerStatModifiers?: any;
        opponentStatModifiers?: any;
      };
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

        // Check for stat boost restrictions (can't use multiple times)
        const statBoostItems = ['x_attack', 'x_defense', 'x_speed'];
        if (statBoostItems.includes(body.action.itemId)) {
          const boostType = body.action.itemId.replace('x_', '');
          if (run.temporaryEffects?.usedStatBoosts?.[boostType]) {
            throw new HttpException(`X ${boostType.charAt(0).toUpperCase() + boostType.slice(1)} has already been used in this battle`, HttpStatus.BAD_REQUEST);
          }
        }
      }    try {
      // Reconstruct battle context from frontend data
      let battleContext = null;
      if (body.battleContext) {
        battleContext = {
          playerMonster,
          opponentMonster: body.opponentMonster,
          playerStatModifiers: body.battleContext.playerStatModifiers || {},
          opponentStatModifiers: body.battleContext.opponentStatModifiers || {}
        };
        
        // Apply temporary stat boosts from items if they exist in the run
        if (run.temporaryEffects?.statBoosts) {
          const statBoosts = run.temporaryEffects.statBoosts;
          if (statBoosts.attack) {
            battleContext.playerStatModifiers.attack = (battleContext.playerStatModifiers.attack || 1) * statBoosts.attack;
          }
          if (statBoosts.defense) {
            battleContext.playerStatModifiers.defense = (battleContext.playerStatModifiers.defense || 1) * statBoosts.defense;
          }
          if (statBoosts.speed) {
            battleContext.playerStatModifiers.speed = (battleContext.playerStatModifiers.speed || 1) * statBoosts.speed;
          }
        }
      }

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
        if (playerResult.success) {
          battleEnded = true;
          allEffects = [...(playerResult.effects || [])];
        } else {
          // Flee failed, continue with enemy turn
          allEffects = [...(playerResult.effects || [])];
        }
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
            case 'super_potion':
            case 'hyper_potion':
            case 'max_potion':
              // Use the game service's useItem method for healing items
              const healResult = this.gameService.useItem(runId, body.action.itemId, body.playerMonsterId);
              allEffects.push(healResult.message);
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

            case 'great_ball':
              // Handle great ball as improved catch action
              const greatBallResult = this.battleService.processBattleAction(
                playerMonster,
                body.opponentMonster,
                { type: 'catch' },
                { catchRate: 'improved' }
              );
              
              allEffects.push(...(greatBallResult.effects || []));
              
              if (greatBallResult.success && greatBallResult.monsterCaught) {
                this.gameService.addMonsterToTeam(runId, body.opponentMonster);
                battleEnded = true;
                winner = 'player';
              }
              break;

            case 'ultra_ball':
              // Handle ultra ball as excellent catch action
              const ultraBallResult = this.battleService.processBattleAction(
                playerMonster,
                body.opponentMonster,
                { type: 'catch' },
                { catchRate: 'excellent' }
              );
              
              allEffects.push(...(ultraBallResult.effects || []));
              
              if (ultraBallResult.success && ultraBallResult.monsterCaught) {
                this.gameService.addMonsterToTeam(runId, body.opponentMonster);
                battleEnded = true;
                winner = 'player';
              }
              break;

            case 'escape_rope':
              // Handle escape rope as guaranteed flee
              const fleeResult = this.battleService.processBattleAction(
                playerMonster,
                body.opponentMonster,
                { type: 'flee' },
                { guaranteedFlee: true }
              );
              
              allEffects.push(...(fleeResult.effects || []));
              
              if (fleeResult.success) {
                battleEnded = true;
              }
              break;

            case 'x_attack':
            case 'x_defense':
            case 'x_speed':
              // Apply temporary stat boost for the current battle
              if (!run.temporaryEffects) run.temporaryEffects = {};
              if (!run.temporaryEffects.statBoosts) run.temporaryEffects.statBoosts = {};
              if (!run.temporaryEffects.usedStatBoosts) run.temporaryEffects.usedStatBoosts = {};

              const statType = body.action.itemId.replace('x_', '');
              run.temporaryEffects.statBoosts[statType] = 1.5; // 50% boost
              run.temporaryEffects.usedStatBoosts[statType] = true; // Mark as used

              // Update battle context with the new modifiers
              if (battleContext) {
                const currentModifier = battleContext.playerStatModifiers[statType] || 1;
                battleContext.playerStatModifiers[statType] = currentModifier * 1.5;
              }

              allEffects.push(`${playerMonster.name}'s ${statType} was boosted!`);
              break;

            case 'ether':
            case 'max_ether':
              // For ether items, we need move selection - use game service
              if (body.action.targetMoveId) {
                const itemResult = await this.gameService.useItem(
                  runId, 
                  body.action.itemId, 
                  body.playerMonsterId,
                  body.action.targetMoveId
                );
                if (itemResult.success) {
                  allEffects.push(itemResult.message);
                } else {
                  throw new HttpException(itemResult.message, HttpStatus.BAD_REQUEST);
                }
              } else {
                throw new HttpException('Please select a move to restore PP!', HttpStatus.BAD_REQUEST);
              }
              break;

            case 'elixir':
            case 'max_elixir':
              // For elixir items, restore all moves - use game service
              const itemResult = await this.gameService.useItem(
                runId, 
                body.action.itemId, 
                body.playerMonsterId
              );
              if (itemResult.success) {
                allEffects.push(itemResult.message);
              } else {
                throw new HttpException(itemResult.message, HttpStatus.BAD_REQUEST);
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

      // Process enemy turn if battle hasn't ended and action wasn't successful flee or catch or successful monster ball
      if (!battleEnded && 
          !(body.action.type === 'flee' && playerResult.success) && 
          !playerResult.monsterCaught) {
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
        
        // Use the new experience system that handles level ups properly
        const expResult = this.battleService.addExperienceToMonster(playerMonster, expGained);
        Object.assign(playerMonster, expResult.monster);
        
        allEffects.push(`${playerMonster.name} gained ${expGained} experience!`);
        
        if (expResult.leveledUp) {
          allEffects.push(`${playerMonster.name} leveled up to ${playerMonster.level}!`);
          if (expResult.levelsGained > 1) {
            allEffects.push(`Gained ${expResult.levelsGained} levels!`);
          }
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
          isCritical: playerResult.isCritical,
          effects: allEffects,
          monsterCaught: playerResult.monsterCaught,
          battleEnded,
          winner
        },
        updatedPlayerMonster: playerMonster,
        updatedOpponentMonster: body.opponentMonster,
        updatedRun: run,
        teamWipe: this.checkForTeamWipe(run),
        battleContext: battleContext ? {
          playerStatModifiers: battleContext.playerStatModifiers,
          opponentStatModifiers: battleContext.opponentStatModifiers
        } : undefined
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
      const { damage, isCritical } = this.battleService.calculateDamage(attacker, defender, body.moveId);
      return { damage, isCritical };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
