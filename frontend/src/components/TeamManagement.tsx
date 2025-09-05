import React, { useState } from 'react';
import type { MonsterInstance } from '../api/types';
import MonsterStatsModal from './MonsterStatsModal';
import ExperienceBar from './ExperienceBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TeamManagementProps {
  team: MonsterInstance[];
  onClose: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ team, onClose }) => {
  const [selectedMonster, setSelectedMonster] = useState<MonsterInstance | null>(null);

  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Your Team</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {team.map((monster) => (
            <Card key={monster.id} className={`border-2 transition-colors relative ${monster.currentHp === 0 ? 'opacity-60 border-red-500/50' : 'hover:border-primary/50'}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {monster.name}
                      {monster.isShiny && (
                        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/50">
                          ✨
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Level {monster.level}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonster(monster)}
                  >
                    📊
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Health Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">HP</span>
                    <span className="font-medium">
                      {monster.currentHp}/{monster.maxHp}
                    </span>
                  </div>
                  <Progress 
                    value={getHealthPercentage(monster.currentHp, monster.maxHp)} 
                    className="h-3"
                  />
                </div>

                {/* Experience Bar */}
                <ExperienceBar monster={monster} />

                {/* Ability */}
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Ability: </span>
                    <span className="font-medium">{monster.ability}</span>
                  </div>
                </div>

                {/* Moves */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Moves:</p>
                  <div className="flex flex-wrap gap-1">
                    {monster.moves.map((moveId, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Fainted Overlay */}
                {monster.currentHp === 0 && (
                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center rounded-md">
                    <Badge variant="destructive" className="text-lg">
                      💀 Fainted
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          
          {team.length === 0 && (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No monsters in your team yet!</p>
            </div>
          )}
        </div>

        {/* Monster Stats Modal */}
        {selectedMonster && (
          <MonsterStatsModal
            monster={selectedMonster}
            onClose={() => setSelectedMonster(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TeamManagement;
