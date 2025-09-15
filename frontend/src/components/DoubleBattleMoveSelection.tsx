import React, { useState } from 'react';
import type { MonsterInstance, Move } from '../api/types';
import { cn } from '../lib/utils';
import TargetSelectionModal from './TargetSelectionModal';

interface DoubleBattleMoveSelectionProps {
  playerMonsters: MonsterInstance[];
  opponentMonsters: MonsterInstance[];
  movesData?: Record<string, Move>;
  onAttack: (attackerId: string, moveId: string, targetId?: string) => void;
  onMoveInfo: (moveId: string) => void;
  isProcessing: boolean;
  battleEnded: boolean;
}

const DoubleBattleMoveSelection: React.FC<DoubleBattleMoveSelectionProps> = ({
  playerMonsters,
  opponentMonsters,
  movesData,
  onAttack,
  onMoveInfo,
  isProcessing,
  battleEnded
}) => {
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);

  const alivePlayerMonsters = playerMonsters.filter(m => m.currentHp > 0);
  const aliveOpponentMonsters = opponentMonsters.filter(m => m.currentHp > 0);

  const handleMoveSelect = (attackerId: string, moveId: string) => {
    if (isProcessing || battleEnded) return;

    // In double battles, if there are multiple alive opponents, show target selection
    if (aliveOpponentMonsters.length > 1) {
      setSelectedAttacker(attackerId);
      setSelectedMove(moveId);
      setShowTargetSelection(true);
    } else if (aliveOpponentMonsters.length === 1) {
      // Only one opponent alive, target automatically
      onAttack(attackerId, moveId, aliveOpponentMonsters[0].id);
    } else {
      // No opponents alive (shouldn't happen in normal gameplay)
      onAttack(attackerId, moveId);
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (selectedAttacker && selectedMove) {
      onAttack(selectedAttacker, selectedMove, targetId);
    }
    setSelectedAttacker(null);
    setSelectedMove(null);
    setShowTargetSelection(false);
  };

  const handleCloseTargetSelection = () => {
    setSelectedAttacker(null);
    setSelectedMove(null);
    setShowTargetSelection(false);
  };

  const getAttackerName = () => {
    if (!selectedAttacker) return '';
    const attacker = alivePlayerMonsters.find(m => m.id === selectedAttacker);
    return attacker?.name || '';
  };

  const getMoveName = () => {
    if (!selectedMove || !movesData) return '';
    return movesData[selectedMove]?.name || selectedMove;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white text-center">
        Choose Attacker & Move
      </h3>

      {alivePlayerMonsters.map((monster) => (
        <div key={monster.id} className="bg-slate-800 rounded-lg border border-slate-600 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-white">{monster.name}</h4>
            <span className="text-sm text-slate-400">
              {monster.currentHp}/{monster.maxHp} HP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {monster.moves.map((moveId) => {
              const move = movesData?.[moveId];
              const currentPP = monster.movePP[moveId] || 0;
              const canUseMove = currentPP > 0 && !isProcessing && !battleEnded;

              return (
                <div key={moveId} className="relative">
                  <button
                    onClick={() => handleMoveSelect(monster.id, moveId)}
                    disabled={!canUseMove}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all duration-200",
                      canUseMove
                        ? "bg-blue-600 border-blue-500 hover:bg-blue-500 text-white"
                        : "bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed",
                      "relative group"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate pr-2">
                        {move?.name || moveId}
                      </span>
                      <span className="text-sm">
                        {currentPP}/{move?.pp || 0}
                      </span>
                    </div>
                    {move && (
                      <div className="text-xs opacity-75 mt-1">
                        {move.type} • {move.category}
                        {move.power > 0 && ` • ${move.power} power`}
                      </div>
                    )}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveInfo(moveId);
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-slate-600 hover:bg-slate-500 rounded-full flex items-center justify-center text-xs text-white transition-colors"
                    title="Move info"
                  >
                    ℹ
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <TargetSelectionModal
        isOpen={showTargetSelection}
        onClose={handleCloseTargetSelection}
        onSelectTarget={handleTargetSelect}
        availableTargets={aliveOpponentMonsters}
        attackerName={getAttackerName()}
        moveName={getMoveName()}
      />
    </div>
  );
};

export default DoubleBattleMoveSelection;