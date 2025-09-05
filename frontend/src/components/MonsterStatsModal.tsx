import React, { useState, useEffect } from 'react';
import type { MonsterInstance } from '../api/types';
import MonsterStats from './MonsterStats';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { gameApi } from '../api/gameApi';
import AbilityInfo from './AbilityInfo';
import MoveInfo from './MoveInfo';

interface MonsterStatsModalProps {
  monster: MonsterInstance;
  onClose: () => void;
}

const MonsterStatsModal: React.FC<MonsterStatsModalProps> = ({ monster, onClose }) => {
  const [enrichedMonster, setEnrichedMonster] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);

  useEffect(() => {
    const enrichMonsterData = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
        
        // Fetch move data - Wait for all API calls to complete or fail
        const movePromises = monster.moves.map(async (moveId) => {
          const moveData = await gameApi.getMoveData(moveId);
          return {
            ...moveData,
            currentPp: monster.movePP[moveId] || moveData.pp,
            maxPp: moveData.pp
          };
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
        setError('Failed to load monster details. Please try again.');
        // Don't set fallback data - let the error state handle it
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
          </DialogHeader>
          
          <div className="flex justify-center items-center py-8">
            <div className="text-center space-y-4">
              <div className="text-4xl mb-4">❌</div>
              <p className="text-muted-foreground mb-4">{error || 'Failed to load monster details'}</p>
              <div className="space-x-2">
                <Button onClick={() => window.location.reload()} variant="outline">
                  Retry
                </Button>
                <Button onClick={onClose}>Close</Button>
              </div>
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
        </DialogHeader>
        
        <div className="mt-4">
          <MonsterStats 
            monster={enrichedMonster as any}
            onAbilityClick={(abilityId) => {
              setSelectedAbility(abilityId);
            }}
            onMoveClick={(moveId) => {
              setSelectedMove(moveId);
            }}
          />
        </div>
      </DialogContent>

      {/* Modals */}
      {selectedAbility && (
        <AbilityInfo 
          abilityId={selectedAbility} 
          onClose={() => setSelectedAbility(null)} 
        />
      )}

      {selectedMove && (
        <MoveInfo 
          moveId={selectedMove} 
          onClose={() => setSelectedMove(null)} 
        />
      )}
    </Dialog>
  );
};

export default MonsterStatsModal;
