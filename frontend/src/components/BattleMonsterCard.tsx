import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import ExperienceBar from './ExperienceBar';
import StatusEffectsDisplay from './StatusEffectsDisplay';
import type { MonsterInstance } from '../api/types';

interface MonsterCardProps {
  monster: MonsterInstance;
  isPlayer: boolean;
  goesFirst: boolean;
  showTurnOrder: boolean;
  criticalHitEffect: 'player' | 'opponent' | null;
  onStatsClick: () => void;
  onAbilityClick: (abilityId: string) => void;
  isProcessing: boolean;
  shouldDeferUpdates?: boolean;
}

const MonsterCard: React.FC<MonsterCardProps> = ({
  monster,
  isPlayer,
  goesFirst,
  showTurnOrder,
  criticalHitEffect,
  onStatsClick,
  onAbilityClick,
  isProcessing,
  shouldDeferUpdates = false
}) => {
  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const borderColor = isPlayer ? 'border-blue-500/50' : 'border-red-500/50';
  const bgColor = isPlayer ? 'bg-blue-950/20' : 'bg-red-950/20';
  const textColor = isPlayer ? 'text-blue-200' : 'text-red-200';
  const textColorSecondary = isPlayer ? 'text-blue-300/70' : 'text-red-300/70';
  const textColorTertiary = isPlayer ? 'text-blue-400/60' : 'text-red-400/60';
  const buttonHoverColor = isPlayer ? 'hover:bg-blue-500/20 border-blue-500/50' : 'hover:bg-red-500/20 border-red-500/50';
  const buttonTextColor = isPlayer ? 'text-blue-200 hover:text-blue-100' : 'text-red-200 hover:text-red-100';

  const shouldShowCriticalEffect = (isPlayer && criticalHitEffect === 'player') || (!isPlayer && criticalHitEffect === 'opponent');

  return (
    <Card className={`border-2 ${borderColor} ${bgColor} ${shouldShowCriticalEffect ? 'critical-hit-flash' : ''}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`text-xl ${textColor}`}>
              {monster.name}
            </CardTitle>
            <p className={textColorSecondary}>Level {monster.level}</p>
            <p className={`${textColorTertiary} text-sm font-mono`}>SPD: {monster.stats.speed}</p>
          </div>
          <div className="flex gap-2">
            {goesFirst && showTurnOrder && (
              <Badge className="bg-green-500/20 text-green-300 border-green-500/50 animate-pulse">
                ⚡ 1st
              </Badge>
            )}
            {!goesFirst && showTurnOrder && (
              <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/50">
                2nd
              </Badge>
            )}
            {monster.isShiny && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                ✨ Shiny
              </Badge>
            )}
            <Button 
              variant="outline"
              size="sm"
              onClick={onStatsClick}
              disabled={isProcessing}
              className={buttonHoverColor}
            >
              📊
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={textColorSecondary}>Ability:</span>
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => onAbilityClick(monster.ability)}
              className={`h-auto p-1 ${buttonTextColor}`}
            >
              {monster.ability}
            </Button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className={textColorSecondary}>HP</span>
              <span className={textColor}>
                {monster.currentHp}/{monster.maxHp}
              </span>
            </div>
            <Progress 
              value={getHealthPercentage(monster.currentHp, monster.maxHp)} 
              className="h-4"
            />
          </div>
          {isPlayer && (
            <ExperienceBar 
              monster={monster} 
              textColor={textColorSecondary}
              shouldDeferUpdates={shouldDeferUpdates}
            />
          )}
          
          {/* Status Effects Display */}
          {monster.statusCondition && (
            <div className="space-y-1">
              <span className={`${textColorSecondary} text-sm`}>Status:</span>
              <StatusEffectsDisplay statusCondition={monster.statusCondition} />
            </div>
          )}

          {/* Two-Turn Move State Display */}
          {monster.twoTurnMoveState && (
            <div className="space-y-1">
              <span className={`${textColorSecondary} text-sm`}>Special State:</span>
              <div className="flex flex-wrap gap-1">
                {monster.twoTurnMoveState.phase === 'charging' && monster.twoTurnMoveState.semiInvulnerableState && (
                  <Badge className={`${isPlayer ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'} animate-pulse text-xs`}>
                    {monster.twoTurnMoveState.semiInvulnerableState === 'flying' && '🌪️ Flying High'}
                    {monster.twoTurnMoveState.semiInvulnerableState === 'underground' && '🕳️ Underground'}
                    {monster.twoTurnMoveState.semiInvulnerableState === 'underwater' && '🌊 Underwater'}
                    {monster.twoTurnMoveState.semiInvulnerableState === 'vanished' && '👻 Vanished'}
                  </Badge>
                )}
                {monster.twoTurnMoveState.phase === 'charging' && !monster.twoTurnMoveState.semiInvulnerableState && (
                  <Badge className={`${isPlayer ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' : 'bg-orange-500/20 text-orange-300 border-orange-500/50'} animate-pulse text-xs`}>
                    ⚡ Charging
                  </Badge>
                )}
                {monster.twoTurnMoveState.phase === 'recharging' && (
                  <Badge className={`${isPlayer ? 'bg-gray-500/20 text-gray-300 border-gray-500/50' : 'bg-gray-500/20 text-gray-300 border-gray-500/50'} text-xs`}>
                    💤 Must Recharge
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Multi-Turn Move State Display */}
          {(monster.lockingMoveState || monster.trappedBy) && (
            <div className="space-y-1">
              <span className={`${textColorSecondary} text-sm`}>Multi-Turn State:</span>
              <div className="flex flex-wrap gap-1">
                {monster.lockingMoveState && monster.lockingMoveState.turnsRemaining > 0 && (
                  <Badge className={`${isPlayer ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-purple-500/20 text-purple-300 border-purple-500/50'} animate-pulse text-xs`}>
                    🔒 Locked ({monster.lockingMoveState.turnsRemaining} turns)
                  </Badge>
                )}
                {monster.trappedBy && monster.trappedBy.turnsRemaining > 0 && (
                  <Badge className={`${isPlayer ? 'bg-red-600/20 text-red-300 border-red-600/50' : 'bg-red-600/20 text-red-300 border-red-600/50'} text-xs`}>
                    🕸️ Trapped ({monster.trappedBy.turnsRemaining} turns)
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MonsterCard;
