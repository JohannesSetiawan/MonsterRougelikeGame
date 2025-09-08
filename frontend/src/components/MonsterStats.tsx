import React from 'react';
import type { MonsterInstance, Move, Ability, StatModifiers } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ExtendedMove extends Move {
  currentPp?: number;
  maxPp?: number;
}

interface ExtendedMonsterInstance extends Omit<MonsterInstance, 'moves'> {
  types?: string[];
  sprite?: string;
  abilities?: Ability[];
  moves?: ExtendedMove[];
  experienceToNext?: number;
}

interface MonsterStatsProps {
  monster: ExtendedMonsterInstance;
  onAbilityClick?: (abilityId: string) => void;
  onMoveClick?: (moveId: string) => void;
}

const MonsterStats: React.FC<MonsterStatsProps> = ({ 
  monster, 
  onAbilityClick, 
  onMoveClick 
}) => {
  const getTypeColor = (type: string | undefined) => {
    if (!type) return 'bg-gray-400 hover:bg-gray-500';
    
    const colors: Record<string, string> = {
      normal: 'bg-gray-400 hover:bg-gray-500',
      fire: 'bg-red-500 hover:bg-red-600',
      water: 'bg-blue-500 hover:bg-blue-600',
      electric: 'bg-yellow-400 hover:bg-yellow-500',
      grass: 'bg-green-500 hover:bg-green-600',
      ice: 'bg-cyan-400 hover:bg-cyan-500',
      fighting: 'bg-red-700 hover:bg-red-800',
      poison: 'bg-purple-500 hover:bg-purple-600',
      ground: 'bg-yellow-600 hover:bg-yellow-700',
      flying: 'bg-indigo-400 hover:bg-indigo-500',
      psychic: 'bg-pink-500 hover:bg-pink-600',
      bug: 'bg-green-400 hover:bg-green-500',
      rock: 'bg-yellow-800 hover:bg-yellow-900',
      ghost: 'bg-purple-700 hover:bg-purple-800',
      dragon: 'bg-indigo-700 hover:bg-indigo-800',
      dark: 'bg-gray-800 hover:bg-gray-900',
      steel: 'bg-gray-500 hover:bg-gray-600',
      fairy: 'bg-pink-300 hover:bg-pink-400'
    };
    return colors[type.toLowerCase()] || 'bg-gray-400 hover:bg-gray-500';
  };

  const getMoveTypeColor = (type: string | undefined) => {
    return getTypeColor(type);
  };

  const getCategoryColor = (category: string | undefined) => {
    if (!category) return 'bg-gray-600 hover:bg-gray-700';
    
    const colors: Record<string, string> = {
      physical: 'bg-red-600 hover:bg-red-700',
      special: 'bg-blue-600 hover:bg-blue-700',
      status: 'bg-gray-600 hover:bg-gray-700'
    };
    return colors[category.toLowerCase()] || 'bg-gray-600 hover:bg-gray-700';
  };

  const calculateStatPercentage = (stat: number) => {
    // Normalize stats to 0-100 range for progress bar
    return Math.min((stat / 255) * 100, 100);
  };

  const getStatColor = (stat: number) => {
    if (stat >= 130) return 'text-purple-400';
    if (stat >= 100) return 'text-blue-400';
    if (stat >= 80) return 'text-green-400';
    if (stat >= 60) return 'text-yellow-400';
    if (stat >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getModifiedStatValue = (baseStat: number, statName: string): number => {
    const modifier = monster.statModifiers?.[statName as keyof typeof monster.statModifiers];
    if (modifier && modifier !== 1) {
      return Math.floor(baseStat * modifier);
    }
    return baseStat;
  };

  const getStatModifierColor = (baseStat: number, statName: string): string => {
    const modifier = monster.statModifiers?.[statName as keyof typeof monster.statModifiers];
    if (!modifier || modifier === 1) {
      return getStatColor(baseStat);
    }
    
    if (modifier > 1) {
      return 'text-green-500'; // Stat is boosted
    } else {
      return 'text-blue-500'; // Stat is reduced
    }
  };

  const renderStatValue = (baseStat: number, statName: string) => {
    const modifier = monster.statModifiers?.[statName as keyof typeof monster.statModifiers];
    const modifiedValue = getModifiedStatValue(baseStat, statName);
    const hasModifier = modifier && modifier !== 1;
    
    if (hasModifier) {
      return (
        <div className="flex flex-col items-end">
          <span className={`font-bold ${getStatModifierColor(baseStat, statName)}`}>
            {modifiedValue}
          </span>
          <span className="text-xs text-muted-foreground line-through">
            {baseStat}
          </span>
        </div>
      );
    }
    
    return (
      <span className={`font-bold ${getStatColor(baseStat)}`}>
        {baseStat}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-foreground">{monster.name}</CardTitle>
              <p className="text-muted-foreground">Level {monster.level}</p>
            </div>
            <div className="text-4xl">{monster.sprite || '👾'}</div>
          </div>
          
          {/* Types */}
          <div className="flex flex-wrap gap-2 mt-2">
            {monster.types?.filter(Boolean).map((type: string) => (
              <Badge key={type} className={`text-white ${getTypeColor(type)}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* HP Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground font-medium">HP</span>
              <span className="text-muted-foreground">{monster.currentHp} / {monster.maxHp}</span>
            </div>
            <Progress 
              value={(monster.currentHp / monster.maxHp) * 100}
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Base Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Base Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(monster.stats).map(([statName, statValue]) => (
            <div key={statName} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-foreground font-medium capitalize">
                  {statName.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {renderStatValue(statValue, statName)}
              </div>
              <Progress 
                value={calculateStatPercentage(getModifiedStatValue(statValue, statName))}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Abilities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {monster.abilities?.map((ability) => (
            <Button
              key={ability.id}
              variant="outline"
              className="w-full justify-start text-left h-auto p-3"
              onClick={() => onAbilityClick?.(ability.id)}
            >
              <div className="space-y-1">
                <div className="font-medium text-foreground">{ability.name}</div>
                {ability.description && (
                  <div className="text-sm text-muted-foreground">
                    {ability.description}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Moves */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Moves</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {monster.moves?.map((move) => (
            <Button
              key={move.id}
              variant="outline"
              className="w-full p-4 h-auto"
              onClick={() => onMoveClick?.(move.id)}
            >
              <div className="w-full space-y-2">
                {/* Move Header */}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{move.name}</span>
                  <div className="flex gap-2">
                    <Badge className={`text-white text-xs ${getMoveTypeColor(move.type)}`}>
                      {move.type}
                    </Badge>
                    <Badge className={`text-white text-xs ${getCategoryColor(move.category)}`}>
                      {move.category}
                    </Badge>
                  </div>
                </div>

                {/* Move Stats */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Power: {move.power || '—'}</span>
                  <span>Accuracy: {move.accuracy || '—'}%</span>
                  <span>PP: {move.currentPp}/{move.maxPp}</span>
                </div>

                {/* PP Bar */}
                {move.maxPp && move.currentPp !== undefined && (
                  <Progress 
                    value={(move.currentPp / move.maxPp) * 100}
                    className="h-1"
                  />
                )}
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Experience */}
      {monster.experience !== undefined && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Level {monster.level}</span>
              <span className="text-muted-foreground">
                {monster.experience} / {monster.experienceToNext || 1000} XP
              </span>
            </div>
            <Progress 
              value={((monster.experience || 0) / (monster.experienceToNext || 1000)) * 100}
              className="h-2"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonsterStats;
