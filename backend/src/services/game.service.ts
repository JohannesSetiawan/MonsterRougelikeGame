import { Injectable } from '@nestjs/common';
import { GameRun, Player, MonsterInstance, Item, MoveSelectionRequest } from '../types';
import { MonsterService } from './monster.service';
import { 
  PlayerManagementService, 
  GameRunService, 
  InventoryService, 
  EncounterService 
} from './game';
import { EncounterResult } from './game/encounter.service';

@Injectable()
export class GameService {
  constructor(
    private playerManagementService: PlayerManagementService,
    private gameRunService: GameRunService,
    private inventoryService: InventoryService,
    private encounterService: EncounterService,
    private monsterService: MonsterService
  ) {}

  async createPlayer(username: string): Promise<Player> {
    return this.playerManagementService.createPlayer(username);
  }

  async loadPlayer(playerId: string): Promise<Player | null> {
    const player = await this.playerManagementService.loadPlayer(playerId);
    if (player) {
      // Also load the latest game run if exists
      await this.gameRunService.loadLatestGameRunForPlayer(playerId);
    }
    return player;
  }

  async loadPlayerByUsername(username: string): Promise<Player | null> {
    const player = await this.playerManagementService.loadPlayerByUsername(username);
    if (player) {
      // Also load the latest game run if exists
      await this.gameRunService.loadLatestGameRunForPlayer(player.id);
    }
    return player;
  }

  async savePlayerProgress(playerId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Save player data
      const playerResult = await this.playerManagementService.savePlayerProgress(playerId);
      if (!playerResult.success) {
        return playerResult;
      }

      // Save active game run if exists
      const activeRun = this.getActiveRun(playerId);
      if (activeRun) {
        const runResult = await this.gameRunService.saveGameRunProgress(activeRun.id);
        if (!runResult.success) {
          return runResult;
        }
      }

      return { success: true, message: 'Progress saved successfully!' };
    } catch (error) {
      return { success: false, message: 'Failed to save progress: ' + error.message };
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.playerManagementService.getPlayer(playerId);
  }

  async startNewRun(playerId: string, starterId: string): Promise<GameRun> {
    const player = this.playerManagementService.getPlayer(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    // Create new run with starting inventory
    const gameRun = await this.gameRunService.startNewRun(
      playerId, 
      starterId, 
      player.unlockedStarters, 
      player.permanentCurrency
    );
    
    // Set up starting inventory
    gameRun.inventory = this.inventoryService.getStartingInventory();
    
    // Update player stats
    this.playerManagementService.updatePlayerStats(playerId, { totalRuns: player.totalRuns + 1 });

    return gameRun;
  }

  getActiveRun(playerId: string): GameRun | undefined {
    return this.gameRunService.getActiveRun(playerId);
  }

  getGameRun(runId: string): GameRun | undefined {
    return this.gameRunService.getGameRun(runId);
  }

  progressStage(runId: string): GameRun {
    const run = this.gameRunService.progressStage(runId);
    
    // Update player's best stage
    const player = this.playerManagementService.getPlayer(run.playerId);
    if (player && run.currentStage > player.bestStage) {
      this.playerManagementService.updatePlayerStats(run.playerId, { bestStage: run.currentStage });
    }

    return run;
  }

  addMonsterToTeam(runId: string, monster: MonsterInstance): GameRun {
    return this.gameRunService.addMonsterToTeam(runId, monster);
  }

  handleMoveSelection(runId: string, monsterId: string, selection: MoveSelectionRequest): { success: boolean; message: string; run: GameRun } {
    return this.gameRunService.handleMoveSelection(runId, monsterId, selection);
  }

  addCurrency(runId: string, amount: number): GameRun {
    const run = this.getGameRun(runId);
    if (!run) {
      throw new Error('Game run not found');
    }
    return this.inventoryService.addCurrency(run, amount);
  }

  addItem(runId: string, item: Item): GameRun {
    const run = this.getGameRun(runId);
    if (!run) {
      throw new Error('Game run not found');
    }
    return this.inventoryService.addItem(run, item);
  }

  useItem(runId: string, itemId: string, targetMonsterId?: string, moveId?: string): { success: boolean; message: string; run: GameRun } {
    const run = this.getGameRun(runId);
    if (!run) {
      throw new Error('Game run not found');
    }
    return this.inventoryService.useItem(run, itemId, targetMonsterId, moveId);
  }

  endRun(runId: string, reason: 'victory' | 'defeat'): GameRun {
    const run = this.gameRunService.endRun(runId, reason);

    // Award permanent currency based on performance
    const currencyReward = run.currentStage * 10 + (reason === 'victory' ? 100 : 0);
    this.playerManagementService.updatePlayerStats(run.playerId, { permanentCurrency: currencyReward });

    return run;
  }

  generateRandomEncounter(stageLevel: number, runId?: string): EncounterResult {
    const run = runId ? this.getGameRun(runId) : undefined;
    return this.encounterService.generateRandomEncounter(stageLevel, run);
  }

  restoreMonsterPP(
    runId: string, 
    monsterId: string, 
    options: { moveId?: string; amount?: number; restoreAll?: boolean }
  ) {
    return this.gameRunService.restoreMonsterPP(runId, monsterId, options);
  }

  restoreTeamPP(runId: string) {
    return this.gameRunService.restoreTeamPP(runId);
  }

  useRestSite(runId: string) {
    return this.gameRunService.useRestSite(runId);
  }

  getItemData(itemId: string) {
    return this.inventoryService.getItemData(itemId);
  }
}
