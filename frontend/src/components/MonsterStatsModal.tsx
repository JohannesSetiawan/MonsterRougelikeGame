import React, { useState, useEffect } from 'react';
import type { MonsterInstance } from '../api/types';
import MonsterStats from './MonsterStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { gameApi } from '../api/gameApi';

interface MonsterStatsModalProps {
  monster: MonsterInstance;
  onClose: () => void;
}

const MonsterStatsModal: React.FC<MonsterStatsModalProps> = ({ monster, onClose }) => {
  const [enrichedMonster, setEnrichedMonster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const enrichMonsterData = async () => {
      try {
        setLoading(true);
        
        // Fetch monster base data to get types
        const monsterData = await gameApi.getMonsterData(monster.monsterId);
        
        // Fetch ability data
        let abilityData = null;
        if (monster.ability) {
          try {
            abilityData = await gameApi.getAbilityData(monster.ability);
          } catch (err) {
            console.warn('Could not fetch ability data:', err);
          }
        }
        
        // Fetch move data
        const movePromises = monster.moves.map(async (moveId) => {
          try {
            const moveData = await gameApi.getMoveData(moveId);
            return {
              ...moveData,
              currentPp: monster.movePP[moveId] || moveData.pp,
              maxPp: moveData.pp
            };
          } catch (err) {
            console.warn(`Could not fetch move data for ${moveId}:`, err);
            return {
              id: moveId,
              name: moveId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              type: 'normal',
              category: 'physical',
              power: 50,
              accuracy: 100,
              pp: 20,
              description: 'Move data unavailable',
              currentPp: monster.movePP[moveId] || 20,
              maxPp: 20
            };
          }
        });
        
        const movesData = await Promise.all(movePromises);
        
        // Construct enriched monster data
        const enriched = {
          ...monster,
          types: monsterData?.type || ['normal'],
          sprite: monsterData?.sprite || '👾',
          abilities: abilityData ? [abilityData] : [],
          moves: movesData,
          experienceToNext: 1000 // Calculate based on level if needed
        };
        
        setEnrichedMonster(enriched);
      } catch (err) {
        console.error('Error enriching monster data:', err);
        setError('Failed to load monster details');
        
        // Fallback data with realistic defaults
        setEnrichedMonster({
          ...monster,
          types: ['normal'],
          sprite: '👾',
          abilities: [],
          moves: monster.moves.map((moveId, index) => ({
            id: moveId,
            name: moveId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            type: ['normal', 'fighting', 'fire', 'water', 'grass'][index % 5], // Rotate through types
            category: ['physical', 'special', 'status'][index % 3], // Rotate through categories
            power: [40, 60, 80, null][index % 4], // Some status moves have no power
            accuracy: [90, 95, 100][index % 3],
            pp: [15, 20, 25][index % 3],
            description: 'Move data unavailable',
            currentPp: monster.movePP[moveId] || 20,
            maxPp: 20
          })),
          experienceToNext: 1000
        });
      } finally {
        setLoading(false);
      }
    };

    enrichMonsterData();
  }, [monster]);

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Monster Details</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="text-4xl mb-4 animate-pulse">👾</div>
              <p className="text-muted-foreground">Loading monster details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !enrichedMonster) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Monster Details</DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              ×
            </Button>
          </DialogHeader>
          
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-muted-foreground mb-4">{error || 'Failed to load monster details'}</p>
              <Button onClick={onClose}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground">Monster Details</DialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            ×
          </Button>
        </DialogHeader>
        
        <div className="mt-4">
          <MonsterStats 
            monster={enrichedMonster as any}
            onAbilityClick={(abilityId) => {
              // Could implement ability details modal here
              console.log('Show ability details for:', abilityId);
            }}
            onMoveClick={(moveId) => {
              // Could implement move details modal here
              console.log('Show move details for:', moveId);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterStatsModal;
