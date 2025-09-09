import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PermanentItemsSectionProps {
  permanentItems: string[];
}

export const PermanentItemsSection: React.FC<PermanentItemsSectionProps> = ({
  permanentItems
}) => {
  if (!permanentItems || permanentItems.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-purple-500/50 bg-purple-950/20">
      <CardHeader>
        <CardTitle className="text-xl text-purple-200 flex items-center gap-2">
          ✨ Active Permanent Effects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {Object.entries(
            permanentItems.reduce((acc, itemId) => {
              acc[itemId] = (acc[itemId] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([itemId, count]) => {
            if (itemId === 'luck_charm') {
              return (
                <Badge key={itemId} className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                  🍀 Luck Charm x{count} (Shiny Rate: {Math.pow(2, count)}x)
                </Badge>
              );
            }
            return (
              <Badge key={itemId} className="bg-purple-500/20 text-purple-300 border-purple-500/50">
                {itemId} x{count}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
