import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import { ErrorHandler } from '../utils/errorHandler';
import TeamManagement from './TeamManagement';
import ItemInfo from './ItemInfo';
import MonsterCard from './MonsterCard';
import DebugPage from './DebugPage';
import MonsterSelectionModal from './MonsterSelectionModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const GameInterface: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isProcessingEncounter, setIsProcessingEncounter] = React.useState(false);
  const [processingItemId, setProcessingItemId] = React.useState<string | null>(null);
  const [isEndingRun, setIsEndingRun] = React.useState(false);
  const [showTeamManagement, setShowTeamManagement] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [showDebugPage, setShowDebugPage] = React.useState(false);
  const [showMonsterSelection, setShowMonsterSelection] = React.useState<string | null>(null);

  const getRarityColor = (rarity?: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
      case 'uncommon': return 'bg-green-500/20 text-green-700 border-green-500/50';
      case 'rare': return 'bg-blue-500/20 text-blue-700 border-blue-500/50';
      case 'legendary': return 'bg-purple-500/20 text-purple-700 border-purple-500/50';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-500/50';
    }
  };

  // Debug mode keyboard shortcut (Ctrl+Shift+D)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugPage(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleEndRun = React.useCallback(async (reason: 'victory' | 'defeat') => {
    if (!state.currentRun || isEndingRun) return;

    setIsEndingRun(true);
    try {
      await gameApi.endRun(state.currentRun.id, reason);
      dispatch({ type: 'RESET_GAME' });
      // Reload player data
      if (state.player) {
        const updatedPlayer = await gameApi.getPlayer(state.player.id);
        dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to end run' });
    } finally {
      setIsEndingRun(false);
    }
  }, [state.currentRun, state.player, dispatch, isEndingRun]);

  const handleProgressStage = async () => {
    if (!state.currentRun) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const result = await gameApi.progressStage(state.currentRun.id);
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      
      // Check if game ended due to victory
      if (result.gameEnded && result.reason === 'victory') {
        alert(result.message || 'Congratulations! You completed the adventure!');
        await handleEndRun('victory');
        return;
      }
      
      if (result.encounter) {
        dispatch({ type: 'SET_ENCOUNTER', payload: result.encounter });
        
        // If it's a wild monster encounter, start battle
        if (result.encounter.type === 'wild_monster') {
          const activeMonster = result.run.team.find(m => m.currentHp > 0);
          if (activeMonster) {
            dispatch({ 
              type: 'START_BATTLE', 
              payload: { player: activeMonster, opponent: result.encounter.data } 
            });
          } else {
            // All monsters fainted - trigger defeat
            alert('All your monsters have fainted! Your adventure ends here.');
            await handleEndRun('defeat');
          }
        }
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to progress stage' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleUseItem = async (itemId: string, targetMonsterId?: string) => {
    if (!state.currentRun || processingItemId === itemId) return;

    setProcessingItemId(itemId);
    try {
      let result;
      
      // Handle rare candy with monster selection
      if (itemId === 'rare_candy' && targetMonsterId) {
        result = await gameApi.useItem(state.currentRun.id, itemId, targetMonsterId);
      } else {
        result = await gameApi.useItem(state.currentRun.id, itemId);
      }
      
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      // Show message to user
      alert(result.message);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to use item' });
    } finally {
      setProcessingItemId(null);
    }
  };

  const handleItemClick = (item: { id: string }) => {
    // Items that require monster selection
    if (item.id === 'rare_candy' || 
        item.id === 'elixir' || 
        item.id === 'max_elixir') {
      setShowMonsterSelection(item.id);
    } else {
      handleUseItem(item.id);
    }
  };

  const handleMonsterSelection = (itemId: string, monsterId: string) => {
    setShowMonsterSelection(null);
    handleUseItem(itemId, monsterId);
  };

  if (!state.currentRun) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Game Header */}
        <Card className="border-2">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div>
                <CardTitle className="text-2xl md:text-3xl">
                  Stage {state.currentRun.currentStage}
                </CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    💰 {state.currentRun.currency} Coins
                  </Badge>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setShowTeamManagement(true)}
                  disabled={state.isLoading}
                  className="flex items-center gap-2"
                >
                  👥 Team Details
                </Button>
                {/* Debug mode button - only visible in development */}
                {process.env.NODE_ENV === 'development' && (
                  <Button 
                    variant="outline"
                    onClick={() => setShowDebugPage(true)}
                    disabled={state.isLoading}
                    className="flex items-center gap-2 text-xs"
                    size="sm"
                    title="Debug Mode (Ctrl+Shift+D)"
                  >
                    🔧 Debug
                  </Button>
                )}
                <Button 
                  variant="destructive"
                  onClick={() => handleEndRun('defeat')}
                  disabled={isEndingRun || state.isLoading}
                >
                  {isEndingRun ? 'Ending...' : 'End Run'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Permanent Items Section */}
        {state.currentRun.permanentItems && state.currentRun.permanentItems.length > 0 && (
          <Card className="border-2 border-purple-500/50 bg-purple-950/20">
            <CardHeader>
              <CardTitle className="text-xl text-purple-200 flex items-center gap-2">
                ✨ Active Permanent Effects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  state.currentRun.permanentItems.reduce((acc, itemId) => {
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
        )}

        {/* Team Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Your Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.currentRun.team.map((monster) => (
                <MonsterCard key={monster.id} monster={monster} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Section */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {state.currentRun.inventory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No items in inventory</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.currentRun.inventory.map((item) => (
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
                            onClick={() => setSelectedItem(item.id)}
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
                          onClick={() => handleItemClick(item)}
                          disabled={processingItemId === item.id || state.isLoading}
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

        {/* Progress Section */}
        {!state.currentEncounter && !state.battleState.inBattle && (
          <Card className="border-2 border-primary/50">
            <CardContent className="p-6 text-center">
              <Button 
                size="lg"
                onClick={handleProgressStage}
                disabled={state.isLoading}
                className="px-8 py-4 text-lg"
              >
                {state.isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current mr-2" />
                    Exploring...
                  </>
                ) : (
                  'Continue Adventure'
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Encounter Section */}
        {state.currentEncounter && state.currentEncounter.type !== 'wild_monster' && (
          <Card className="border-2 border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-xl capitalize flex items-center gap-2">
                ⚡ {state.currentEncounter.type.replace('_', ' ')} Encounter
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {state.currentEncounter.type === 'item' && (
                <>
                  <div className="space-y-2">
                    <p className="text-lg">
                      🎁 You found: <span className="font-semibold">{state.currentEncounter.data?.name || 'Unknown Item'}</span>
                    </p>
                    <p className="text-muted-foreground">
                      {state.currentEncounter.data?.description || 'A mysterious item'}
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      if (state.currentRun && state.currentEncounter?.data && !isProcessingEncounter) {
                        setIsProcessingEncounter(true);
                        try {
                          const updatedRun = await gameApi.addItemToInventory(state.currentRun.id, state.currentEncounter.data);
                          dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
                          dispatch({ type: 'SET_ENCOUNTER', payload: null });
                        } catch (error) {
                          dispatch({ type: 'SET_ENCOUNTER', payload: null });
                        } finally {
                          setIsProcessingEncounter(false);
                        }
                      } else {
                        dispatch({ type: 'SET_ENCOUNTER', payload: null });
                      }
                    }}
                    disabled={isProcessingEncounter || state.isLoading}
                    className="w-full"
                  >
                    {isProcessingEncounter ? 'Taking...' : 'Take Item'}
                  </Button>
                </>
              )}
              
              {state.currentEncounter.type === 'rest_site' && (
                <>
                  <div className="space-y-2">
                    <p className="text-lg">
                      🏕️ You found a rest site!
                    </p>
                    <p className="text-muted-foreground">
                      Your team will be fully healed and all PP restored.
                    </p>
                  </div>
                  <Button 
                    onClick={async () => {
                      if (isProcessingEncounter) return;
                      setIsProcessingEncounter(true);
                      
                      try {
                        if (state.currentRun) {
                          const result = await gameApi.useRestSite(state.currentRun.id);
                          
                          if (result.success) {
                            const updatedRun = { ...state.currentRun, team: result.team };
                            dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
                          }
                        }
                      } catch (error) {
                        ErrorHandler.handle(error, 'GameInterface.useRestSite');
                      } finally {
                        dispatch({ type: 'SET_ENCOUNTER', payload: null });
                        setIsProcessingEncounter(false);
                      }
                    }}
                    disabled={isProcessingEncounter || state.isLoading}
                    className="w-full"
                  >
                    {isProcessingEncounter ? 'Resting...' : 'Rest and Continue'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Team Management Modal */}
        {showTeamManagement && (
          <TeamManagement
            team={state.currentRun.team}
            onClose={() => setShowTeamManagement(false)}
          />
        )}

        {/* Item Info Modal */}
        {selectedItem && (
          <ItemInfo 
            itemId={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}

        {/* Debug Page Modal */}
        {showDebugPage && (
          <DebugPage 
            onClose={() => setShowDebugPage(false)} 
          />
        )}

        {/* Monster Selection Modal for items like rare candy */}
        {showMonsterSelection && state.currentRun && (
          <MonsterSelectionModal
            monsters={state.currentRun.team}
            itemName={state.currentRun.inventory.find(item => item.id === showMonsterSelection)?.name || showMonsterSelection}
            onSelectMonster={(monsterId) => handleMonsterSelection(showMonsterSelection, monsterId)}
            onClose={() => setShowMonsterSelection(null)}
            isProcessing={processingItemId === showMonsterSelection}
          />
        )}
      </div>
    </div>
  );
};

export default GameInterface;
