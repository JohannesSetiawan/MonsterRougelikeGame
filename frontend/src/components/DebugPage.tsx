import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { debugApi } from '../api/debugApi';
import type { AvailableMonster, AvailableItem, AvailableMove, LearnableMovesResponse } from '../api/debugApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface DebugPageProps {
  onClose: () => void;
}

const DebugPage: React.FC<DebugPageProps> = ({ onClose }) => {
  const { state, dispatch } = useGame();
  const [availableMonsters, setAvailableMonsters] = useState<AvailableMonster[]>([]);
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [availableMoves, setAvailableMoves] = useState<AvailableMove[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'team' | 'inventory' | 'moves' | 'general'>('team');
  
  // Move learning states
  const [selectedMonsterForMoves, setSelectedMonsterForMoves] = useState<string>('');
  const [learnableMovesData, setLearnableMovesData] = useState<LearnableMovesResponse | null>(null);
  const [selectedMoveToLearn, setSelectedMoveToLearn] = useState<string>('');
  const [selectedMoveToReplace, setSelectedMoveToReplace] = useState<string>('');

  // Form states
  const [newStage, setNewStage] = useState<string>('');
  const [currencyAmount, setCurrencyAmount] = useState<string>('100');
  const [selectedMonsterId, setSelectedMonsterId] = useState<string>('');
  const [monsterLevel, setMonsterLevel] = useState<string>('5');
  const [monsterShiny, setMonsterShiny] = useState<boolean>(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<string>('1');
  const [levelUpAmount, setLevelUpAmount] = useState<string>('1');

  useEffect(() => {
    loadAvailableData();
  }, []);

  const loadAvailableData = async () => {
    try {
      const [monsters, items, moves] = await Promise.all([
        debugApi.getAvailableMonsters(),
        debugApi.getAvailableItems(),
        debugApi.getAvailableMoves()
      ]);
      setAvailableMonsters(monsters);
      setAvailableItems(items);
      setAvailableMoves(moves);
    } catch (error) {
      setMessage('Failed to load available data');
    }
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

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const executeDebugAction = async (action: () => Promise<any>, successMessage: string) => {
    if (!state.currentRun || isLoading) return;

    setIsLoading(true);
    try {
      const result = await action();
      if (result.run) {
        dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      }
      showMessage(result.message || successMessage);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMonster = () => {
    if (!selectedMonsterId) {
      showMessage('Please select a monster');
      return;
    }

    executeDebugAction(
      () => debugApi.addMonsterToTeam(state.currentRun!.id, {
        monsterId: selectedMonsterId,
        level: parseInt(monsterLevel) || 5,
        isShiny: monsterShiny
      }),
      'Monster added to team!'
    );
  };

  const handleAddCurrency = () => {
    const amount = parseInt(currencyAmount);
    if (!amount || amount <= 0) {
      showMessage('Please enter a valid amount');
      return;
    }

    executeDebugAction(
      () => debugApi.addCurrency(state.currentRun!.id, amount),
      `Added ${amount} currency!`
    );
  };

  const handleAddItem = () => {
    if (!selectedItemId) {
      showMessage('Please select an item');
      return;
    }

    executeDebugAction(
      () => debugApi.addItem(state.currentRun!.id, selectedItemId, parseInt(itemQuantity) || 1),
      'Item added to inventory!'
    );
  };

  const handleSetStage = () => {
    const stage = parseInt(newStage);
    if (!stage || stage < 1) {
      showMessage('Please enter a valid stage number');
      return;
    }

    executeDebugAction(
      () => debugApi.setStage(state.currentRun!.id, stage),
      `Stage set to ${stage}!`
    );
  };

  const handleHealTeam = () => {
    executeDebugAction(
      () => debugApi.healTeam(state.currentRun!.id),
      'Team fully healed!'
    );
  };

  const handleLevelUpMonster = (monsterId: string) => {
    const levels = parseInt(levelUpAmount) || 1;
    executeDebugAction(
      () => debugApi.levelUpMonster(state.currentRun!.id, monsterId, levels),
      `Monster leveled up ${levels} time(s)!`
    );
  };

  const handleRemoveMonster = (monsterId: string) => {
    if (state.currentRun && state.currentRun.team.length <= 1) {
      showMessage('Cannot remove the last monster from team');
      return;
    }

    executeDebugAction(
      () => debugApi.removeMonster(state.currentRun!.id, monsterId),
      'Monster removed from team!'
    );
  };

  const handleToggleShiny = (monsterId: string) => {
    executeDebugAction(
      () => debugApi.toggleMonsterShiny(state.currentRun!.id, monsterId),
      'Monster shiny status toggled!'
    );
  };

  const handleClearInventory = () => {
    executeDebugAction(
      () => debugApi.clearInventory(state.currentRun!.id),
      'Inventory cleared!'
    );
  };

  const loadLearnableMoves = async (monsterId: string) => {
    if (!state.currentRun) return;
    
    setIsLoading(true);
    try {
      const data = await debugApi.getLearnableMoves(state.currentRun.id, monsterId);
      setLearnableMovesData(data);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Failed to load learnable moves');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMonsterSelectForMoves = (monsterId: string) => {
    setSelectedMonsterForMoves(monsterId);
    setLearnableMovesData(null);
    if (monsterId) {
      loadLearnableMoves(monsterId);
    }
  };

  const handleLearnMove = () => {
    if (!selectedMoveToLearn || !selectedMonsterForMoves) {
      showMessage('Please select a monster and move');
      return;
    }

    // Check if monster already has 4 moves and no replacement is selected
    const monster = state.currentRun?.team.find(m => m.id === selectedMonsterForMoves);
    if (monster && monster.moves.length >= 4 && !selectedMoveToReplace) {
      showMessage('Monster already knows 4 moves. Please select a move to replace.');
      return;
    }

    executeDebugAction(
      () => debugApi.learnMove(
        state.currentRun!.id, 
        selectedMonsterForMoves, 
        selectedMoveToLearn, 
        selectedMoveToReplace || undefined
      ),
      'Move learned!'
    ).then(() => {
      // Refresh learnable moves data
      loadLearnableMoves(selectedMonsterForMoves);
      setSelectedMoveToLearn('');
      setSelectedMoveToReplace('');
    });
  };

  const handleForgetMove = (moveId: string) => {
    if (!selectedMonsterForMoves) return;

    executeDebugAction(
      () => debugApi.forgetMove(state.currentRun!.id, selectedMonsterForMoves, moveId),
      'Move forgotten!'
    ).then(() => {
      // Refresh learnable moves data
      loadLearnableMoves(selectedMonsterForMoves);
    });
  };

  if (!state.currentRun) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Debug Mode</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>No active run found. Please start a new game to use debug features.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔧 Debug Mode - Stage {state.currentRun.currentStage}
          </DialogTitle>
        </DialogHeader>

        {message && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-md mb-4">
            {message}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === 'team' ? 'default' : 'outline'}
            onClick={() => setActiveTab('team')}
            size="sm"
          >
            Team Management
          </Button>
          <Button
            variant={activeTab === 'inventory' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inventory')}
            size="sm"
          >
            Inventory
          </Button>
          <Button
            variant={activeTab === 'moves' ? 'default' : 'outline'}
            onClick={() => setActiveTab('moves')}
            size="sm"
          >
            Move Management
          </Button>
          <Button
            variant={activeTab === 'general' ? 'default' : 'outline'}
            onClick={() => setActiveTab('general')}
            size="sm"
          >
            General
          </Button>
        </div>

        {/* Team Management Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Add Monster Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Monster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Monster</label>
                    <select
                      value={selectedMonsterId}
                      onChange={(e) => setSelectedMonsterId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isLoading}
                    >
                      <option value="">Select Monster</option>
                      {availableMonsters.map(monster => (
                        <option key={monster.id} value={monster.id}>
                          {monster.name} ({monster.rarity})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Level</label>
                    <input
                      type="number"
                      value={monsterLevel}
                      onChange={(e) => setMonsterLevel(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="100"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={monsterShiny}
                        onChange={(e) => setMonsterShiny(e.target.checked)}
                        disabled={isLoading}
                      />
                      <span className="text-sm font-medium">Shiny</span>
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleAddMonster}
                  disabled={isLoading || !selectedMonsterId}
                  className="w-full"
                >
                  Add Monster to Team
                </Button>
              </CardContent>
            </Card>

            {/* Current Team */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Current Team ({state.currentRun.team.length}/6)
                  <Button
                    onClick={handleHealTeam}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                  >
                    Heal All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {state.currentRun.team.map((monster) => (
                    <div key={monster.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-semibold flex items-center gap-2">
                            {monster.name}
                            {monster.isShiny && <span className="text-yellow-500">✨</span>}
                          </h4>
                          <div className="text-sm text-muted-foreground">
                            Level {monster.level} • HP: {monster.currentHp}/{monster.maxHp}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={levelUpAmount}
                            onChange={(e) => setLevelUpAmount(e.target.value)}
                            className="w-16 p-1 border rounded text-sm"
                            min="1"
                            max="10"
                            disabled={isLoading}
                          />
                          <Button
                            onClick={() => handleLevelUpMonster(monster.id)}
                            disabled={isLoading}
                            size="sm"
                            variant="outline"
                          >
                            Level Up
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleToggleShiny(monster.id)}
                          disabled={isLoading}
                          size="sm"
                          variant="outline"
                        >
                          {monster.isShiny ? 'Remove Shiny' : 'Make Shiny'}
                        </Button>
                        <Button
                          onClick={() => handleRemoveMonster(monster.id)}
                          disabled={isLoading || (state.currentRun?.team.length || 0) <= 1}
                          size="sm"
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Add Items Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Item</label>
                    <select
                      value={selectedItemId}
                      onChange={(e) => setSelectedItemId(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isLoading}
                    >
                      <option value="">Select Item</option>
                      {availableItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({item.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Quantity</label>
                    <input
                      type="number"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min="1"
                      max="99"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddItem}
                  disabled={isLoading || !selectedItemId}
                  className="w-full"
                >
                  Add Item to Inventory
                </Button>
              </CardContent>
            </Card>

            {/* Current Inventory */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Current Inventory ({state.currentRun.inventory.length} items)
                  <Button
                    onClick={handleClearInventory}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                  >
                    Clear All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {state.currentRun.inventory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No items in inventory</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {state.currentRun.inventory.map((item) => (
                      <div key={item.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold">{item.name}</h4>
                          <Badge variant="outline">x{item.quantity}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        {item.rarity && (
                          <Badge className={`text-xs ${getRarityColor(item.rarity)}`}>
                            {item.rarity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Move Management Tab */}
        {activeTab === 'moves' && (
          <div className="space-y-6">
            {/* Monster Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select Monster</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedMonsterForMoves}
                  onChange={(e) => handleMonsterSelectForMoves(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={isLoading}
                >
                  <option value="">Select Monster</option>
                  {state.currentRun.team.map(monster => (
                    <option key={monster.id} value={monster.id}>
                      {monster.name} (Level {monster.level})
                      {monster.isShiny && ' ✨'}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            {/* Current Moves */}
            {selectedMonsterForMoves && learnableMovesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Current Moves ({learnableMovesData.currentMoves.length}/4)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {learnableMovesData.currentMoves.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No moves learned</p>
                  ) : (
                    <div className="grid gap-3">
                      {learnableMovesData.currentMoves.map((move) => (
                        <div key={move.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">{move.name}</h4>
                              <Badge variant="outline" className="text-xs">
                                {move.type}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {move.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{move.description}</p>
                            <div className="text-xs text-muted-foreground mt-1">
                              Power: {move.power || 'N/A'} | Accuracy: {move.accuracy}% | PP: {move.pp}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleForgetMove(move.id)}
                            disabled={isLoading}
                            size="sm"
                            variant="destructive"
                          >
                            Forget
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Learn New Move */}
            {selectedMonsterForMoves && learnableMovesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Learn New Move</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Available Moves</label>
                    <select
                      value={selectedMoveToLearn}
                      onChange={(e) => setSelectedMoveToLearn(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      disabled={isLoading}
                    >
                      <option value="">Select Move to Learn</option>
                      {learnableMovesData.learnableMoves
                        .filter(move => !move.alreadyKnows)
                        .map(move => (
                          <option key={move.id} value={move.id}>
                            {move.name} (Level {move.levelLearned}) - {move.type} - Power: {move.power || 'N/A'}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Move replacement selection if monster has 4 moves */}
                  {learnableMovesData.currentMoves.length >= 4 && selectedMoveToLearn && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Replace Move (Monster already knows 4 moves)
                      </label>
                      <select
                        value={selectedMoveToReplace}
                        onChange={(e) => setSelectedMoveToReplace(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        disabled={isLoading}
                      >
                        <option value="">Select Move to Replace</option>
                        {learnableMovesData.currentMoves.map(move => (
                          <option key={move.id} value={move.id}>
                            {move.name} - {move.type}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Move details for selected move */}
                  {selectedMoveToLearn && (
                    <div className="p-3 bg-muted rounded-lg">
                      {(() => {
                        const move = learnableMovesData.learnableMoves.find(m => m.id === selectedMoveToLearn);
                        return move ? (
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              {move.name}
                              <Badge variant="outline" className="text-xs">{move.type}</Badge>
                              <Badge variant="secondary" className="text-xs">{move.category}</Badge>
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">{move.description}</p>
                            <div className="text-xs text-muted-foreground">
                              Power: {move.power || 'N/A'} | Accuracy: {move.accuracy}% | PP: {move.pp} | 
                              Learned at Level: {move.levelLearned}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  <Button
                    onClick={handleLearnMove}
                    disabled={
                      isLoading || 
                      !selectedMoveToLearn || 
                      (learnableMovesData.currentMoves.length >= 4 && !selectedMoveToReplace)
                    }
                    className="w-full"
                  >
                    Learn Move
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Learnable Moves List */}
            {selectedMonsterForMoves && learnableMovesData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">All Learnable Moves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 max-h-96 overflow-y-auto">
                    {learnableMovesData.learnableMoves.map((move) => (
                      <div 
                        key={move.id} 
                        className={`p-3 border rounded-lg ${move.alreadyKnows ? 'bg-green-50 border-green-200' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{move.name}</h4>
                            <Badge variant="outline" className="text-xs">{move.type}</Badge>
                            <Badge variant="secondary" className="text-xs">{move.category}</Badge>
                            {move.alreadyKnows && (
                              <Badge variant="default" className="text-xs bg-green-600">Known</Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Level {move.levelLearned}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{move.description}</p>
                        <div className="text-xs text-muted-foreground">
                          Power: {move.power || 'N/A'} | Accuracy: {move.accuracy}% | PP: {move.pp}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            {/* Game State */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Game State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Set Stage</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value)}
                        placeholder={`Current: ${state.currentRun.currentStage}`}
                        className="flex-1 p-2 border rounded-md"
                        min="1"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleSetStage}
                        disabled={isLoading || !newStage}
                        size="sm"
                      >
                        Set
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Add Currency</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={currencyAmount}
                        onChange={(e) => setCurrencyAmount(e.target.value)}
                        className="flex-1 p-2 border rounded-md"
                        min="1"
                        disabled={isLoading}
                      />
                      <Button
                        onClick={handleAddCurrency}
                        disabled={isLoading || !currencyAmount}
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Current Stats</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Stage:</span> {state.currentRun.currentStage}
                    </div>
                    <div>
                      <span className="font-medium">Currency:</span> {state.currentRun.currency}
                    </div>
                    <div>
                      <span className="font-medium">Team Size:</span> {state.currentRun.team.length}/6
                    </div>
                    <div>
                      <span className="font-medium">Items:</span> {state.currentRun.inventory.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Close Debug Panel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DebugPage;
