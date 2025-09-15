import React, { useState } from 'react';
import type { MonsterInstance, Move } from '../api/types';
import { cn } from '../lib/utils';
import TargetSelectionModal from './TargetSelectionModal';
import { useDoubleBattleActions, type DoubleBattleAction } from '../hooks/useDoubleBattleActions';

interface DoubleBattleMoveSelectionProps {
  playerMonsters: MonsterInstance[];
  opponentMonsters: MonsterInstance[];
  movesData?: Record<string, Move>;
  onExecuteActions: (actions: DoubleBattleAction[]) => void;
  onMoveInfo: (moveId: string) => void;
  isProcessing: boolean;
  battleEnded: boolean;
}

const DoubleBattleMoveSelection: React.FC<DoubleBattleMoveSelectionProps> = ({
  playerMonsters,
  opponentMonsters,
  movesData,
  onExecuteActions,
  onMoveInfo,
  isProcessing,
  battleEnded
}) => {
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [showTargetSelection, setShowTargetSelection] = useState(false);

  const aliveOpponentMonsters = opponentMonsters.filter(m => m.currentHp > 0);
  
  // Use double battle actions hook
  const {
    isSelectionPhase,
    allActionsSelected,
    alivePlayerMonsters,
    selectAction,
    clearAction,
    executeActions,
    getSelectedAction,
    getActionSummary
  } = useDoubleBattleActions({
    playerMonsters,
    isProcessing,
    battleEnded,
    onExecuteActions
  });

  const handleMoveSelect = (attackerId: string, moveId: string) => {
    if (isProcessing || battleEnded || !isSelectionPhase) return;

    // In double battles, if there are multiple alive opponents, show target selection
    if (aliveOpponentMonsters.length > 1) {
      setSelectedAttacker(attackerId);
      setSelectedMove(moveId);
      setShowTargetSelection(true);
    } else if (aliveOpponentMonsters.length === 1) {
      // Only one opponent alive, target automatically
      selectAction({
        monsterId: attackerId,
        type: 'attack',
        moveId,
        targetId: aliveOpponentMonsters[0].id
      });
    } else {
      // No opponents alive (shouldn't happen in normal gameplay)
      selectAction({
        monsterId: attackerId,
        type: 'attack',
        moveId
      });
    }
  };

  const handleTargetSelect = (targetId: string) => {
    if (selectedAttacker && selectedMove) {
      selectAction({
        monsterId: selectedAttacker,
        type: 'attack',
        moveId: selectedMove,
        targetId
      });
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

  // Get action summary for display
  const actionSummary = getActionSummary();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white">
          Choose Actions for Both Monsters
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          Select moves for each monster, then execute all actions together
        </p>
      </div>

      {/* Action Summary */}
      <div className="bg-slate-700 rounded-lg p-3 border border-slate-600">
        <h4 className="text-white font-medium mb-2">Selected Actions:</h4>
        <div className="space-y-1">
          {actionSummary.map(({ monster, action, hasSelected }) => (
            <div key={monster.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{monster.name}:</span>
              <span className={cn(
                hasSelected ? "text-green-400" : "text-slate-500"
              )}>
                {hasSelected 
                  ? `${action?.type === 'attack' ? 'Attack' : 'Action'} selected`
                  : 'Waiting for action...'
                }
              </span>
            </div>
          ))}
        </div>
        {allActionsSelected && (
          <button
            onClick={executeActions}
            disabled={isProcessing || !isSelectionPhase}
            className="w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Execute All Actions
          </button>
        )}
      </div>

      {alivePlayerMonsters.map((monster) => {
        const hasSelectedAction = getSelectedAction(monster.id) !== undefined;
        const selectedAction = getSelectedAction(monster.id);
        return (
        <div key={monster.id} className={cn(
          "bg-slate-800 rounded-lg border p-4 transition-colors",
          hasSelectedAction 
            ? "border-green-500 bg-slate-700" 
            : "border-slate-600"
        )}>
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
          
          {/* Show selected action */}
          {hasSelectedAction && (
            <div className="mt-3 px-3 py-2 bg-green-800 rounded text-sm text-green-100">
              ✓ Action selected: {selectedAction?.type === 'attack' ? 'Attack' : 'Action'}
              {selectedAction?.type === 'attack' && (
                <button
                  onClick={() => clearAction(monster.id)}
                  disabled={isProcessing || !isSelectionPhase}
                  className="ml-2 text-red-300 hover:text-red-200 disabled:opacity-50"
                >
                  (Change)
                </button>
              )}
            </div>
          )}
        </div>
        );
      })}

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