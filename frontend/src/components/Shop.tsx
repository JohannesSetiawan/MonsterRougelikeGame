import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
}

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: number;
  onPurchase: (itemId: string, quantity: number, totalCost: number) => Promise<void>;
}

const Shop: React.FC<ShopProps> = ({
  isOpen,
  onClose,
  currentCurrency,
  onPurchase
}) => {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, number>>({});
  const [processingPurchase, setProcessingPurchase] = useState<string | null>(null);

  useEffect(() => {
    const loadShopItems = async () => {
      try {
        setIsLoading(true);
        const items = await gameApi.getShopItems();
        setShopItems(items);
        
        // Initialize quantities
        const initialQuantities: Record<string, number> = {};
        items.forEach(item => {
          initialQuantities[item.id] = 1;
        });
        setPurchaseQuantities(initialQuantities);
      } catch (error) {
        ErrorHandler.handle(error, 'Shop.loadShopItems');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadShopItems();
    }
  }, [isOpen]);

  const handleQuantityChange = (itemId: string, delta: number) => {
    setPurchaseQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(1, Math.min(99, (prev[itemId] || 1) + delta))
    }));
  };

  const handlePurchase = async (item: ShopItem) => {
    if (processingPurchase) return;
    
    const quantity = purchaseQuantities[item.id] || 1;
    const totalCost = item.price * quantity;
    
    if (currentCurrency < totalCost) {
      alert('Insufficient funds!');
      return;
    }

    setProcessingPurchase(item.id);
    try {
      await onPurchase(item.id, quantity, totalCost);
      alert(`Successfully purchased ${quantity}x ${item.name} for ${totalCost} coins!`);
    } catch (error) {
      ErrorHandler.handle(error, 'Shop.handlePurchase');
      alert('Purchase failed. Please try again.');
    } finally {
      setProcessingPurchase(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'healing': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'battle': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'misc': return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'healing': return '💊';
      case 'battle': return '⚔️';
      case 'misc': return '📦';
      default: return '📦';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            🏪 Monster Shop
          </DialogTitle>
          <div className="flex items-center gap-2 text-lg">
            <span>Your Coins:</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              💰 {currentCurrency}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p>Loading shop items...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shopItems.map((item) => {
                const quantity = purchaseQuantities[item.id] || 1;
                const totalCost = item.price * quantity;
                const canAfford = currentCurrency >= totalCost;
                const isProcessing = processingPurchase === item.id;

                return (
                  <Card key={item.id} className={`border ${canAfford ? 'border-border/50' : 'border-red-500/50'}`}>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getTypeIcon(item.type)}</span>
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <Badge className={`text-xs ${getTypeColor(item.type)}`}>
                              {item.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Price:</span>
                            <Badge variant="outline" className="text-sm">
                              💰 {item.price} coins
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Quantity Selector */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, -1)}
                              disabled={quantity <= 1 || isProcessing}
                              className="h-8 w-8 p-0"
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-mono">{quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(item.id, 1)}
                              disabled={quantity >= 99 || isProcessing}
                              className="h-8 w-8 p-0"
                            >
                              +
                            </Button>
                          </div>
                        </div>

                        {/* Total Cost */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Total Cost:</span>
                          <Badge 
                            variant="outline" 
                            className={`text-sm ${canAfford ? 'text-green-600' : 'text-red-600'}`}
                          >
                            💰 {totalCost} coins
                          </Badge>
                        </div>

                        {/* Purchase Button */}
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={!canAfford || isProcessing}
                          className="w-full"
                          variant={canAfford ? 'default' : 'destructive'}
                        >
                          {isProcessing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                              Purchasing...
                            </>
                          ) : canAfford ? (
                            `Buy ${quantity}x for ${totalCost} coins`
                          ) : (
                            'Insufficient Funds'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Shop
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Shop;
