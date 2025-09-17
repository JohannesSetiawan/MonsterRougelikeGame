import React, { useState } from 'react';
import type { Item, MonsterInstance } from '../api/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ItemInfo from './ItemInfo';
import MoveSelectionModal from './MoveSelectionModal';
import MonsterSelectionModal from './MonsterSelectionModal';

interface ItemBagProps {
  inventory: Item[];
  onUseItem: (itemId: string, targetMoveId?: string, targetMonsterId?: string) => void;
  onClose: () => void;
  isProcessing: boolean;
  inBattle?: boolean;
  activeMonster?: any; // For move selection in battle
  movesData?: Record<string, any>; // For move selection
  team?: MonsterInstance[]; // For monster selection in battle
}

const ItemBag: React.FC<ItemBagProps> = ({ 
  inventory, 
  onUseItem, 
  onClose, 
  isProcessing, 
  inBattle = false, 
  activeMonster, 
  movesData = {},
  team = []
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showMoveSelection, setShowMoveSelection] = useState<string | null>(null);
  const [showMonsterSelection, setShowMonsterSelection] = useState<string | null>(null);
  
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

  // Filter items based on battle context
  const getUsableItems = () => {
    let filteredItems = inventory.filter(item => item.quantity > 0);
    
    if (inBattle) {
      // In battle: exclude non-battle items like rare candy
      filteredItems = filteredItems.filter(item => {
        // Allow healing items, capture items, and battle items
        if (item.type === 'healing' || item.type === 'capture' || item.type === 'battle') {
          // But exclude rare candy specifically
          return item.id !== 'rare_candy';
        }
        return false;
      });
    }
    
    return filteredItems;
  };

  const handleItemUse = (item: Item) => {
    // Items that require move selection (only ether items, not elixir items)
    const moveSelectionItems = ['ether', 'max_ether'];
    // Items that require monster selection when in battle
    const healingItems = ['potion', 'super_potion', 'hyper_potion', 'max_potion'];
    
    if (moveSelectionItems.includes(item.id)) {
      setShowMoveSelection(item.id);
    } else if (inBattle && healingItems.includes(item.id)) {
      setShowMonsterSelection(item.id);
    } else {
      onUseItem(item.id);
    }
  };

  const handleMoveSelection = (itemId: string, moveId: string) => {
    setShowMoveSelection(null);
    onUseItem(itemId, moveId);
  };

  const handleMonsterSelection = (itemId: string, monsterId: string) => {
    setShowMonsterSelection(null);
    onUseItem(itemId, undefined, monsterId);
  };

  const usableItems = getUsableItems();

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
                        onClick={() => handleItemUse(item)}
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

      {/* Move Selection Modal for items that target moves */}
      {showMoveSelection && activeMonster && (
        <MoveSelectionModal
          monster={activeMonster}
          movesData={movesData}
          itemName={usableItems.find(item => item.id === showMoveSelection)?.name || showMoveSelection}
          onSelectMove={(moveId) => handleMoveSelection(showMoveSelection, moveId)}
          onClose={() => setShowMoveSelection(null)}
          isProcessing={isProcessing}
        />
      )}

      {/* Monster Selection Modal for healing items in battle */}
      {showMonsterSelection && team.length > 0 && (
        <MonsterSelectionModal
          monsters={team}
          itemName={usableItems.find(item => item.id === showMonsterSelection)?.name || showMonsterSelection}
          itemType="healing"
          onSelectMonster={(monsterId) => handleMonsterSelection(showMonsterSelection, monsterId)}
          onClose={() => setShowMonsterSelection(null)}
          isProcessing={isProcessing}
        />
      )}
    </Dialog>
  );
};

export default ItemBag;
