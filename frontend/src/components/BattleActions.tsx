import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BattleActionsProps {
  onOpenBag: () => void;
  onFlee: () => void;
  onSwitch: () => void;
  isProcessing: boolean;
  battleEnded: boolean;
  canSwitch: boolean;
  isCommittedToTwoTurnMove?: boolean;
  mustRecharge?: boolean;
}

const BattleActions: React.FC<BattleActionsProps> = ({
  onOpenBag,
  onFlee,
  onSwitch,
  isProcessing,
  battleEnded,
  canSwitch,
  isCommittedToTwoTurnMove = false,
  mustRecharge = false
}) => {
  const isRestrictedByTwoTurnMove = isCommittedToTwoTurnMove || mustRecharge;
  return (
    <Card className="border-2 border-secondary/50">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        {isRestrictedByTwoTurnMove && (
          <p className="text-xs text-yellow-400 mt-1">
            {mustRecharge ? "Must recharge this turn!" : "Committed to two-turn move!"}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          onClick={onOpenBag}
          disabled={isProcessing || battleEnded || isRestrictedByTwoTurnMove}
          className="w-full"
        >
          🎒 Bag
        </Button>
        <Button
          variant="outline"
          onClick={onSwitch}
          disabled={isProcessing || battleEnded || !canSwitch || isRestrictedByTwoTurnMove}
          className="w-full"
        >
          🔄 Switch
        </Button>
        <Button
          variant="destructive"
          onClick={onFlee}
          disabled={isProcessing || battleEnded || isRestrictedByTwoTurnMove}
          className="w-full"
        >
          💨 Flee
        </Button>
      </CardContent>
    </Card>
  );
};

export default BattleActions;
