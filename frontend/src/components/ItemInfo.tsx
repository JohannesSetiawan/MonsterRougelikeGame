import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { useItemsData } from '../hooks/useItemsData';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ItemInfoProps {
  itemId: string;
  onClose: () => void;
}

const ItemInfo: React.FC<ItemInfoProps> = ({ itemId, onClose }) => {
  const [itemData, setItemData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getItemById } = useItemsData();

  useEffect(() => {
    const loadItemData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First try to get data from the specific item API endpoint
        const data = await gameApi.getItemData(itemId);
        setItemData(data);
      } catch (err) {
        console.error('Error loading item data:', err);
        
        // Fallback to using the items data from the hook (getAllItems)
        const fallbackData = getItemById(itemId);
        if (fallbackData) {
          setItemData(fallbackData);
        } else {
          setError('Failed to load item data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadItemData();
  }, [itemId]); // Remove getItemById from dependencies to prevent infinite loop

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'healing': return '💊';
      case 'capture': return '⚪';
      case 'battle': return '⚔️';
      case 'misc': return '📦';
      default: return '📦';
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      healing: 'bg-green-500 hover:bg-green-600',
      capture: 'bg-red-500 hover:bg-red-600',
      battle: 'bg-blue-500 hover:bg-blue-600',
      misc: 'bg-purple-500 hover:bg-purple-600'
    };
    return colors[type] || 'bg-gray-500 hover:bg-gray-600';
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      common: 'bg-gray-500 hover:bg-gray-600',
      uncommon: 'bg-green-500 hover:bg-green-600',
      rare: 'bg-blue-500 hover:bg-blue-600',
      legendary: 'bg-purple-500 hover:bg-purple-600'
    };
    return colors[rarity] || 'bg-gray-500 hover:bg-gray-600';
  };

  if (loading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading item data...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !itemData) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Error</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-muted-foreground mb-4">{error || 'Item not found'}</p>
            <div className="space-x-2">
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Retry
              </Button>
              <Button onClick={onClose} className="w-full">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-background text-foreground">
        <DialogHeader>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">{getItemIcon(itemData.type)}</div>
              <DialogTitle className="text-xl text-foreground">{itemData.name}</DialogTitle>
            </div>
            <div className="flex gap-2">
              <Badge className={`text-white font-semibold ${getTypeColor(itemData.type)}`}>
                {itemData.type.toUpperCase()}
              </Badge>
              {itemData.rarity && (
                <Badge className={`text-white font-semibold ${getRarityColor(itemData.rarity)}`}>
                  {itemData.rarity.toUpperCase()}
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Description</h4>
            <p className="text-muted-foreground leading-relaxed">{itemData.description}</p>
          </div>

          {/* Effect */}
          {itemData.effect && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Effect</h4>
              <Card className="bg-primary/10 border-primary/30">
                <CardContent className="p-3">
                  <p className="text-sm text-foreground">{itemData.effect}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Value */}
          {itemData.value && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">Value</h4>
              <Badge variant="secondary" className="text-sm">
                💰 {itemData.value} coins
              </Badge>
            </div>
          )}

          {/* Usage Tips */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">Usage</h4>
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="text-sm text-muted-foreground">
                  {itemData.type === 'healing' && 'Use this item to restore your monster\'s health points.'}
                  {itemData.type === 'capture' && 'Use this item to attempt to capture wild monsters.'}
                  {itemData.type === 'battle' && 'Use this item during battle for strategic advantages.'}
                  {itemData.type === 'misc' && 'This item has special effects and usage requirements.'}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ItemInfo;
