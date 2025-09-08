import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { MonsterInstance, Move } from '../api/types';

interface MoveSelectionModalProps {
  monster: MonsterInstance;
  movesData: Record<string, Move>;
  itemName: string;
  onSelectMove: (moveId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const MoveSelectionModal: React.FC<MoveSelectionModalProps> = ({
  monster,
  movesData,
  itemName,
  onSelectMove,
  onClose,
  isProcessing
}) => {
  const getMoveData = (moveId: string) => {
    if (movesData[moveId]) {
      return movesData[moveId];
    }
    // Fallback data
    return { 
      name: moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      power: 0, 
      accuracy: 0,
      pp: 20,
      type: 'normal',
      category: 'physical'
    };
  };

  const getTypeColor = (type: string) => {
    const typeColors = {
      normal: 'bg-gray-500/20 text-gray-700 border-gray-500/50',
      fire: 'bg-red-500/20 text-red-700 border-red-500/50',
      water: 'bg-blue-500/20 text-blue-700 border-blue-500/50',
      electric: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/50',
      grass: 'bg-green-500/20 text-green-700 border-green-500/50',
      ice: 'bg-cyan-500/20 text-cyan-700 border-cyan-500/50',
      fighting: 'bg-orange-500/20 text-orange-700 border-orange-500/50',
      poison: 'bg-purple-500/20 text-purple-700 border-purple-500/50',
      ground: 'bg-amber-500/20 text-amber-700 border-amber-500/50',
      flying: 'bg-indigo-500/20 text-indigo-700 border-indigo-500/50',
      psychic: 'bg-pink-500/20 text-pink-700 border-pink-500/50',
      bug: 'bg-lime-500/20 text-lime-700 border-lime-500/50',
      rock: 'bg-stone-500/20 text-stone-700 border-stone-500/50',
      ghost: 'bg-violet-500/20 text-violet-700 border-violet-500/50',
      dragon: 'bg-indigo-600/20 text-indigo-800 border-indigo-600/50',
      dark: 'bg-gray-800/20 text-gray-300 border-gray-800/50',
      steel: 'bg-slate-500/20 text-slate-700 border-slate-500/50',
      fairy: 'bg-rose-500/20 text-rose-700 border-rose-500/50'
    };
    return typeColors[type as keyof typeof typeColors] || typeColors.normal;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center gap-2">
            Select Move to Restore
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose which move to use {itemName} on for {monster.name}
          </p>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {monster.moves.map((moveId) => {
            const move = getMoveData(moveId);
            const currentPP = (monster.movePP && monster.movePP[moveId]) || 0;
            const maxPP = move.pp;
            const ppPercentage = (currentPP / maxPP) * 100;
            const isFullPP = currentPP >= maxPP;
            
            return (
              <Card 
                key={moveId} 
                className={`border transition-colors ${isFullPP ? 'opacity-50' : 'hover:border-primary/50 cursor-pointer'}`}
                onClick={() => !isFullPP && !isProcessing && onSelectMove(moveId)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">{move.name}</h4>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded border ${getTypeColor(move.type)}`}>
                          {move.type.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          PWR: {move.power} | ACC: {move.accuracy}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        PP: {currentPP}/{maxPP}
                      </div>
                      <div className="w-16 mt-1">
                        <Progress value={ppPercentage} className="h-2" />
                      </div>
                    </div>
                  </div>
                  {isFullPP && (
                    <p className="text-xs text-muted-foreground mt-2">
                      This move is already at full PP
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveSelectionModal;
