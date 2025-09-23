import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GameController } from './controllers/game.controller';
import { BattleController } from './controllers/battle.controller';
import { DebugController } from './controllers/debug.controller';
import { ShopController } from './controllers/shop.controller';
import { AdminController } from './controllers/admin.controller';
import { GameService } from './services/game.service';
import { BattleService } from './services/battle.service';
import { MonsterService } from './services/monster.service';
import { DataLoaderService } from './services/data-loader.service';
import { DatabaseService } from './services/database.service';
import { JsonFileService } from './services/json-file.service';

// Game module services
import { 
  PlayerManagementService, 
  GameRunService, 
  InventoryService, 
  EncounterService 
} from './services/game';

import { PlayerEntity } from './entities/player.entity';
import { GameRunEntity } from './entities/game-run.entity';

// Battle module services
import {
  StatusEffectService,
  DamageCalculationService,
  BattleActionsService,
  BattleAIService,
  ExperienceService,
  AbilityEffectsService,
  TurnManagementService,
  WeatherService,
  TwoTurnMoveService,
  MultiTurnMoveService,
  FieldTrackerService,
  MoveValidationService
} from './services/battle';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'postgres'),
        password: configService.get('DATABASE_PASSWORD', 'password'),
        database: configService.get('DATABASE_NAME', 'roguelike_game'),
        entities: [PlayerEntity, GameRunEntity],
        synchronize: true, // Only for development - use migrations in production
        logging: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([PlayerEntity, GameRunEntity]),
  ],
  controllers: [GameController, BattleController, DebugController, ShopController, AdminController],
  providers: [
    GameService, 
    BattleService, 
    MonsterService, 
    DataLoaderService, 
    DatabaseService,
    JsonFileService,
    // Game module services
    PlayerManagementService,
    GameRunService,
    InventoryService,
    EncounterService,
    // Battle module services
    StatusEffectService,
    DamageCalculationService,
    BattleActionsService,
    BattleAIService,
    ExperienceService,
    AbilityEffectsService,
    TurnManagementService,
    WeatherService,
    TwoTurnMoveService,
    MultiTurnMoveService,
    FieldTrackerService,
    MoveValidationService
  ],
})
export class AppModule {}
