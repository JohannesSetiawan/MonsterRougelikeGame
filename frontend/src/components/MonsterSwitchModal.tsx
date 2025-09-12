import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MonsterInstance } from '@/api/types';

interface MonsterSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: MonsterInstance[];
  currentMonsterId: string;
  onSwitchMonster: (monsterId: string) => void;
  isProcessing: boolean;
}

const MonsterSwitchModal: React.FC<MonsterSwitchModalProps> = ({
  isOpen,
  onClose,
  team,
  currentMonsterId,
  onSwitchMonster,
  isProcessing
}) => {
  const availableMonsters = team.filter(monster => 
    monster.id !== currentMonsterId && monster.currentHp > 0
  );

  const handleSwitch = (monsterId: string) => {
    onSwitchMonster(monsterId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Switch Monster</DialogTitle>
        </DialogHeader>
        
        {availableMonsters.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No other healthy monsters available to switch to.
            </p>
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="mt-4"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Choose a monster to switch to:
            </p>
            
            {availableMonsters.map((monster) => (
              <Card 
                key={monster.id} 
                className="cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleSwitch(monster.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{monster.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Level {monster.level}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm">HP:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{
                              width: `${(monster.currentHp / monster.maxHp) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm">
                          {monster.currentHp}/{monster.maxHp}
                        </span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <Button
                        size="sm"
                        disabled={isProcessing}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwitch(monster.id);
                        }}
                      >
                        Switch
                      </Button>
                    </div>
                  </div>
                  
                  {monster.statusConditions && monster.statusConditions.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {monster.statusConditions.map((condition, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800"
                        >
                          {condition.effect}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            
            <div className="flex justify-end pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MonsterSwitchModal;
