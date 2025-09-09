import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getRarityColor } from '../utils/uiHelpers';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  rarity?: string;
  type?: string;
}

interface InventorySectionProps {
  inventory: InventoryItem[];
  onItemClick: (item: { id: string }) => void;
  onItemInfo: (itemId: string) => void;
  processingItemId: string | null;
  isLoading: boolean;
}

export const InventorySection: React.FC<InventorySectionProps> = ({
  inventory,
  onItemClick,
  onItemInfo,
  processingItemId,
  isLoading
}) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-xl">Inventory</CardTitle>
      </CardHeader>
      <CardContent>
        {inventory.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No items in inventory</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inventory.map((item) => (
              <Card key={item.id} className="border border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{item.name}</h4>
                      {item.rarity && (
                        <Badge className={`text-xs mt-1 ${getRarityColor(item.rarity)}`}>
                          {item.rarity}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        x{item.quantity}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onItemInfo(item.id)}
                        className="p-1 h-6 w-6"
                      >
                        ℹ️
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  {(item.type === 'healing' || 
                    item.id === 'rare_candy' || 
                    item.id === 'elixir' || 
                    item.id === 'max_elixir' ||
                    item.type === 'permanent') && (
                    <Button 
                      size="sm"
                      onClick={() => onItemClick(item)}
                      disabled={processingItemId === item.id || isLoading}
                      className="w-full"
                    >
                      {processingItemId === item.id ? 'Using...' : 'Use Item'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
