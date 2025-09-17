import { Controller, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { BattleService } from '../services/battle.service';
import { GameService } from '../services/game.service';
import { MonsterService } from '../services/monster.service';
import { BattleAction, MonsterInstance, StatStageCalculator } from '../types';

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
      playerGoesFirst?: boolean;
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
      }

      // Initialize battle tracking variables
      let allEffects: string[] = [];
      let battleEnded = false;
      let winner: 'player' | 'opponent' | undefined;
      let playerResult: any;
      let enemyResult: any;

      // Determine turn order based on speed (recalculate to be sure)
      const playerSpeed = this.battleService.applySpeedAbilities(playerMonster);
      const opponentSpeed = this.battleService.applySpeedAbilities(body.opponentMonster);
      
      // Items and catching always go first, regardless of speed (Pokemon rule)
      let playerGoesFirst: boolean;
      if (body.action.type === 'item') {
        playerGoesFirst = true;
        // Add a message indicating item usage has priority
        allEffects.push(`📦 Items are used with priority!`);
      } else if (body.action.type === 'catch') {
        playerGoesFirst = true;
        // Add a message indicating catching has priority
        allEffects.push(`⚾ Catching attempts are made with priority!`);
      } else {
        // Attacks and fleeing use normal speed-based priority
        playerGoesFirst = body.playerGoesFirst !== undefined ? body.playerGoesFirst : playerSpeed >= opponentSpeed;
      }

      // Execute actions based on turn order
      if (playerGoesFirst) {
        // Player goes first
        playerResult = this.battleService.processBattleAction(
          playerMonster,
          body.opponentMonster,
          body.action,
          undefined,
          battleContext
        );
        allEffects.push(...(playerResult.effects || []));
      } else {
        // Enemy goes first
        const enemyAction = this.battleService.generateEnemyAction(body.opponentMonster);
        enemyResult = this.battleService.processBattleAction(
          body.opponentMonster,
          playerMonster,
          enemyAction,
          undefined,
          battleContext
        );
        allEffects.push(...(enemyResult.effects || []));
        
        // Check if player monster fainted from enemy's first strike
        if (enemyResult.success && enemyResult.damage) {
          playerMonster.currentHp = Math.max(0, playerMonster.currentHp - enemyResult.damage);
          if (playerMonster.currentHp <= 0) {
            // Check for auto-switch if other monsters are available
            const nextMonster = this.getNextHealthyMonster(run, playerMonster.id);
            if (nextMonster) {
              // Perform auto-switch
              const autoSwitchResult = this.performAutoSwitch(run, playerMonster.id, body.opponentMonster, battleContext);
              allEffects.push(...autoSwitchResult.effects);
              
              // Return early with switch result
              return {
                result: {
                  success: true,
                  effects: allEffects,
                  battleEnded: false,
                  requiresAutoSwitch: true
                },
                updatedPlayerMonster: autoSwitchResult.switchedMonster,
                updatedOpponentMonster: body.opponentMonster,
                updatedRun: run,
                teamWipe: false,
                playerGoesFirst: false, // Enemy attacked first
                battleContext: battleContext ? {
                  playerStatModifiers: {},
                  opponentStatModifiers: battleContext.opponentStatModifiers
                } : undefined
              };
            } else {
              // No monsters left - team wipe
              battleEnded = true;
              winner = 'opponent';
              allEffects.push(`${playerMonster.name} fainted!`);
            }
          }
        }
      }

      // Handle post-battle effects for player action (if player went first or will go second)
      if (!battleEnded && playerGoesFirst) {
        // Player went first, now process player's action effects
        if (body.action.type === 'attack' && playerResult.success && playerResult.damage) {
          // Apply damage to opponent
          body.opponentMonster.currentHp = Math.max(0, body.opponentMonster.currentHp - playerResult.damage);
          
          // Check if opponent fainted - battle ends immediately
          if (body.opponentMonster.currentHp <= 0) {
            battleEnded = true;
            winner = 'player';
            allEffects.push(`Wild ${body.opponentMonster.name} fainted!`);
          }
        }
        
        // Handle other action types that might end the battle
        if (playerResult.battleEnded) {
          battleEnded = true;
          winner = playerResult.winner === 'player' ? 'player' : 'opponent';
        }
        
      } else if (!battleEnded && !playerGoesFirst) {
        // Enemy went first, now process player's action (only if player didn't faint)
        playerResult = this.battleService.processBattleAction(
          playerMonster,
          body.opponentMonster,
          body.action,
          undefined,
          battleContext
        );
        allEffects.push(...(playerResult.effects || []));
        
        if (body.action.type === 'attack' && playerResult.success && playerResult.damage) {
          // Apply damage to opponent
          body.opponentMonster.currentHp = Math.max(0, body.opponentMonster.currentHp - playerResult.damage);
          
          // Check if opponent fainted - battle ends immediately
          if (body.opponentMonster.currentHp <= 0) {
            battleEnded = true;
            winner = 'player';
            allEffects.push(`Wild ${body.opponentMonster.name} fainted!`);
          }
        }
        
        // Handle other action types that might end the battle
        if (playerResult.battleEnded) {
          battleEnded = true;
          winner = playerResult.winner === 'player' ? 'player' : 'opponent';
        }
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

      // Handle monster switching
      if (body.action.type === 'switch' && body.action.newMonsterId) {
        const newMonster = run.team.find(m => m.id === body.action.newMonsterId);
        if (!newMonster) {
          throw new HttpException('Monster not found in team', HttpStatus.BAD_REQUEST);
        }
        if (newMonster.currentHp <= 0) {
          throw new HttpException('Cannot switch to a fainted monster', HttpStatus.BAD_REQUEST);
        }
        if (newMonster.id === body.playerMonsterId) {
          throw new HttpException('Monster is already in battle', HttpStatus.BAD_REQUEST);
        }
        
        // Switch is successful - update the active monster
        const switchEffects = [`${playerMonster.name}, come back!`, `Go, ${newMonster.name}!`];
        
        // Process enemy's attack on the new monster (switching gives opponent a free turn)
        if (!battleEnded && body.opponentMonster.currentHp > 0) {
          const enemyAction = this.battleService.generateEnemyAction(body.opponentMonster);
          enemyResult = this.battleService.processBattleAction(
            body.opponentMonster,
            newMonster,
            enemyAction,
            undefined,
            battleContext
          );

          if (enemyResult.success && enemyResult.damage) {
            // Apply damage to the newly switched monster
            newMonster.currentHp = Math.max(0, newMonster.currentHp - enemyResult.damage);
            
            // Check if the new monster fainted immediately
            if (newMonster.currentHp <= 0) {
              // Check for auto-switch if other monsters are available
              const nextHealthyMonster = this.getNextHealthyMonster(run, newMonster.id);
              if (nextHealthyMonster) {
                // Perform auto-switch
                const autoSwitchResult = this.performAutoSwitch(run, newMonster.id, body.opponentMonster, battleContext);
                switchEffects.push(...(enemyResult.effects || []));
                switchEffects.push(...autoSwitchResult.effects);
                
                // Return with auto-switched monster
                return {
                  result: {
                    success: true,
                    effects: switchEffects,
                    battleEnded: false,
                    requiresAutoSwitch: true,
                    monsterSwitched: true
                  },
                  updatedPlayerMonster: autoSwitchResult.switchedMonster,
                  updatedOpponentMonster: body.opponentMonster,
                  updatedRun: run,
                  teamWipe: false,
                  playerGoesFirst: false,
                  battleContext: battleContext ? {
                    playerStatModifiers: {},
                    opponentStatModifiers: battleContext.opponentStatModifiers
                  } : undefined
                };
              } else {
                // No monsters left - team wipe
                battleEnded = true;
                winner = 'opponent';
                switchEffects.push(...(enemyResult.effects || []));
                switchEffects.push(`${newMonster.name} fainted!`);
              }
            } else {
              switchEffects.push(...(enemyResult.effects || []));
            }
          } else {
            // Even if attack missed or failed, add the effects
            switchEffects.push(...(enemyResult.effects || []));
          }
        }

        return {
          result: {
            success: true,
            effects: switchEffects,
            battleEnded,
            winner,
            monsterSwitched: true
          },
          updatedPlayerMonster: newMonster, // Return the new active monster
          updatedOpponentMonster: body.opponentMonster,
          updatedRun: run,
          teamWipe: this.checkForTeamWipe(run),
          playerGoesFirst: false, // Switching always gives opponent priority next turn
          battleContext: battleContext ? {
            playerStatModifiers: {}, // Reset stat modifiers for new monster
            opponentStatModifiers: battleContext.opponentStatModifiers
          } : undefined
        };
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
              // Use targetId if provided, otherwise default to active monster
              const targetMonsterId = body.action.targetId || body.playerMonsterId;
              const healResult = this.gameService.useItem(runId, body.action.itemId, targetMonsterId);
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
              // Apply temporary stat boost for the current battle (+1 stage)
              if (!run.temporaryEffects) run.temporaryEffects = {};
              if (!run.temporaryEffects.statBoosts) run.temporaryEffects.statBoosts = {};
              if (!run.temporaryEffects.usedStatBoosts) run.temporaryEffects.usedStatBoosts = {};

              const statType = body.action.itemId.replace('x_', '');
              run.temporaryEffects.statBoosts[statType] = 1; // +1 stage boost
              run.temporaryEffects.usedStatBoosts[statType] = true; // Mark as used

              // Update battle context with the new stage-based modifiers
              if (battleContext) {
                const currentStage = battleContext.playerStatModifiers[statType] || 0;
                battleContext.playerStatModifiers[statType] = Math.max(-6, Math.min(6, currentStage + 1));
              }

              allEffects.push(`${playerMonster.name}'s ${statType} was boosted!`);
              break;

            case 'ether':
            case 'max_ether':
              // For ether items, we need move selection - use game service
              if (body.action.targetMoveId) {
                // Use targetId if provided, otherwise default to active monster
                const etherTargetMonsterId = body.action.targetId || body.playerMonsterId;
                const itemResult = await this.gameService.useItem(
                  runId, 
                  body.action.itemId, 
                  etherTargetMonsterId,
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
              // Use targetId if provided, otherwise default to active monster
              const elixirTargetMonsterId = body.action.targetId || body.playerMonsterId;
              const itemResult = await this.gameService.useItem(
                runId, 
                body.action.itemId, 
                elixirTargetMonsterId
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

      // Process enemy's second turn ONLY if battle hasn't ended and opponent is still alive
      if (!battleEnded && 
          playerGoesFirst && 
          body.opponentMonster.currentHp > 0 &&
          !(body.action.type === 'flee' && playerResult.success) && 
          !playerResult.monsterCaught) {
        
        const enemyAction = this.battleService.generateEnemyAction(body.opponentMonster);
        enemyResult = this.battleService.processBattleAction(
          body.opponentMonster,
          playerMonster,
          enemyAction,
          undefined,
          battleContext
        );

        if (enemyResult.success && enemyResult.damage) {
          // Apply damage to player monster
          playerMonster.currentHp = Math.max(0, playerMonster.currentHp - enemyResult.damage);
          
          // Check if player monster fainted
          if (playerMonster.currentHp <= 0) {
            // Check for auto-switch if other monsters are available
            const nextMonster = this.getNextHealthyMonster(run, playerMonster.id);
            if (nextMonster) {
              // Perform auto-switch
              const autoSwitchResult = this.performAutoSwitch(run, playerMonster.id, body.opponentMonster, battleContext);
              allEffects.push(...(enemyResult.effects || []));
              allEffects.push(...autoSwitchResult.effects);
              
              // Return early with switch result
              return {
                result: {
                  success: playerResult?.success || false,
                  damage: playerResult?.damage,
                  isCritical: playerResult?.isCritical || false,
                  effects: allEffects,
                  battleEnded: false,
                  requiresAutoSwitch: true
                },
                updatedPlayerMonster: autoSwitchResult.switchedMonster,
                updatedOpponentMonster: body.opponentMonster,
                updatedRun: run,
                teamWipe: false,
                playerGoesFirst,
                battleContext: battleContext ? {
                  playerStatModifiers: {},
                  opponentStatModifiers: battleContext.opponentStatModifiers
                } : undefined
              };
            } else {
              // No monsters left - team wipe
              battleEnded = true;
              winner = 'opponent';
              allEffects.push(...(enemyResult.effects || []));
              allEffects.push(`${playerMonster.name} fainted!`);
            }
          } else {
            allEffects.push(...(enemyResult.effects || []));
          }
        } else {
          // Even if attack missed or failed, add the effects
          allEffects.push(...(enemyResult.effects || []));
        }
      }

      // Process end-of-turn status effects if battle is still ongoing
      if (!battleEnded && playerMonster.currentHp > 0 && body.opponentMonster.currentHp > 0) {
        const endOfTurnResult = this.battleService.processEndOfTurn(playerMonster, body.opponentMonster);
        
        // Add status effect messages to battle log
        if (endOfTurnResult.playerEffects.length > 0) {
          allEffects.push(...endOfTurnResult.playerEffects);
        }
        if (endOfTurnResult.opponentEffects.length > 0) {
          allEffects.push(...endOfTurnResult.opponentEffects);
        }
        
        // Check if either monster fainted due to status effects
        if (playerMonster.currentHp <= 0) {
          // Check for auto-switch if other monsters are available
          const nextMonster = this.getNextHealthyMonster(run, playerMonster.id);
          if (nextMonster) {
            // Perform auto-switch
            const autoSwitchResult = this.performAutoSwitch(run, playerMonster.id, body.opponentMonster, battleContext);
            allEffects.push(`${playerMonster.name} fainted from status effects!`);
            allEffects.push(...autoSwitchResult.effects);
            
            // Return early with switch result
            return {
              result: {
                success: playerResult?.success || false,
                damage: playerResult?.damage,
                isCritical: playerResult?.isCritical || false,
                effects: allEffects,
                battleEnded: false,
                requiresAutoSwitch: true
              },
              updatedPlayerMonster: autoSwitchResult.switchedMonster,
              updatedOpponentMonster: body.opponentMonster,
              updatedRun: run,
              teamWipe: false,
              playerGoesFirst,
              battleContext: battleContext ? {
                playerStatModifiers: {},
                opponentStatModifiers: battleContext.opponentStatModifiers
              } : undefined
            };
          } else {
            // No monsters left - team wipe
            battleEnded = true;
            winner = 'opponent';
            allEffects.push(`${playerMonster.name} fainted from status effects!`);
          }
        } else if (body.opponentMonster.currentHp <= 0) {
          battleEnded = true;
          winner = 'player';
          allEffects.push(`Wild ${body.opponentMonster.name} fainted from status effects!`);
        }
      }

      // Award experience and currency if player won
      let moveLearnEvents = [];
      if (battleEnded && winner === 'player' && !playerResult.monsterCaught) {
        const expGained = this.battleService.generateExperience(body.opponentMonster);
        
        // Use the new experience system that handles level ups properly
        const expResult = this.battleService.addExperienceToMonster(playerMonster, expGained);
        Object.assign(playerMonster, expResult.monster);
        moveLearnEvents = expResult.moveLearnEvents || [];
        
        allEffects.push(`${playerMonster.name} gained ${expGained} experience!`);
        
        if (expResult.leveledUp) {
          allEffects.push(`${playerMonster.name} leveled up to ${playerMonster.level}!`);
          if (expResult.levelsGained > 1) {
            allEffects.push(`Gained ${expResult.levelsGained} levels!`);
          }
          
          // Add notifications for auto-learned moves (learned automatically when < 4 moves)
          if (expResult.autoLearnedMoves && expResult.autoLearnedMoves.length > 0) {
            for (const moveId of expResult.autoLearnedMoves) {
              const moveData = this.monsterService.getMoveData(moveId);
              const moveName = moveData?.name || moveId;
              allEffects.push(`${playerMonster.name} learned ${moveName}!`);
            }
          }
          
          // Add move learning choice notifications to effects (when 4 moves already known)
          if (moveLearnEvents.length > 0) {
            for (const event of moveLearnEvents) {
              const moveData = this.monsterService.getMoveData(event.newMove);
              const moveName = moveData?.name || event.newMove;
              allEffects.push(`${playerMonster.name} wants to learn ${moveName}, but already knows 4 moves.`);
            }
          }
        }

        // Award currency
        const currencyReward = Math.floor(body.opponentMonster.level * 5 + Math.random() * 10);
        this.gameService.addCurrency(runId, currencyReward);
        allEffects.push(`Gained ${currencyReward} coins!`);
      }

      return {
        result: {
          success: playerResult?.success || false,
          damage: playerResult?.damage,
          isCritical: playerResult?.isCritical || false,
          effects: allEffects,
          monsterCaught: playerResult?.monsterCaught || false,
          battleEnded,
          winner,
          moveLearnEvents
        },
        updatedPlayerMonster: playerMonster,
        updatedOpponentMonster: body.opponentMonster,
        updatedRun: run,
        teamWipe: this.checkForTeamWipe(run),
        playerGoesFirst,
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

  private getNextHealthyMonster(run: any, currentMonsterId: string): MonsterInstance | null {
    // Find the first healthy monster that's not the current one
    return run.team.find(monster => 
      monster.id !== currentMonsterId && monster.currentHp > 0
    ) || null;
  }

  private performAutoSwitch(
    run: any, 
    faintedMonsterId: string, 
    opponentMonster: MonsterInstance,
    battleContext: any
  ): {
    switchedMonster: MonsterInstance;
    effects: string[];
    battleEnded?: boolean;
    winner?: 'player' | 'opponent';
  } {
    const nextMonster = this.getNextHealthyMonster(run, faintedMonsterId);
    
    if (!nextMonster) {
      // No healthy monsters left - team wipe
      return {
        switchedMonster: null as any,
        effects: ['💀 All your monsters have fainted! Your adventure ends here.'],
        battleEnded: true,
        winner: 'opponent'
      };
    }

    const faintedMonster = run.team.find(m => m.id === faintedMonsterId);
    const switchEffects = [
      `${faintedMonster?.name} fainted!`,
      `💫 ${nextMonster.name} is automatically sent out!`
    ];

    // Reset stat modifiers for the new monster
    if (battleContext) {
      battleContext.playerStatModifiers = {};
    }

    return {
      switchedMonster: nextMonster,
      effects: switchEffects,
      battleEnded: false
    };
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
