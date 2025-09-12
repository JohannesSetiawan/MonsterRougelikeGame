import React, { useState, useEffect } from 'react';
import type { MoveLearnEvent, MonsterInstance, Move } from '../api/types';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

interface MoveLearningModalProps {
  isOpen: boolean;
  onClose: () => void;
  moveLearnEvent: MoveLearnEvent;
  monster: MonsterInstance;
  allMoves: Record<string, Move>;
  onMoveSelection: (learnMove: boolean, moveToReplace?: string) => void;
}

const MoveLearningModal: React.FC<MoveLearningModalProps> = ({
  isOpen,
  onClose,
  moveLearnEvent,
  monster,
  allMoves,
  onMoveSelection,
}) => {
  const [selectedMoveToReplace, setSelectedMoveToReplace] = useState<string>('');
  const [showMoveDetails, setShowMoveDetails] = useState<string>('');

  const newMove = allMoves[moveLearnEvent.newMove];
  const canLearnDirectly = moveLearnEvent.canLearn;

  useEffect(() => {
    if (isOpen) {
      setSelectedMoveToReplace('');
      setShowMoveDetails('');
    }
  }, [isOpen]);

  const handleLearnMove = () => {
    if (canLearnDirectly) {
      onMoveSelection(true);
    } else if (selectedMoveToReplace) {
      onMoveSelection(true, selectedMoveToReplace);
    }
  };

  const handleSkipLearning = () => {
    onMoveSelection(false);
  };

  if (!newMove) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {monster.name} wants to learn a new move!
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Choose whether to learn {newMove.name} or keep the current moves
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* New Move Card */}
          <Card className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200">
                  New Move: {newMove.name}
                </h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Level {moveLearnEvent.level}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoveDetails(showMoveDetails === moveLearnEvent.newMove ? '' : moveLearnEvent.newMove)}
                className="mb-2"
              >
                {showMoveDetails === moveLearnEvent.newMove ? 'Hide Details' : 'Show Details'}
              </Button>
              {showMoveDetails === moveLearnEvent.newMove && (
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Type:</strong> {newMove.type.toUpperCase()}</div>
                    <div><strong>Category:</strong> {newMove.category.toUpperCase()}</div>
                    <div><strong>Power:</strong> {newMove.power || 'N/A'}</div>
                    <div><strong>Accuracy:</strong> {newMove.accuracy}%</div>
                    <div><strong>PP:</strong> {newMove.pp}</div>
                    <div><strong>Effect:</strong> {newMove.effect || 'None'}</div>
                  </div>
                  <p className="mt-2 text-sm">{newMove.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Moves */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {canLearnDirectly ? 'Current Moves:' : 'Choose a move to replace:'}
            </h3>
            <div className="grid gap-3">
              {monster.moves.map((moveId) => {
                const move = allMoves[moveId];
                if (!move) return null;

                const isSelected = selectedMoveToReplace === moveId;
                const canSelect = !canLearnDirectly;

                return (
                  <Card 
                    key={moveId}
                    className={`cursor-pointer transition-all ${
                      canSelect
                        ? isSelected
                          ? 'border-2 border-red-500 bg-red-50 dark:bg-red-950'
                          : 'hover:border-gray-400 border-2 border-transparent'
                        : 'border border-gray-300'
                    }`}
                    onClick={() => {
                      if (canSelect) {
                        setSelectedMoveToReplace(isSelected ? '' : moveId);
                      }
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{move.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {move.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {monster.movePP[moveId] || 0}/{move.pp} PP
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {move.description}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMoveDetails(showMoveDetails === moveId ? '' : moveId);
                        }}
                      >
                        {showMoveDetails === moveId ? 'Hide Details' : 'Show Details'}
                      </Button>
                      {showMoveDetails === moveId && (
                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><strong>Type:</strong> {move.type.toUpperCase()}</div>
                            <div><strong>Category:</strong> {move.category.toUpperCase()}</div>
                            <div><strong>Power:</strong> {move.power || 'N/A'}</div>
                            <div><strong>Accuracy:</strong> {move.accuracy}%</div>
                            <div><strong>PP:</strong> {move.pp}</div>
                            <div><strong>Effect:</strong> {move.effect || 'None'}</div>
                          </div>
                          <p className="mt-2 text-sm">{move.description}</p>
                        </div>
                      )}
                      {isSelected && (
                        <Badge className="mt-2 bg-red-500 text-white">
                          Will be replaced
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {canLearnDirectly ? (
              <>
                <Button
                  onClick={handleLearnMove}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Learn {newMove.name}
                </Button>
                <Button
                  onClick={handleSkipLearning}
                  variant="outline"
                  className="flex-1"
                >
                  Don't Learn
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={handleLearnMove}
                  disabled={!selectedMoveToReplace}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                >
                  {selectedMoveToReplace
                    ? `Replace ${allMoves[selectedMoveToReplace]?.name || 'Selected Move'}`
                    : 'Select a move to replace'
                  }
                </Button>
                <Button
                  onClick={handleSkipLearning}
                  variant="outline"
                  className="flex-1"
                >
                  Don't Learn
                </Button>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="text-sm text-gray-600 dark:text-gray-400 text-center p-3 bg-gray-100 dark:bg-gray-800 rounded">
            {canLearnDirectly ? (
              <>
                <p>{monster.name} has room to learn {newMove.name}!</p>
              </>
            ) : (
              <>
                <p>{monster.name} wants to learn {newMove.name}, but already knows 4 moves.</p>
                <p>Select a move to replace, or choose not to learn the new move.</p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveLearningModal;
