import { Ability, Move, Monster, MonsterType, MoveCategory } from './types';

export const ABILITIES: Record<string, Ability> = {
  'blaze': {
    id: 'blaze',
    name: 'Blaze',
    description: 'Powers up Fire-type moves when HP is low',
    effect: 'fire_boost_low_hp'
  },
  'torrent': {
    id: 'torrent',
    name: 'Torrent',
    description: 'Powers up Water-type moves when HP is low',
    effect: 'water_boost_low_hp'
  },
  'intimidate': {
    id: 'intimidate',
    name: 'Intimidate',
    description: 'Lowers the opponent\'s Attack stat',
    effect: 'lower_opponent_attack'
  },
  'swift_swim': {
    id: 'swift_swim',
    name: 'Swift Swim',
    description: 'Boosts Speed in rain or water environments',
    effect: 'speed_boost_water'
  }
};

export const MOVES: Record<string, Move> = {
  'scratch': {
    id: 'scratch',
    name: 'Scratch',
    type: MonsterType.FIRE, // Normal type would be better but we only have 2 types
    category: MoveCategory.PHYSICAL,
    power: 40,
    accuracy: 100,
    pp: 35,
    description: 'The target is raked with sharp claws or scythes to inflict damage.'
  },
  'ember': {
    id: 'ember',
    name: 'Ember',
    type: MonsterType.FIRE,
    category: MoveCategory.SPECIAL,
    power: 40,
    accuracy: 100,
    pp: 25,
    description: 'The target is attacked with small flames that may also leave the target with a burn.',
    effect: 'burn_chance_10'
  },
  'flame_burst': {
    id: 'flame_burst',
    name: 'Flame Burst',
    type: MonsterType.FIRE,
    category: MoveCategory.SPECIAL,
    power: 70,
    accuracy: 100,
    pp: 15,
    description: 'The user attacks the target with a bursting flame that damages nearby allies.'
  },
  'water_gun': {
    id: 'water_gun',
    name: 'Water Gun',
    type: MonsterType.WATER,
    category: MoveCategory.SPECIAL,
    power: 40,
    accuracy: 100,
    pp: 25,
    description: 'The target is blasted with a forceful shot of water.'
  },
  'bubble_beam': {
    id: 'bubble_beam',
    name: 'Bubble Beam',
    type: MonsterType.WATER,
    category: MoveCategory.SPECIAL,
    power: 65,
    accuracy: 100,
    pp: 20,
    description: 'A spray of bubbles is forcefully ejected at the target.',
    effect: 'speed_lower_chance_10'
  },
  'hydro_pump': {
    id: 'hydro_pump',
    name: 'Hydro Pump',
    type: MonsterType.WATER,
    category: MoveCategory.SPECIAL,
    power: 110,
    accuracy: 80,
    pp: 5,
    description: 'The target is blasted by a huge volume of water launched under great pressure.'
  }
};

export const MONSTERS: Record<string, Monster> = {
  'flamewyrm': {
    id: 'flamewyrm',
    name: 'Flamewyrm',
    type: [MonsterType.FIRE],
    baseStats: {
      hp: 65,
      attack: 70,
      defense: 50,
      specialAttack: 85,
      specialDefense: 60,
      speed: 75
    },
    abilities: ['blaze', 'intimidate'],
    learnableMoves: ['scratch', 'ember', 'flame_burst'],
    description: 'A small dragon-like creature with flames on its tail. Known for its fierce determination.',
    rarity: 'uncommon'
  },
  'aquafin': {
    id: 'aquafin',
    name: 'Aquafin',
    type: [MonsterType.WATER],
    baseStats: {
      hp: 70,
      attack: 55,
      defense: 65,
      specialAttack: 80,
      specialDefense: 70,
      speed: 65
    },
    abilities: ['torrent', 'swift_swim'],
    learnableMoves: ['scratch', 'water_gun', 'bubble_beam'],
    description: 'A fish-like creature that can manipulate water currents. Very adaptable to aquatic environments.',
    rarity: 'uncommon'
  },
  'pyroblast': {
    id: 'pyroblast',
    name: 'Pyroblast',
    type: [MonsterType.FIRE],
    baseStats: {
      hp: 85,
      attack: 95,
      defense: 70,
      specialAttack: 110,
      specialDefense: 75,
      speed: 90
    },
    abilities: ['blaze'],
    learnableMoves: ['ember', 'flame_burst', 'scratch'],
    description: 'The evolved form of Flamewyrm. Its flames burn so hot they can melt steel.',
    rarity: 'rare'
  },
  'hydroking': {
    id: 'hydroking',
    name: 'Hydroking',
    type: [MonsterType.WATER],
    baseStats: {
      hp: 90,
      attack: 75,
      defense: 85,
      specialAttack: 105,
      specialDefense: 90,
      speed: 80
    },
    abilities: ['torrent'],
    learnableMoves: ['water_gun', 'bubble_beam', 'hydro_pump'],
    description: 'The evolved form of Aquafin. Said to command the seas and control massive tidal waves.',
    rarity: 'rare'
  }
};

export const STARTER_MONSTERS = ['flamewyrm', 'aquafin'];
