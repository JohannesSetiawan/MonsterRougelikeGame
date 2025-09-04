import React from 'react';
import type { Item } from '../api/types';

interface ItemBagProps {
  inventory: Item[];
  onUseItem: (itemId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
}

const ItemBag: React.FC<ItemBagProps> = ({ inventory, onUseItem, onClose, isProcessing }) => {
  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'healing': return '💊';
      case 'capture': return '⚪';
      case 'battle': return '⚔️';
      default: return '📦';
    }
  };

  const getItemDescription = (item: Item) => {
    switch (item.id) {
      case 'potion':
        return 'Restores 50 HP to selected monster';
      case 'monster_ball':
        return 'Attempts to catch the opponent monster';
      default:
        return item.description;
    }
  };

  const usableItems = inventory.filter(item => item.quantity > 0);

  return (
    <div className="item-bag-overlay">
      <div className="item-bag">
        <div className="bag-header">
          <h3>Battle Items</h3>
          <button className="close-button" onClick={onClose} disabled={isProcessing}>
            ✕
          </button>
        </div>
        
        <div className="bag-content">
          {usableItems.length === 0 ? (
            <div className="empty-bag">
              <p>No usable items in your bag!</p>
            </div>
          ) : (
            <div className="items-grid">
              {usableItems.map((item) => (
                <div key={item.id} className="bag-item">
                  <div className="item-icon">{getItemIcon(item.type)}</div>
                  <div className="item-details">
                    <div className="item-name">{item.name}</div>
                    <div className="item-description">{getItemDescription(item)}</div>
                    <div className="item-quantity">x{item.quantity}</div>
                  </div>
                  <button
                    className="use-item-button"
                    onClick={() => onUseItem(item.id)}
                    disabled={isProcessing}
                  >
                    Use
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bag-footer">
          <button className="cancel-button" onClick={onClose} disabled={isProcessing}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemBag;
