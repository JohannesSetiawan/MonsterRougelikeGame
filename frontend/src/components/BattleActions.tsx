import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BattleActionsProps {
  onOpenBag: () => void;
  onFlee: () => void;
  isProcessing: boolean;
  battleEnded: boolean;
}

const BattleActions: React.FC<BattleActionsProps> = ({
  onOpenBag,
  onFlee,
  isProcessing,
  battleEnded
}) => {
  return (
    <Card className="border-2 border-secondary/50">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          onClick={onOpenBag}
          disabled={isProcessing || battleEnded}
          className="w-full"
        >
          🎒 Bag
        </Button>
        <Button
          variant="destructive"
          onClick={onFlee}
          disabled={isProcessing || battleEnded}
          className="w-full"
        >
          💨 Flee
        </Button>
      </CardContent>
    </Card>
  );
};

export default BattleActions;
