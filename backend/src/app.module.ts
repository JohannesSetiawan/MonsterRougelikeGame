import { Module } from '@nestjs/common';
import { GameController } from './controllers/game.controller';
import { BattleController } from './controllers/battle.controller';
import { DebugController } from './controllers/debug.controller';
import { GameService } from './services/game.service';
import { BattleService } from './services/battle.service';
import { MonsterService } from './services/monster.service';
import { DataLoaderService } from './services/data-loader.service';

@Module({
  imports: [],
  controllers: [GameController, BattleController, DebugController],
  providers: [GameService, BattleService, MonsterService, DataLoaderService],
})
export class AppModule {}
