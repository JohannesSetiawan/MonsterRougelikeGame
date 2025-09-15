import React from 'react';
import type { MonsterInstance } from '../api/types';
import BattleMonsterCard from './BattleMonsterCard';
import { cn } from '../lib/utils';

interface DoubleBattleFieldProps {
  playerMonsters: MonsterInstance[];
  opponentMonsters: MonsterInstance[];
  playerGoesFirst: boolean;
  showTurnOrder: boolean;
  criticalHitEffect: 'player' | 'opponent' | null;
  onPlayerStatsClick: (monsterId: string) => void;
  onOpponentStatsClick: (monsterId: string) => void;
  onAbilityClick: (abilityId: string) => void;
  isProcessing: boolean;
  shouldDeferUpdates: boolean;
}

const DoubleBattleField: React.FC<DoubleBattleFieldProps> = ({
  playerMonsters,
  opponentMonsters,
  playerGoesFirst,
  showTurnOrder,
  criticalHitEffect,
  onPlayerStatsClick,
  onOpponentStatsClick,
  onAbilityClick,
  isProcessing,
  shouldDeferUpdates
}) => {
  // Add safety checks for undefined monsters
  const safePlayerMonsters = playerMonsters.filter(m => m != null);
  const safeOpponentMonsters = opponentMonsters.filter(m => m != null);
  
  const alivePlayerMonsters = safePlayerMonsters.filter(m => m.currentHp > 0);
  const aliveOpponentMonsters = safeOpponentMonsters.filter(m => m.currentHp > 0);

  return (
    <div className="space-y-6">
      {/* Opponent Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safeOpponentMonsters.map((monster, index) => (
          <div key={monster.id || `opponent-${index}`} className={cn(
            "transition-opacity duration-300",
            monster.currentHp <= 0 && "opacity-50"
          )}>
            <BattleMonsterCard
              monster={monster}
              isPlayer={false}
              goesFirst={!playerGoesFirst}
              showTurnOrder={showTurnOrder}
              criticalHitEffect={criticalHitEffect}
              onStatsClick={() => onOpponentStatsClick(monster.id)}
              onAbilityClick={onAbilityClick}
              isProcessing={isProcessing}
              shouldDeferUpdates={shouldDeferUpdates}
            />
            {monster.currentHp <= 0 && (
              <div className="text-center mt-2">
                <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                  Fainted
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Battle Field Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-slate-900 text-slate-400 font-medium">
            VS
          </span>
        </div>
      </div>

      {/* Player Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {safePlayerMonsters.map((monster, index) => (
          <div key={monster.id || `player-${index}`} className={cn(
            "transition-opacity duration-300",
            monster.currentHp <= 0 && "opacity-50"
          )}>
            <BattleMonsterCard
              monster={monster}
              isPlayer={true}
              goesFirst={playerGoesFirst}
              showTurnOrder={showTurnOrder}
              criticalHitEffect={criticalHitEffect}
              onStatsClick={() => onPlayerStatsClick(monster.id)}
              onAbilityClick={onAbilityClick}
              isProcessing={isProcessing}
              shouldDeferUpdates={shouldDeferUpdates}
            />
            {monster.currentHp <= 0 && (
              <div className="text-center mt-2">
                <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                  Fainted
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Battle Status */}
      <div className="text-center text-sm text-slate-400">
        <p>
          Player: {alivePlayerMonsters.length}/{safePlayerMonsters.length} active | 
          Opponent: {aliveOpponentMonsters.length}/{safeOpponentMonsters.length} active
        </p>
      </div>
    </div>
  );
};

export default DoubleBattleField;