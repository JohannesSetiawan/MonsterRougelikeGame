import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { MonsterInstance, Move } from '../api/types';

interface MoveSelectionProps {
  playerMonster: MonsterInstance;
  movesData: Record<string, Move>;
  onAttack: (moveId: string) => void;
  onMoveInfo: (moveId: string) => void;
  isProcessing: boolean;
  battleEnded: boolean;
}

const MoveSelection: React.FC<MoveSelectionProps> = ({
  playerMonster,
  movesData,
  onAttack,
  onMoveInfo,
  isProcessing,
  battleEnded
}) => {
  const getMoveData = (moveId: string): { name: string; power: number; accuracy: number; pp: number } => {
    // Use loaded moves data from API if available
    if (movesData[moveId]) {
      return {
        name: movesData[moveId].name,
        power: movesData[moveId].power,
        accuracy: movesData[moveId].accuracy,
        pp: movesData[moveId].pp
      };
    }
    
    // Fallback data only for battle interface - shows that data is loading
    return { 
      name: moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' (Loading...)', 
      power: 0, 
      accuracy: 0,
      pp: 0
    };
  };

  // Check if player is committed to a two-turn move or locked into a multi-turn move
  const forcedMoveId = 
    (playerMonster.twoTurnMoveState?.phase === 'charging' ? playerMonster.twoTurnMoveState.moveId : null) ||
    (playerMonster.lockingMoveState && playerMonster.lockingMoveState.turnsRemaining > 0 ? playerMonster.lockingMoveState.moveId : null);

  // Special handling for forced moves due to two-turn moves or locking moves
  if (forcedMoveId) {
    const move = getMoveData(forcedMoveId);
    const isTwoTurnMove = playerMonster.twoTurnMoveState?.phase === 'charging';
    
    const title = isTwoTurnMove ? "Committed to Two-Turn Move" : "Locked into Multi-Turn Move";
    const description = isTwoTurnMove 
      ? "You must continue with the charging move!" 
      : `You're locked into this move! (${playerMonster.lockingMoveState?.turnsRemaining} turns remaining)`;
    const buttonText = isTwoTurnMove 
      ? "⚡ Executing charged attack!" 
      : `🔒 Continue locked move (${playerMonster.lockingMoveState?.turnsRemaining} left)`;
    
    return (
      <Card className="lg:col-span-3 border-2 border-yellow-500/50 bg-yellow-950/20">
        <CardHeader>
          <CardTitle className="text-yellow-300">
            Moves - {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-yellow-200 text-sm">
              {description}
            </p>
            <div className="flex justify-center">
              <Button
                variant="default"
                onClick={() => onAttack(forcedMoveId)}
                disabled={isProcessing || battleEnded}
                className="flex-col h-auto p-4 bg-yellow-600 hover:bg-yellow-700 border-yellow-500 min-w-[200px]"
              >
                <div className="font-semibold">{move.name}</div>
                <div className="text-xs mt-1 opacity-80">
                  {buttonText}
                </div>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-3 border-2 border-primary/50">
      <CardHeader>
        <CardTitle>Moves</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {playerMonster.moves.map((moveId) => {
            const move = getMoveData(moveId);
            const currentPP = (playerMonster.movePP && playerMonster.movePP[moveId]) || 0;
            const maxPP = move.pp;
            const isOutOfPP = currentPP <= 0;
            
            return (
              <div key={moveId} className="flex gap-2">
                <Button
                  variant={isOutOfPP ? "outline" : "default"}
                  onClick={() => onAttack(moveId)}
                  disabled={isProcessing || battleEnded || isOutOfPP}
                  className={`flex-1 flex-col h-auto p-4 ${isOutOfPP ? 'opacity-50' : ''}`}
                >
                  <div className="font-semibold">{move.name}</div>
                  <div className="text-xs mt-1 opacity-80">
                    PWR: {move.power} | ACC: {move.accuracy}% | PP: {currentPP}/{maxPP}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onMoveInfo(moveId)}
                  className="p-2"
                >
                  ℹ️
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default MoveSelection;
