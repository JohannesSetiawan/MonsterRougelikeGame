import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { MonsterInstance } from '../api/types';

interface TurnOrderDisplayProps {
  showTurnOrder: boolean;
  playerMonster: MonsterInstance;
  opponentMonster: MonsterInstance;
  playerGoesFirst: boolean;
  battleLog: Array<{text: string, isCritical?: boolean}>;
}

const TurnOrderDisplay: React.FC<TurnOrderDisplayProps> = ({
  showTurnOrder,
  playerMonster,
  opponentMonster,
  playerGoesFirst,
  battleLog
}) => {
  if (!showTurnOrder) return null;

  const hasItemPriority = battleLog.some(log => log.text.includes('Items are used with priority'));
  const hasCatchPriority = battleLog.some(log => log.text.includes('Catching attempts are made with priority'));

  return (
    <Card className="border-2 border-cyan-500/50 bg-cyan-950/20 animate-pulse">
      <CardContent className="py-4">
        <div className="text-center">
          <div className="text-lg font-bold text-cyan-200 mb-2">
            ⚡ Turn Order ⚡
          </div>
          {(hasItemPriority || hasCatchPriority) && (
            <div className="text-sm text-yellow-300 mb-2">
              {hasItemPriority && '📦 Items always go first!'}
              {hasCatchPriority && '⚾ Catching always goes first!'}
            </div>
          )}
          <div className="flex justify-center items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              playerGoesFirst 
                ? 'bg-green-500/30 border border-green-400/50 text-green-200' 
                : 'bg-gray-500/30 border border-gray-400/50 text-gray-300'
            }`}>
              <span className="text-lg">{playerGoesFirst ? '1st' : '2nd'}</span>
              <span className="font-semibold">{playerMonster.name}</span>
              <span className="text-sm opacity-75">
                {hasItemPriority
                  ? '(Item Priority)' 
                  : hasCatchPriority
                    ? '(Catch Priority)'
                    : `(${playerMonster.stats.speed} SPD)`
                }
              </span>
            </div>
            <div className="text-cyan-200 text-xl">VS</div>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
              !playerGoesFirst 
                ? 'bg-green-500/30 border border-green-400/50 text-green-200' 
                : 'bg-gray-500/30 border border-gray-400/50 text-gray-300'
            }`}>
              <span className="text-lg">{!playerGoesFirst ? '1st' : '2nd'}</span>
              <span className="font-semibold">{opponentMonster.name}</span>
              <span className="text-sm opacity-75">({opponentMonster.stats.speed} SPD)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TurnOrderDisplay;
