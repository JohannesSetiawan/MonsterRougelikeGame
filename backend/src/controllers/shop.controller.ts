import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { GameService } from '../services/game.service';
import { DataLoaderService } from '../services/data-loader.service';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: string;
}

@Controller('shop')
export class ShopController {
  constructor(
    private gameService: GameService,
    private dataLoader: DataLoaderService
  ) {}

  @Get('items')
  getShopItems(): ShopItem[] {
    const allItems = this.dataLoader.getItems();
    
    // Filter items that are buyable and convert to ShopItem format
    return Object.values(allItems)
      .filter(item => item.isBuyable)
      .map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        type: item.type
      }));
  }

  @Post(':runId/buy')
  async buyItem(
    @Param('runId') runId: string,
    @Body() body: {
      itemId: string;
      quantity?: number;
    }
  ) {
    try {
      const run = this.gameService.getGameRun(runId);
      if (!run || !run.isActive) {
        throw new HttpException('Game run not found or not active', HttpStatus.BAD_REQUEST);
      }

      const allItems = this.dataLoader.getItems();
      const item = allItems[body.itemId];
      
      if (!item || !item.isBuyable) {
        throw new HttpException('Item not found in shop or not buyable', HttpStatus.BAD_REQUEST);
      }

      const quantity = body.quantity || 1;
      const totalCost = item.price * quantity;

      if (run.currency < totalCost) {
        throw new HttpException('Insufficient funds', HttpStatus.BAD_REQUEST);
      }

      // Deduct currency
      run.currency -= totalCost;

      // Add item to inventory
      const existingItem = run.inventory.find(invItem => invItem.id === body.itemId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        run.inventory.push({
          id: item.id,
          name: item.name,
          description: item.description,
          type: item.type,
          effect: item.effect,
          quantity: quantity,
          rarity: item.rarity || 'common'
        });
      }

      return {
        success: true,
        message: `Purchased ${quantity}x ${item.name} for ${totalCost} coins!`,
        run: run,
        remainingCurrency: run.currency
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
