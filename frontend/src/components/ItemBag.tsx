import React, { useState } from 'react';
import type { Item } from '../api/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ItemInfo from './ItemInfo';

interface ItemBagProps {
  inventory: Item[];
  onUseItem: (itemId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const ItemBag: React.FC<ItemBagProps> = ({ inventory, onUseItem, onClose, isProcessing }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'healing': return '💊';
      case 'capture': return '⚪';
      case 'battle': return '⚔️';
      default: return '📦';
    }
  };

  const getItemTypeColor = (itemType: string) => {
    switch (itemType) {
      case 'healing': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'capture': return 'bg-red-500/20 text-red-700 border-red-500/50';
      case 'battle': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  const getItemDescription = (item: Item) => {
    // Always use the description from the item object (which comes from backend)
    return item.description || 'No description available';
  };

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      case 'uncommon': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'rare': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'legendary': return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  const usableItems = inventory.filter(item => item.quantity > 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl text-foreground flex items-center gap-2">
            🎒 Battle Items
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-6">
          {usableItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎒</div>
              <p className="text-muted-foreground text-lg">No usable items in your bag!</p>
              <p className="text-muted-foreground text-sm mt-2">
                Find items during your adventure or purchase them from shops.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usableItems.map((item) => (
                <Card key={item.id} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{getItemIcon(item.type)}</div>
                        <div>
                          <h4 className="font-semibold text-foreground">{item.name}</h4>
                          <div className="flex gap-2">
                            <Badge className={`text-xs ${getItemTypeColor(item.type)}`}>
                              {item.type}
                            </Badge>
                            {item.rarity && (
                              <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                                {item.rarity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="font-semibold">
                        x{item.quantity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {getItemDescription(item)}
                    </p>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onUseItem(item.id)}
                        disabled={isProcessing}
                        className="flex-1"
                        variant={item.type === 'healing' ? 'default' : item.type === 'capture' ? 'destructive' : 'secondary'}
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                            Using...
                          </>
                        ) : (
                          `Use ${item.name}`
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedItem(item.id)}
                        className="p-2"
                      >
                        ℹ️
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isProcessing} className="w-full md:w-auto">
            {isProcessing ? 'Processing...' : 'Close Bag'}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Item Info Modal */}
      {selectedItem && (
        <ItemInfo 
          itemId={selectedItem} 
          onClose={() => setSelectedItem(null)} 
        />
      )}
    </Dialog>
  );
};

export default ItemBag;
