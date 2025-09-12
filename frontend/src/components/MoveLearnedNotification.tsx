import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface MoveLearnedNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  monsterName: string;
  learnedMoves: { id: string; name: string; type: string }[];
}

const MoveLearnedNotification: React.FC<MoveLearnedNotificationProps> = ({
  isOpen,
  onClose,
  monsterName,
  learnedMoves,
}) => {
  if (learnedMoves.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-green-700 dark:text-green-400">
            🎉 New Move{learnedMoves.length > 1 ? 's' : ''} Learned!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">{monsterName} learned:</p>
          </div>

          <div className="space-y-2">
            {learnedMoves.map((move) => (
              <div
                key={move.id}
                className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800"
              >
                <span className="font-semibold text-green-800 dark:text-green-200">
                  {move.name}
                </span>
                <Badge variant="secondary" className="bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200">
                  {move.type.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white px-8">
              Awesome!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoveLearnedNotification;
