import React from 'react';
import { Badge } from '@/components/ui/badge';
import type { StatusCondition } from '../api/types';
import { StatusEffect } from '../api/types';

interface StatusEffectsDisplayProps {
  statusConditions?: StatusCondition[];
}

const StatusEffectsDisplay: React.FC<StatusEffectsDisplayProps> = ({ statusConditions }) => {
  if (!statusConditions || statusConditions.length === 0) {
    return null;
  }

  const getStatusEffectInfo = (effect: StatusEffect) => {
    switch (effect) {
      case StatusEffect.BURN:
        return { 
          emoji: '🔥', 
          name: 'Burn', 
          color: 'bg-red-500/20 text-red-300 border-red-500/50',
          description: '5% HP damage per turn, -10% ATK/SP.ATK'
        };
      case StatusEffect.POISON:
        return { 
          emoji: '☠️', 
          name: 'Poison', 
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
          description: '5% HP damage per turn, -10% ATK/SP.ATK'
        };
      case StatusEffect.PARALYZE:
        return { 
          emoji: '⚡', 
          name: 'Paralyze', 
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
          description: '40% chance to skip turn, -10% speed'
        };
      case StatusEffect.SLEEP:
        return { 
          emoji: '😴', 
          name: 'Sleep', 
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
          description: 'Cannot act, 40% chance to wake up per turn'
        };
      case StatusEffect.CONFUSION:
        return { 
          emoji: '😵‍💫', 
          name: 'Confused', 
          color: 'bg-pink-500/20 text-pink-300 border-pink-500/50',
          description: '30% chance to hit self instead'
        };
      case StatusEffect.FROSTBITE:
        return { 
          emoji: '🧊', 
          name: 'Frozen', 
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50',
          description: '30% chance to skip turn, 5% HP damage per turn'
        };
      case StatusEffect.BADLY_POISONED:
        return { 
          emoji: '💀', 
          name: 'Badly Poisoned', 
          color: 'bg-purple-700/20 text-purple-200 border-purple-700/50',
          description: '10% HP damage per turn, -10% ATK/SP.ATK'
        };
      case StatusEffect.BADLY_BURN:
        return { 
          emoji: '🔥💀', 
          name: 'Badly Burned', 
          color: 'bg-red-700/20 text-red-200 border-red-700/50',
          description: '10% HP damage per turn, -10% DEF/SP.DEF'
        };
      default:
        return { 
          emoji: '❓', 
          name: 'Unknown', 
          color: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
          description: 'Unknown effect'
        };
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {statusConditions.map((condition, index) => {
        const statusInfo = getStatusEffectInfo(condition.effect);
        return (
          <Badge 
            key={`${condition.effect}-${index}`}
            className={`${statusInfo.color} text-xs`}
            title={statusInfo.description}
          >
            {statusInfo.emoji} {statusInfo.name}
            {condition.turnsActive !== undefined && condition.turnsActive > 0 && (
              <span className="ml-1 text-xs opacity-70">({condition.turnsActive})</span>
            )}
          </Badge>
        );
      })}
    </div>
  );
};

export default StatusEffectsDisplay;
