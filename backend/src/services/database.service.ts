import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerEntity } from '../entities/player.entity';
import { GameRunEntity } from '../entities/game-run.entity';
import { Player, GameRun } from '../types';

@Injectable()
export class DatabaseService {
  constructor(
    @InjectRepository(PlayerEntity)
    private playerRepository: Repository<PlayerEntity>,
    @InjectRepository(GameRunEntity)
    private gameRunRepository: Repository<GameRunEntity>,
  ) {}

  async createPlayer(playerData: Omit<Player, 'id' | 'createdAt'>): Promise<Player> {
    const playerEntity = this.playerRepository.create({
      ...playerData,
      unlockedStarters: playerData.unlockedStarters || [],
      unlockedAbilities: playerData.unlockedAbilities || [],
    });

    const savedPlayer = await this.playerRepository.save(playerEntity);
    return this.mapPlayerEntityToPlayer(savedPlayer);
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    const playerEntity = await this.playerRepository.findOne({
      where: { id: playerId },
    });

    return playerEntity ? this.mapPlayerEntityToPlayer(playerEntity) : null;
  }

  async savePlayerState(player: Player): Promise<Player> {
    await this.playerRepository.update(player.id, {
      username: player.username,
      permanentCurrency: player.permanentCurrency,
      unlockedStarters: player.unlockedStarters || [],
      unlockedAbilities: player.unlockedAbilities || [],
      totalRuns: player.totalRuns,
      bestStage: player.bestStage,
    });

    return player;
  }

  async saveGameRunState(gameRun: GameRun): Promise<GameRun> {
    // Check if game run already exists
    const existingRun = await this.gameRunRepository.findOne({
      where: { id: gameRun.id },
    });

    if (existingRun) {
      // Update existing run
      await this.gameRunRepository.update(gameRun.id, {
        currentStage: gameRun.currentStage,
        team: gameRun.team,
        inventory: gameRun.inventory,
        currency: gameRun.currency,
        isActive: gameRun.isActive,
        endedAt: gameRun.endedAt,
        permanentItems: gameRun.permanentItems || [],
        temporaryEffects: gameRun.temporaryEffects as any,
      });
    } else {
      // Create new run
      const gameRunEntity = this.gameRunRepository.create({
        id: gameRun.id,
        playerId: gameRun.playerId,
        currentStage: gameRun.currentStage,
        team: gameRun.team,
        inventory: gameRun.inventory,
        currency: gameRun.currency,
        isActive: gameRun.isActive,
        createdAt: gameRun.createdAt,
        endedAt: gameRun.endedAt,
        permanentItems: gameRun.permanentItems || [],
        temporaryEffects: gameRun.temporaryEffects,
      });

      await this.gameRunRepository.save(gameRunEntity);
    }

    return gameRun;
  }

  async getLatestGameRunForPlayer(playerId: string): Promise<GameRun | null> {
    const gameRunEntity = await this.gameRunRepository.findOne({
      where: { playerId, isActive: true },
      order: { createdAt: 'DESC' },
    });

    return gameRunEntity ? this.mapGameRunEntityToGameRun(gameRunEntity) : null;
  }

  private mapPlayerEntityToPlayer(entity: PlayerEntity): Player {
    return {
      id: entity.id,
      username: entity.username,
      permanentCurrency: entity.permanentCurrency,
      unlockedStarters: entity.unlockedStarters || [],
      unlockedAbilities: entity.unlockedAbilities || [],
      totalRuns: entity.totalRuns,
      bestStage: entity.bestStage,
      createdAt: entity.createdAt,
    };
  }

  private mapGameRunEntityToGameRun(entity: GameRunEntity): GameRun {
    return {
      id: entity.id,
      playerId: entity.playerId,
      currentStage: entity.currentStage,
      team: entity.team || [],
      inventory: entity.inventory || [],
      currency: entity.currency,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      endedAt: entity.endedAt,
      permanentItems: entity.permanentItems || [],
      temporaryEffects: entity.temporaryEffects,
    };
  }
}
