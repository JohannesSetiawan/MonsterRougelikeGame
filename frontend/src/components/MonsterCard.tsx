import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ExperienceBar from './ExperienceBar';
import type { MonsterInstance } from '../api/types';

interface MonsterCardProps {
  monster: MonsterInstance;
}

const MonsterCard: React.FC<MonsterCardProps> = ({ monster }) => {
  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 66) return '#4CAF50';
    if (percentage > 33) return '#FFA726';
    return '#F44336';
  };

  const healthPercentage = getHealthPercentage(monster.currentHp, monster.maxHp);

  return (
    <Card className="border border-border/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-lg">{monster.name}</h4>
            <p className="text-sm text-muted-foreground">Level {monster.level}</p>
          </div>
          {monster.isShiny && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              ✨ Shiny
            </Badge>
          )}
        </div>
        
        {/* Health Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">HP</span>
            <span className="font-medium">
              {monster.currentHp}/{monster.maxHp}
            </span>
          </div>
          <Progress 
            value={healthPercentage} 
            className="h-3"
            style={{
              '--progress-background': getHealthColor(healthPercentage)
            } as React.CSSProperties}
          />
        </div>

        {/* Experience Bar */}
        <ExperienceBar monster={monster} />
      </CardContent>
    </Card>
  );
};

export default MonsterCard;
