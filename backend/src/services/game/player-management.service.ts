import { Injectable } from '@nestjs/common';
import { Player } from '../../types';
import { DataLoaderService } from '../data-loader.service';
import { DatabaseService } from '../database.service';

@Injectable()
export class PlayerManagementService {
  private players: Map<string, Player> = new Map();

  constructor(
    private dataLoaderService: DataLoaderService,
    private databaseService: DatabaseService
  ) {}

  async createPlayer(username: string): Promise<Player> {
    // Check if username already exists
    const existingPlayer = await this.databaseService.getPlayerByUsername(username);
    if (existingPlayer) {
      throw new Error('Username already exists. Please choose a different username.');
    }

    const playerData: Omit<Player, 'id' | 'createdAt'> = {
      username,
      permanentCurrency: 100,
      unlockedStarters: [...this.dataLoaderService.getStarterMonsters()],
      unlockedAbilities: [],
      totalRuns: 0,
      bestStage: 0,
    };

    // Save to database
    const savedPlayer = await this.databaseService.createPlayer(playerData);
    
    // Also keep in memory for current session
    this.players.set(savedPlayer.id, savedPlayer);
    
    return savedPlayer;
  }

  async loadPlayer(playerId: string): Promise<Player | null> {
    // Load player from database and populate memory
    const player = await this.databaseService.getPlayerById(playerId);
    if (player) {
      this.players.set(player.id, player);
    }
    return player;
  }

  async loadPlayerByUsername(username: string): Promise<Player | null> {
    // Load player from database by username and populate memory
    const player = await this.databaseService.getPlayerByUsername(username);
    if (player) {
      this.players.set(player.id, player);
    }
    return player;
  }

  async savePlayerProgress(playerId: string): Promise<{ success: boolean; message: string }> {
    const player = this.players.get(playerId);
    if (!player) {
      return { success: false, message: 'Player not found in memory' };
    }

    try {
      // Save player data
      await this.databaseService.savePlayerState(player);
      return { success: true, message: 'Player progress saved successfully!' };
    } catch (error) {
      return { success: false, message: 'Failed to save player progress: ' + error.message };
    }
  }

  getPlayer(playerId: string): Player | undefined {
    return this.players.get(playerId);
  }

  updatePlayerStats(playerId: string, updates: Partial<Pick<Player, 'totalRuns' | 'bestStage' | 'permanentCurrency'>>): Player {
    const player = this.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }

    if (updates.totalRuns !== undefined) {
      player.totalRuns = updates.totalRuns;
    }
    if (updates.bestStage !== undefined && updates.bestStage > player.bestStage) {
      player.bestStage = updates.bestStage;
    }
    if (updates.permanentCurrency !== undefined) {
      player.permanentCurrency += updates.permanentCurrency;
    }

    return player;
  }

  getAllPlayers(): Player[] {
    return Array.from(this.players.values());
  }
}