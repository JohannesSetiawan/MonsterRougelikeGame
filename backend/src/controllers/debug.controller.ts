import { Controller, Post, Get, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { MonsterService } from '../services/monster.service';
import { DataLoaderService } from '../services/data-loader.service';
import { Item, MonsterInstance } from '../types';

@Controller('debug')
export class DebugController {
  constructor(
    private gameService: GameService,
    private monsterService: MonsterService,
    private dataLoaderService: DataLoaderService
  ) {}

  @Post('run/:runId/add-monster')
  addMonsterToTeam(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string; level?: number; isShiny?: boolean }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      if (run.team.length >= 6) {
        throw new HttpException('Team is already full (6 monsters max)', HttpStatus.BAD_REQUEST);
      }

      const level = body.level || 5;
      // Use high shiny boost to force shiny if requested
      const shinyBoost = body.isShiny ? 1000 : 1; // Guarantees shiny if requested
      const monster = this.monsterService.createMonsterInstance(body.monsterId, level, shinyBoost);
      
      // Force the shiny status if explicitly requested
      if (body.isShiny !== undefined) {
        monster.isShiny = body.isShiny;
      }
      
      const updatedRun = this.gameService.addMonsterToTeam(runId, monster);
      return { success: true, run: updatedRun, addedMonster: monster };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/add-currency')
  addCurrency(
    @Param('runId') runId: string,
    @Body() body: { amount: number }
  ) {
    try {
      if (!body.amount || body.amount <= 0) {
        throw new HttpException('Amount must be a positive number', HttpStatus.BAD_REQUEST);
      }

      const updatedRun = this.gameService.addCurrency(runId, body.amount);
      return { success: true, run: updatedRun, addedAmount: body.amount };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/add-item')
  addItem(
    @Param('runId') runId: string,
    @Body() body: { itemId: string; quantity?: number }
  ) {
    try {
      const itemData = this.dataLoaderService.getItem(body.itemId);
      if (!itemData) {
        throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
      }

      const quantity = body.quantity || 1;
      const item: Item = { ...itemData, quantity };
      
      const updatedRun = this.gameService.addItem(runId, item);
      return { success: true, run: updatedRun, addedItem: item };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/heal-team')
  healTeam(@Param('runId') runId: string) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      // Fully heal all team members
      run.team.forEach(monster => {
        monster.currentHp = monster.maxHp;
        this.monsterService.restoreAllPP(monster);
      });

      return { success: true, run, message: 'Team fully healed and PP restored!' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/level-up-monster')
  levelUpMonster(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string; levels?: number }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      const monster = run.team.find(m => m.id === body.monsterId);
      if (!monster) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      const levelsToGain = body.levels || 1;
      let leveledUpMonster = monster;

      for (let i = 0; i < levelsToGain; i++) {
        leveledUpMonster = this.monsterService.levelUpMonster(leveledUpMonster);
      }

      // Update the monster in the team
      const monsterIndex = run.team.findIndex(m => m.id === body.monsterId);
      run.team[monsterIndex] = leveledUpMonster;

      return { 
        success: true, 
        run, 
        monster: leveledUpMonster,
        message: `${monster.name} gained ${levelsToGain} level(s)! Now level ${leveledUpMonster.level}` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/set-stage')
  setStage(
    @Param('runId') runId: string,
    @Body() body: { stage: number }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      if (!body.stage || body.stage < 1) {
        throw new HttpException('Stage must be a positive number', HttpStatus.BAD_REQUEST);
      }

      run.currentStage = body.stage;

      // Update player's best stage if applicable
      const player = this.gameService.getPlayer(run.playerId);
      if (player && body.stage > player.bestStage) {
        player.bestStage = body.stage;
      }

      return { 
        success: true, 
        run, 
        message: `Stage set to ${body.stage}` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/remove-monster')
  removeMonster(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      if (run.team.length <= 1) {
        throw new HttpException('Cannot remove the last monster from team', HttpStatus.BAD_REQUEST);
      }

      const monsterIndex = run.team.findIndex(m => m.id === body.monsterId);
      if (monsterIndex === -1) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      const removedMonster = run.team[monsterIndex];
      run.team.splice(monsterIndex, 1);

      return { 
        success: true, 
        run, 
        removedMonster,
        message: `${removedMonster.name} removed from team` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/clear-inventory')
  clearInventory(@Param('runId') runId: string) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      run.inventory = [];

      return { 
        success: true, 
        run, 
        message: 'Inventory cleared' 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('monsters/available')
  getAvailableMonsters() {
    const monsters = this.dataLoaderService.getMonsters();
    return Object.keys(monsters).map(id => ({
      id,
      ...monsters[id]
    }));
  }

  @Get('items/available')
  getAvailableItems() {
    const items = this.dataLoaderService.getItems();
    return Object.keys(items).map(id => ({
      id,
      ...items[id]
    }));
  }

  @Post('run/:runId/make-monster-shiny')
  makeMonsterShiny(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      const monster = run.team.find(m => m.id === body.monsterId);
      if (!monster) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      monster.isShiny = !monster.isShiny; // Toggle shiny status

      return { 
        success: true, 
        run, 
        monster,
        message: `${monster.name} is now ${monster.isShiny ? 'shiny' : 'normal'}!` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/learn-move')
  learnMove(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string; moveId: string; moveToReplace?: string }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      const monster = run.team.find(m => m.id === body.monsterId);
      if (!monster) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      // Check if move exists
      const moveData = this.dataLoaderService.getMove(body.moveId);
      if (!moveData) {
        throw new HttpException('Move not found', HttpStatus.NOT_FOUND);
      }

      // Check if monster already knows this move
      if (monster.moves.includes(body.moveId)) {
        throw new HttpException('Monster already knows this move', HttpStatus.BAD_REQUEST);
      }

      // Learn the move using monster service
      const updatedMonster = this.monsterService.learnMove(monster, body.moveId, body.moveToReplace);
      
      // Update the monster in the team
      const monsterIndex = run.team.findIndex(m => m.id === body.monsterId);
      run.team[monsterIndex] = updatedMonster;

      return { 
        success: true, 
        run, 
        monster: updatedMonster,
        message: `${monster.name} learned ${moveData.name}!` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/forget-move')
  forgetMove(
    @Param('runId') runId: string,
    @Body() body: { monsterId: string; moveId: string }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      const monster = run.team.find(m => m.id === body.monsterId);
      if (!monster) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      // Check if monster knows this move
      if (!monster.moves.includes(body.moveId)) {
        throw new HttpException('Monster does not know this move', HttpStatus.BAD_REQUEST);
      }

      // Get move data for message
      const moveData = this.dataLoaderService.getMove(body.moveId);
      const moveName = moveData ? moveData.name : body.moveId;

      // Remove the move
      monster.moves = monster.moves.filter(move => move !== body.moveId);
      
      // Remove PP tracking for the forgotten move
      if (monster.movePP && monster.movePP[body.moveId] !== undefined) {
        delete monster.movePP[body.moveId];
      }

      return { 
        success: true, 
        run, 
        monster,
        message: `${monster.name} forgot ${moveName}!` 
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('moves/available')
  getAvailableMoves() {
    const moves = this.dataLoaderService.getMoves();
    return Object.keys(moves).map(id => ({
      id,
      ...moves[id]
    }));
  }

  @Get('run/:runId/monster/:monsterId/learnable-moves')
  getLearnableMoves(
    @Param('runId') runId: string,
    @Param('monsterId') monsterId: string
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.NOT_FOUND);
      }

      const monster = run.team.find(m => m.id === monsterId);
      if (!monster) {
        throw new HttpException('Monster not found in team', HttpStatus.NOT_FOUND);
      }

      const monsterData = this.dataLoaderService.getMonster(monster.monsterId);
      if (!monsterData) {
        throw new HttpException('Monster data not found', HttpStatus.NOT_FOUND);
      }

      // Get all learnable moves for this monster
      const learnableMoves = monsterData.learnableMoves.map(([moveId, level]) => {
        const moveData = this.dataLoaderService.getMove(moveId);
        return {
          id: moveId,
          name: moveData?.name || moveId,
          type: moveData?.type,
          category: moveData?.category,
          power: moveData?.power,
          accuracy: moveData?.accuracy,
          pp: moveData?.pp,
          description: moveData?.description,
          levelLearned: level,
          alreadyKnows: monster.moves.includes(moveId)
        };
      });

      // Sort by level learned
      learnableMoves.sort((a, b) => a.levelLearned - b.levelLearned);

      return {
        success: true,
        learnableMoves,
        currentMoves: monster.moves.map(moveId => {
          const moveData = this.dataLoaderService.getMove(moveId);
          return {
            id: moveId,
            name: moveData?.name || moveId,
            type: moveData?.type,
            category: moveData?.category,
            power: moveData?.power,
            accuracy: moveData?.accuracy,
            pp: moveData?.pp,
            description: moveData?.description
          };
        })
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
