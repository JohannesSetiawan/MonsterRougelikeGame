import { Injectable } from '@nestjs/common';
import { GameRun, MonsterInstance, MoveSelectionRequest } from '../../types';
import { MonsterService } from '../monster.service';
import { DatabaseService } from '../database.service';
import { BattleService } from '../battle.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GameRunService {
  private gameRuns: Map<string, GameRun> = new Map();

  constructor(
    private monsterService: MonsterService,
    private databaseService: DatabaseService,
    private battleService: BattleService
  ) {}

  async startNewRun(playerId: string, starterId: string, unlockedStarters: string[], permanentCurrency: number): Promise<GameRun> {
    if (!unlockedStarters.includes(starterId)) {
      throw new Error('Starter not unlocked');
    }

    // End any active runs
    const activeRun = await this.getActiveRun(playerId);
    if (activeRun) {
      activeRun.isActive = false;
      activeRun.endedAt = new Date();
    }

    // Create starter monster
    const starterMonster = this.monsterService.createMonsterInstance(starterId, 5);

    // Create new run
    const gameRun: GameRun = {
      id: this.generateId(),
      playerId,
      currentStage: 1,
      team: [starterMonster],
      inventory: [], // Will be populated by InventoryService
      currency: permanentCurrency,
      isActive: true,
      createdAt: new Date()
    };

    this.gameRuns.set(gameRun.id, gameRun);
    return gameRun;
  }

  async loadLatestGameRunForPlayer(playerId: string): Promise<GameRun | null> {
    const run = await this.databaseService.getLatestGameRunForPlayer(playerId);
    if (run) {
      this.gameRuns.set(run.id, run);
    }
    return run;
  }

  async saveGameRunProgress(runId: string): Promise<{ success: boolean; message: string }> {
    const run = this.gameRuns.get(runId);
    if (!run) {
      return { success: false, message: 'Game run not found in memory' };
    }

    try {
      await this.databaseService.saveGameRunState(run);
      return { success: true, message: 'Game run saved successfully!' };
    } catch (error) {
      return { success: false, message: 'Failed to save game run: ' + error.message };
    }
  }

  getActiveRun(playerId: string): GameRun | undefined {
    for (const run of this.gameRuns.values()) {
      if (run.playerId === playerId && run.isActive) {
        return run;
      }
    }
    return undefined;
  }

  getGameRun(runId: string): GameRun | undefined {
    return this.gameRuns.get(runId);
  }

  progressStage(runId: string): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.currentStage++;
    
    // Check for victory condition (reaching stage 200000)
    if (run.currentStage > 200000) {
      this.endRun(runId, 'victory');
      return run;
    }

    return run;
  }

  addMonsterToTeam(runId: string, monster: MonsterInstance): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    if (run.team.length < 6) { // Max team size
      run.team.push(monster);
    } else {
      throw new Error('Team is full');
    }

    return run;
  }

  handleMoveSelection(runId: string, monsterId: string, selection: MoveSelectionRequest): { success: boolean; message: string; run: GameRun } {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    // Find the monster in the team
    const monsterIndex = run.team.findIndex(monster => monster.id === monsterId);
    if (monsterIndex === -1) {
      throw new Error('Monster not found in team');
    }

    const monster = run.team[monsterIndex];

    // If player chose not to learn the move
    if (!selection.learnMove) {
      return {
        success: true,
        message: `${monster.name} did not learn ${this.monsterService.getMoveData(selection.newMove)?.name || selection.newMove}.`,
        run
      };
    }

    try {
      // Use MonsterService to learn the move
      const updatedMonster = this.monsterService.learnMove(
        monster,
        selection.newMove,
        selection.selectedMoveToReplace
      );

      // Update the monster in the team
      run.team[monsterIndex] = updatedMonster;

      const moveName = this.monsterService.getMoveData(selection.newMove)?.name || selection.newMove;
      let message = `${monster.name} learned ${moveName}!`;
      
      if (selection.selectedMoveToReplace) {
        const replacedMoveName = this.monsterService.getMoveData(selection.selectedMoveToReplace)?.name || selection.selectedMoveToReplace;
        message = `${monster.name} forgot ${replacedMoveName} and learned ${moveName}!`;
      }

      return {
        success: true,
        message,
        run
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        run
      };
    }
  }

  endRun(runId: string, reason: 'victory' | 'defeat'): GameRun {
    const run = this.gameRuns.get(runId);
    if (!run || !run.isActive) {
      throw new Error('Game run not found or not active');
    }

    run.isActive = false;
    run.endedAt = new Date();

    return run;
  }

  restoreMonsterPP(
    runId: string, 
    monsterId: string, 
    options: { moveId?: string; amount?: number; restoreAll?: boolean }
  ) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    const monster = run.team.find(m => m.id === monsterId);
    if (!monster) {
      throw new Error('Monster not found in team');
    }

    if (options.restoreAll) {
      this.monsterService.restoreAllPP(monster);
    } else if (options.moveId) {
      this.monsterService.restoreMovePP(monster, options.moveId, options.amount);
    }

    return { success: true, monster };
  }

  restoreTeamPP(runId: string) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    run.team.forEach(monster => {
      this.monsterService.restoreAllPP(monster);
    });

    return { success: true, team: run.team };
  }

  useRestSite(runId: string) {
    const run = this.gameRuns.get(runId);
    if (!run) {
      throw new Error('Game run not found');
    }

    // Fully restore HP, PP, and clear all status effects for all team members
    run.team.forEach(monster => {
      monster.currentHp = monster.maxHp; // Full HP restoration
      this.monsterService.restoreAllPP(monster); // Full PP restoration
      this.battleService.clearAllStatusEffects(monster); // Clear all status effects
    });

    return { 
      success: true, 
      message: 'Your team has been fully healed, all PP has been restored, and all status effects have been cured!',
      team: run.team 
    };
  }

  private generateId(): string {
    return uuidv4();
  }
}