import { Controller, Post, Get, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { MonsterService } from '../services/monster.service';
import { DataLoaderService } from '../services/data-loader.service';
import { Item } from '../types';

@Controller('game')
export class GameController {
  constructor(
    private gameService: GameService,
    private monsterService: MonsterService,
    private dataLoaderService: DataLoaderService
  ) {}

  @Post('player')
  createPlayer(@Body() body: { username: string }) {
    if (!body.username) {
      throw new HttpException('Username is required', HttpStatus.BAD_REQUEST);
    }
    return this.gameService.createPlayer(body.username);
  }

  @Get('player/:playerId')
  getPlayer(@Param('playerId') playerId: string) {
    const player = this.gameService.getPlayer(playerId);
    if (!player) {
      throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
    }
    return player;
  }

  @Post('run/start')
  startRun(@Body() body: { playerId: string; starterId: string }) {
    if (!body.playerId || !body.starterId) {
      throw new HttpException('playerId and starterId are required', HttpStatus.BAD_REQUEST);
    }

    const starterMonsters = this.dataLoaderService.getStarterMonsters();
    if (!starterMonsters.includes(body.starterId)) {
      throw new HttpException('Invalid starter monster', HttpStatus.BAD_REQUEST);
    }

    try {
      return this.gameService.startNewRun(body.playerId, body.starterId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('run/:runId')
  getGameRun(@Param('runId') runId: string) {
    const run = this.gameService.getGameRun(runId);
    if (!run) {
      throw new HttpException('Game run not found', HttpStatus.NOT_FOUND);
    }
    return run;
  }

  @Get('run/active/:playerId')
  getActiveRun(@Param('playerId') playerId: string) {
    const run = this.gameService.getActiveRun(playerId);
    if (!run) {
      throw new HttpException('No active run found', HttpStatus.NOT_FOUND);
    }
    return run;
  }

  @Post('run/:runId/progress')
  progressStage(@Param('runId') runId: string) {
    try {
      const run = this.gameService.progressStage(runId);
      
      // If run ended due to victory, return that information
      if (!run.isActive && run.endedAt) {
        return { 
          run, 
          encounter: null,
          gameEnded: true,
          reason: 'victory',
          message: 'Congratulations! You have completed the entire adventure!' 
        };
      }
      
      const encounter = this.gameService.generateRandomEncounter(run.currentStage, runId);
      return { run, encounter, gameEnded: false };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/item/use')
  useItem(@Param('runId') runId: string, @Body() body: { itemId: string; targetMonsterId?: string; moveId?: string }) {
    try {
      return this.gameService.useItem(runId, body.itemId, body.targetMonsterId, body.moveId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/item/add')
  addItemToInventory(@Param('runId') runId: string, @Body() body: { item: Item }) {
    try {
      return this.gameService.addItem(runId, body.item);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/end')
  endRun(@Param('runId') runId: string, @Body() body: { reason: 'victory' | 'defeat' }) {
    try {
      return this.gameService.endRun(runId, body.reason);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('starters')
  getStarters() {
    const starterMonsters = this.dataLoaderService.getStarterMonsters();
    const monsters = this.dataLoaderService.getMonsters();
    return starterMonsters.map(id => ({
      id,
      ...monsters[id]
    }));
  }

  @Get('encounter/:stageLevel')
  getRandomEncounter(@Param('stageLevel') stageLevel: string) {
    const level = parseInt(stageLevel);
    if (isNaN(level) || level < 1) {
      throw new HttpException('Invalid stage level', HttpStatus.BAD_REQUEST);
    }
    return this.gameService.generateRandomEncounter(level);
  }

  @Get('moves')
  getAllMoves() {
    return this.monsterService.getAllMoves();
  }

  @Get('move/:moveId')
  getMoveData(@Param('moveId') moveId: string) {
    const move = this.monsterService.getMoveData(moveId);
    if (!move) {
      throw new HttpException('Move not found', HttpStatus.NOT_FOUND);
    }
    return move;
  }

  @Get('abilities')
  getAllAbilities() {
    return this.dataLoaderService.getAbilities();
  }

  @Get('ability/:abilityId')
  getAbilityData(@Param('abilityId') abilityId: string) {
    const ability = this.monsterService.getAbilityData(abilityId);
    if (!ability) {
      throw new HttpException('Ability not found', HttpStatus.NOT_FOUND);
    }
    return ability;
  }

  @Get('monsters')
  getAllMonsters() {
    return this.monsterService.getAllMonsters();
  }

  @Get('monster/:monsterId')
  getMonsterData(@Param('monsterId') monsterId: string) {
    const monster = this.monsterService.getMonsterData(monsterId);
    if (!monster) {
      throw new HttpException('Monster not found', HttpStatus.NOT_FOUND);
    }
    return monster;
  }

  @Get('items')
  getAllItems() {
    return this.dataLoaderService.getItems();
  }

  @Get('item/:itemId')
  getItemData(@Param('itemId') itemId: string) {
    const item = this.dataLoaderService.getItem(itemId);
    if (!item) {
      throw new HttpException('Item not found', HttpStatus.NOT_FOUND);
    }
    return item;
  }

  @Post('run/:runId/monster/:monsterId/restore-pp')
  restoreMonsterPP(
    @Param('runId') runId: string,
    @Param('monsterId') monsterId: string,
    @Body() body: { moveId?: string; amount?: number; restoreAll?: boolean }
  ) {
    try {
      return this.gameService.restoreMonsterPP(runId, monsterId, body);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/team/restore-pp')
  restoreTeamPP(@Param('runId') runId: string) {
    try {
      return this.gameService.restoreTeamPP(runId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('run/:runId/rest-site')
  useRestSite(@Param('runId') runId: string) {
    try {
      return this.gameService.useRestSite(runId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('monster/:monsterId/exp-for-level/:level')
  getExperienceForLevel(
    @Param('monsterId') monsterId: string,
    @Param('level') level: string
  ) {
    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1) {
      throw new HttpException('Invalid level', HttpStatus.BAD_REQUEST);
    }

    try {
      // Create a temporary monster instance to calculate experience
      const tempMonster = this.monsterService.createMonsterInstance(monsterId, levelNum);
      const expForNextLevel = this.monsterService.calculateExperienceForNextLevel(tempMonster);
      return { experienceForNextLevel: expForNextLevel };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
