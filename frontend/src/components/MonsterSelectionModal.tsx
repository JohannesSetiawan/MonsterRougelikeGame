import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { MonsterInstance } from '../api/types';

interface MonsterSelectionModalProps {
  monsters: MonsterInstance[];
  itemName: string;
  onSelectMonster: (monsterId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const MonsterSelectionModal: React.FC<MonsterSelectionModalProps> = ({
  monsters,
  itemName,
  onSelectMonster,
  onClose,
  isProcessing
}) => {
  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getExperiencePercentage = (monster: MonsterInstance) => {
    // Calculate experience percentage for current level
    const currentLevelExp = Math.pow(monster.level, 3);
    const nextLevelExp = Math.pow(monster.level + 1, 3);
    const expInLevel = monster.experience - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    return Math.min(100, (expInLevel / expNeeded) * 100);
  };

  // Filter out fainted monsters for certain items
  const availableMonsters = monsters.filter(monster => monster.currentHp > 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center gap-2">
            Select Monster
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose which monster to use {itemName} on
          </p>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {availableMonsters.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No available monsters for this item</p>
            </div>
          ) : (
            availableMonsters.map((monster) => (
              <Card 
                key={monster.id} 
                className="border transition-colors hover:border-primary/50 cursor-pointer"
                onClick={() => !isProcessing && onSelectMonster(monster.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-foreground flex items-center gap-2">
                        {monster.name}
                        {monster.isShiny && (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                            ✨
                          </Badge>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground">Level {monster.level}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">HP</span>
                      <span>{monster.currentHp}/{monster.maxHp}</span>
                    </div>
                    <Progress 
                      value={getHealthPercentage(monster.currentHp, monster.maxHp)} 
                      className="h-2"
                    />
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">EXP</span>
                      <span>{getExperiencePercentage(monster).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={getExperiencePercentage(monster)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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

export default MonsterSelectionModal;
