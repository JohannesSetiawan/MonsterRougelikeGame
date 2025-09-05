import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { Ability, Move, Monster, MonsterType, MoveCategory, Item } from '../types';

@Injectable()
export class DataLoaderService implements OnModuleInit {
  private abilities: Record<string, Ability> = {};
  private moves: Record<string, Move> = {};
  private monsters: Record<string, Monster> = {};
  private items: Record<string, Item> = {};
  private starterMonsters: string[] = [];

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      // Try different possible paths for the data directory
      const possiblePaths = [
        join(__dirname, '..', 'data'),        // src/data (development)
        join(__dirname, '..', '..', 'src', 'data'), // from dist back to src/data
        join(process.cwd(), 'src', 'data'),   // absolute from project root
      ];
      
      let dataPath: string | null = null;
      for (const path of possiblePaths) {
        if (existsSync(join(path, 'abilities.json'))) {
          dataPath = path;
          break;
        }
      }
      
      if (!dataPath) {
        throw new Error('Could not find data directory. Checked paths: ' + possiblePaths.join(', '));
      }
      
      console.log('Loading data from:', dataPath);
      
      // Load abilities
      const abilitiesData = JSON.parse(
        readFileSync(join(dataPath, 'abilities.json'), 'utf8')
      );
      this.abilities = abilitiesData;

      // Load moves
      const movesData = JSON.parse(
        readFileSync(join(dataPath, 'moves.json'), 'utf8')
      );
      // Convert string types to enum types
      this.moves = Object.entries(movesData).reduce((acc, [key, move]: [string, any]) => {
        acc[key] = {
          ...move,
          type: move.type as MonsterType,
          category: move.category as MoveCategory
        };
        return acc;
      }, {});

      // Load monsters
      const monstersData = JSON.parse(
        readFileSync(join(dataPath, 'monsters.json'), 'utf8')
      );
      // Convert string types to enum types
      this.monsters = Object.entries(monstersData).reduce((acc, [key, monster]: [string, any]) => {
        acc[key] = {
          ...monster,
          type: monster.type.map((t: string) => t as MonsterType)
        };
        return acc;
      }, {});

      // Load items
      const itemsData = JSON.parse(
        readFileSync(join(dataPath, 'items.json'), 'utf8')
      );
      this.items = itemsData;

      // Load config
      const configData = JSON.parse(
        readFileSync(join(dataPath, 'config.json'), 'utf8')
      );
      this.starterMonsters = configData.starterMonsters;

      console.log('Game data loaded successfully from JSON files');
    } catch (error) {
      console.error('Failed to load game data:', error);
      throw new Error('Failed to load game data');
    }
  }

  getAbilities(): Record<string, Ability> {
    return this.abilities;
  }

  getMoves(): Record<string, Move> {
    return this.moves;
  }

  getMonsters(): Record<string, Monster> {
    return this.monsters;
  }

  getItems(): Record<string, Item> {
    return this.items;
  }

  getStarterMonsters(): string[] {
    return this.starterMonsters;
  }

  getAbility(id: string): Ability | undefined {
    return this.abilities[id];
  }

  getMove(id: string): Move | undefined {
    return this.moves[id];
  }

  getMonster(id: string): Monster | undefined {
    return this.monsters[id];
  }

  getItem(id: string): Item | undefined {
    return this.items[id];
  }
}
