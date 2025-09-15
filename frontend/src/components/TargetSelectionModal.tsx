import React from 'react';
import type { MonsterInstance } from '../api/types';
import { cn } from '../lib/utils';

interface TargetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTarget: (targetId: string) => void;
  availableTargets: MonsterInstance[];
  attackerName: string;
  moveName: string;
}

const TargetSelectionModal: React.FC<TargetSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTarget,
  availableTargets,
  attackerName,
  moveName
}) => {
  if (!isOpen) return null;

  const handleTargetSelect = (targetId: string) => {
    onSelectTarget(targetId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-800 rounded-lg border border-slate-600 max-w-md w-full">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4 text-center">
            Choose Target
          </h2>
          
          <p className="text-slate-300 text-center mb-6">
            {attackerName} wants to use {moveName}. Choose which opponent to target:
          </p>

          <div className="space-y-3">
            {availableTargets
              .filter(target => target.currentHp > 0)
              .map((target) => {
                const hpPercentage = (target.currentHp / target.maxHp) * 100;
                
                return (
                  <button
                    key={target.id}
                    onClick={() => handleTargetSelect(target.id)}
                    className={cn(
                      "w-full p-4 rounded-lg border transition-all duration-200",
                      "bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500",
                      "text-left"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{target.name}</h3>
                        <p className="text-sm text-slate-400">{target.monsterId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {target.currentHp}/{target.maxHp} HP
                        </p>
                        <div className="w-24 h-2 bg-slate-600 rounded-full mt-1">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-300",
                              hpPercentage > 50 ? "bg-green-500" :
                              hpPercentage > 25 ? "bg-yellow-500" : "bg-red-500"
                            )}
                            style={{ width: `${Math.max(0, hpPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TargetSelectionModal;