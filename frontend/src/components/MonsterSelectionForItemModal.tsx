import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { MonsterInstance, Item } from '../api/types';
import { cn } from '../lib/utils';

interface MonsterSelectionForItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMonster: (monsterId: string) => void;
  availableMonsters: MonsterInstance[];
  item: Item;
  isProcessing: boolean;
}

const MonsterSelectionForItemModal: React.FC<MonsterSelectionForItemModalProps> = ({
  isOpen,
  onClose,
  onSelectMonster,
  availableMonsters,
  item,
  isProcessing
}) => {
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'healing': return '💊';
      case 'capture': return '⚪';
      case 'battle': return '⚔️';
      default: return '📦';
    }
  };

  const handleMonsterSelect = (monsterId: string) => {
    if (isProcessing) return;
    onSelectMonster(monsterId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{getItemIcon(item.type)}</span>
            Select Monster for {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Choose which monster should use this item:
          </p>

          <div className="space-y-2">
            {availableMonsters.map((monster) => (
              <Card key={monster.id} className="cursor-pointer hover:bg-slate-50">
                <CardContent className="p-3">
                  <Button
                    variant="ghost"
                    onClick={() => handleMonsterSelect(monster.id)}
                    disabled={isProcessing}
                    className="w-full justify-start h-auto p-0"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🐾</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{monster.name}</p>
                          <p className="text-sm text-slate-600">
                            {monster.currentHp}/{monster.maxHp} HP
                          </p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-2 py-1 rounded text-xs",
                        monster.currentHp > monster.maxHp * 0.5 
                          ? "bg-green-100 text-green-700"
                          : monster.currentHp > monster.maxHp * 0.2
                          ? "bg-yellow-100 text-yellow-700"  
                          : "bg-red-100 text-red-700"
                      )}>
                        {monster.currentHp <= 0 ? 'Fainted' : 'Active'}
                      </div>
                    </div>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterSelectionForItemModal;