import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import { logger } from '../utils/logger';
import { ErrorHandler } from '../utils/errorHandler';
import ItemBag from './ItemBag';
import MonsterStatsModal from './MonsterStatsModal';
import MoveInfo from './MoveInfo';
import AbilityInfo from './AbilityInfo';
import ExperienceBar from './ExperienceBar';
import type { BattleAction, Move } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const BattleInterface: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [movesData, setMovesData] = useState<Record<string, Move>>({});
  const [showItemBag, setShowItemBag] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showOpponentStats, setShowOpponentStats] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  
  // Use ref to track initialization to prevent multiple calls
  const battleInitializationRef = React.useRef<{
    isInitialized: boolean;
    isInitializing: boolean;
    runId: string | null;
  }>({
    isInitialized: false,
    isInitializing: false,
    runId: null
  });

  const playerMonster = state.battleState.playerMonster;
  const opponentMonster = state.battleState.opponentMonster;
  const currentRun = state.currentRun;

  // Load moves data when component mounts
  React.useEffect(() => {
    const loadGameData = async () => {
      try {
        // Load moves data
        const moves = await gameApi.getAllMoves();
        setMovesData(moves);
        
        // Note: Items data is now loaded via the useItemsData hook in ItemInfo component
        // This demonstrates proper separation of concerns for API data loading
      } catch (error) {
        ErrorHandler.handle(error, 'BattleInterface.loadGameData');
        // Fallback to empty object, individual move calls will be made
        setMovesData({});
      }
    };
    loadGameData();
  }, []);

  // Reset battle initialization when component unmounts or game resets
  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      battleInitializationRef.current.isInitialized = false;
      battleInitializationRef.current.runId = null;
    };
  }, []);

  // Reset battle initialization if run changes significantly
  React.useEffect(() => {
    if (!currentRun) {
      battleInitializationRef.current.isInitialized = false;
      battleInitializationRef.current.runId = null;
    }
  }, [currentRun?.id]);

  // Initialize battle on first render
  React.useEffect(() => {
    // Check if we need to initialize for a new run
    const needsInitialization = playerMonster && 
                               opponentMonster && 
                               currentRun && 
                               (!battleInitializationRef.current.isInitialized || 
                                battleInitializationRef.current.runId !== currentRun.id) &&
                               !battleInitializationRef.current.isInitializing;
    
    if (needsInitialization) {
      logger.debug('Initializing battle for run: ' + currentRun.id, 'BattleInterface');
      initializeBattle();
    }
  }, [playerMonster?.id, opponentMonster?.id, currentRun?.id]); // Removed battleInitialized dependency

  const initializeBattle = async () => {
    if (!playerMonster || !opponentMonster || !currentRun) {
      logger.debug('Battle initialization skipped: missing requirements', 'BattleInterface');
      return;
    }

    if (battleInitializationRef.current.isInitializing || 
        (battleInitializationRef.current.isInitialized && 
         battleInitializationRef.current.runId === currentRun.id)) {
      logger.debug('Battle initialization skipped: already initialized or in progress', 'BattleInterface');
      return;
    }
    
    logger.debug('Starting battle initialization for run: ' + currentRun.id, 'BattleInterface');
    
    try {
      setIsProcessing(true);
      battleInitializationRef.current.isInitializing = true;
      
      const battleInit = await gameApi.initializeBattle(
        currentRun.id,
        playerMonster.id,
        opponentMonster
      );

      logger.debug('Battle initialization response received', 'BattleInterface');

      if (battleInit.effects && battleInit.effects.length > 0) {
        setBattleLog(prev => [...prev, ...battleInit.effects]);
      }

      // Update monsters with battle start effects
      dispatch({
        type: 'UPDATE_BATTLE_MONSTERS',
        payload: {
          player: battleInit.updatedPlayerMonster,
          opponent: battleInit.updatedOpponentMonster
        }
      });

      // Mark as successfully initialized
      battleInitializationRef.current.isInitialized = true;
      battleInitializationRef.current.runId = currentRun.id;

    } catch (error) {
      ErrorHandler.handle(error, 'BattleInterface.initializeBattle');
      setBattleLog(prev => [...prev, 'Battle initialization failed!']);
      // Reset on error so it can be retried
      battleInitializationRef.current.isInitialized = false;
    } finally {
      setIsProcessing(false);
      battleInitializationRef.current.isInitializing = false;
    }
  };

  if (!playerMonster || !opponentMonster || !currentRun) return null;

  const handleBattleAction = async (action: BattleAction) => {
    // Prevent multiple clicks and actions after battle ended
    if (isProcessing || battleEnded) return;
    
    setIsProcessing(true);
    try {
      const result = await gameApi.performBattleAction(
        currentRun.id,
        action,
        playerMonster.id,
        opponentMonster
      );

      // Update battle log
      if (result.result.effects) {
        setBattleLog(prev => [...prev, ...result.result.effects!]);
      }

      // Update monsters
      dispatch({
        type: 'UPDATE_BATTLE_MONSTERS',
        payload: {
          player: result.updatedPlayerMonster,
          opponent: result.updatedOpponentMonster
        }
      });

      // Update run
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.updatedRun });

      // Check for team wipe
      if (result.teamWipe) {
        setBattleEnded(true);
        setBattleLog(prev => [...prev, '💀 All your monsters have fainted! Your adventure ends here.']);
        setTimeout(async () => {
          if (currentRun) {
            try {
              await gameApi.endRun(currentRun.id, 'defeat');
              dispatch({ type: 'RESET_GAME' });
              // Reset battle initialization
              battleInitializationRef.current.isInitialized = false;
              battleInitializationRef.current.runId = null;
              // Reload player data
              if (state.player) {
                const updatedPlayer = await gameApi.getPlayer(state.player.id);
                dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
              }
            } catch (error) {
              // Fallback - just reset the game
              dispatch({ type: 'RESET_GAME' });
              // Reset battle initialization
              battleInitializationRef.current.isInitialized = false;
              battleInitializationRef.current.runId = null;
            }
          }
          setBattleLog([]);
        }, 3000);
        return;
      }

      // Check if battle ended
      if (result.result.battleEnded) {
        setBattleEnded(true);
        let endDelay = 2000;
        
        // Show winner message
        if (result.result.winner === 'player') {
          setBattleLog(prev => [...prev, '🎉 Victory! You won the battle!']);
        } else if (result.result.winner === 'opponent') {
          setBattleLog(prev => [...prev, '💀 Defeat! Your monster fainted!']);
          endDelay = 3000; // Give more time to read defeat message
        }
        
        setTimeout(() => {
          dispatch({ type: 'END_BATTLE' });
          setBattleLog([]);
          setBattleEnded(false); // Reset for next battle
          // Reset battle initialization for next battle
          battleInitializationRef.current.isInitialized = false;
          battleInitializationRef.current.runId = null;
        }, endDelay);
      }

    } catch (error) {
      const displayMessage = ErrorHandler.getDisplayMessage(error, 'Battle action failed');
      dispatch({ type: 'SET_ERROR', payload: displayMessage });
      ErrorHandler.handle(error, 'BattleInterface.handleBattleAction');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAttack = (moveId: string) => {
    if (isProcessing || battleEnded) return;
    handleBattleAction({ type: 'attack', moveId });
  };

  const handleOpenBag = () => {
    if (isProcessing || battleEnded) return;
    setShowItemBag(true);
  };

  const handleUseItem = (itemId: string) => {
    if (isProcessing || battleEnded) return;
    
    setShowItemBag(false);
    
    // Handle monster ball usage
    if (itemId === 'monster_ball') {
      handleBattleAction({ type: 'item', itemId: 'monster_ball' });
    } else {
      // Handle other items (like potions)
      handleBattleAction({ type: 'item', itemId });
    }
  };

  const handleCloseBag = () => {
    if (!isProcessing) {
      setShowItemBag(false);
    }
  };

  const handleFlee = () => {
    if (isProcessing || battleEnded) return;
    handleBattleAction({ type: 'flee' });
  };

  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getMoveData = (moveId: string): { name: string; power: number; accuracy: number; pp: number } => {
    // Use loaded moves data from API if available
    if (movesData[moveId]) {
      return {
        name: movesData[moveId].name,
        power: movesData[moveId].power,
        accuracy: movesData[moveId].accuracy,
        pp: movesData[moveId].pp
      };
    }
    
    // Fallback data only for battle interface - shows that data is loading
    return { 
      name: moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) + ' (Loading...)', 
      power: 0, 
      accuracy: 0,
      pp: 0
    };
  };

  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Battle Field */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opponent Monster */}
          <Card className="border-2 border-red-500/50 bg-red-950/20">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-red-200">
                    {opponentMonster.name}
                  </CardTitle>
                  <p className="text-red-300/70">Level {opponentMonster.level}</p>
                </div>
                <div className="flex gap-2">
                  {opponentMonster.isShiny && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                      ✨ Shiny
                    </Badge>
                  )}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowOpponentStats(true)}
                    disabled={isProcessing}
                    className="border-red-500/50 hover:bg-red-500/20"
                  >
                    📊
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-red-300/70">Ability:</span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAbility(opponentMonster.ability)}
                    className="h-auto p-1 text-red-200 hover:text-red-100"
                  >
                    {opponentMonster.ability}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-300/70">HP</span>
                    <span className="text-red-200">
                      {opponentMonster.currentHp}/{opponentMonster.maxHp}
                    </span>
                  </div>
                  <Progress 
                    value={getHealthPercentage(opponentMonster.currentHp, opponentMonster.maxHp)} 
                    className="h-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Player Monster */}
          <Card className="border-2 border-blue-500/50 bg-blue-950/20">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-blue-200">
                    {playerMonster.name}
                  </CardTitle>
                  <p className="text-blue-300/70">Level {playerMonster.level}</p>
                </div>
                <div className="flex gap-2">
                  {playerMonster.isShiny && (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/50">
                      ✨ Shiny
                    </Badge>
                  )}
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPlayerStats(true)}
                    disabled={isProcessing}
                    className="border-blue-500/50 hover:bg-blue-500/20"
                  >
                    📊
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-300/70">Ability:</span>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedAbility(playerMonster.ability)}
                    className="h-auto p-1 text-blue-200 hover:text-blue-100"
                  >
                    {playerMonster.ability}
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-300/70">HP</span>
                    <span className="text-blue-200">
                      {playerMonster.currentHp}/{playerMonster.maxHp}
                    </span>
                  </div>
                  <Progress 
                    value={getHealthPercentage(playerMonster.currentHp, playerMonster.maxHp)} 
                    className="h-4"
                  />
                </div>
                <ExperienceBar 
                  monster={playerMonster} 
                  textColor="text-blue-300/70" 
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Battle Log */}
        <Card className="border-2 border-amber-500/50 bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-amber-200">Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {battleLog.slice(-6).map((message, index) => (
                <div key={index} className="text-sm text-amber-100/80 p-2 bg-amber-950/20 rounded">
                  {message}
                </div>
              ))}
              {isProcessing && (
                <div className="text-sm text-amber-200 p-2 bg-amber-500/20 rounded flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-300" />
                  Processing turn...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Battle Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Moves Section */}
          <Card className="lg:col-span-3 border-2 border-primary/50">
            <CardHeader>
              <CardTitle>Moves</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playerMonster.moves.map((moveId) => {
                  const move = getMoveData(moveId);
                  const currentPP = (playerMonster.movePP && playerMonster.movePP[moveId]) || 0;
                  const maxPP = move.pp;
                  const isOutOfPP = currentPP <= 0;
                  
                  return (
                    <div key={moveId} className="flex gap-2">
                      <Button
                        variant={isOutOfPP ? "outline" : "default"}
                        onClick={() => handleAttack(moveId)}
                        disabled={isProcessing || battleEnded || isOutOfPP}
                        className={`flex-1 flex-col h-auto p-4 ${isOutOfPP ? 'opacity-50' : ''}`}
                      >
                        <div className="font-semibold">{move.name}</div>
                        <div className="text-xs mt-1 opacity-80">
                          PWR: {move.power} | ACC: {move.accuracy}% | PP: {currentPP}/{maxPP}
                        </div>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMove(moveId)}
                        className="p-2"
                      >
                        ℹ️
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Other Actions */}
          <Card className="border-2 border-secondary/50">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                onClick={handleOpenBag}
                disabled={isProcessing || battleEnded}
                className="w-full"
              >
                🎒 Bag
              </Button>
              <Button
                variant="destructive"
                onClick={handleFlee}
                disabled={isProcessing || battleEnded}
                className="w-full"
              >
                💨 Flee
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Modals */}
        {showItemBag && (
          <ItemBag
            inventory={currentRun.inventory}
            onUseItem={handleUseItem}
            onClose={handleCloseBag}
            isProcessing={isProcessing}
          />
        )}

        {showPlayerStats && (
          <MonsterStatsModal
            monster={playerMonster}
            onClose={() => setShowPlayerStats(false)}
          />
        )}

        {showOpponentStats && (
          <MonsterStatsModal
            monster={opponentMonster}
            onClose={() => setShowOpponentStats(false)}
          />
        )}

        {selectedMove && (
          <MoveInfo 
            moveId={selectedMove} 
            onClose={() => setSelectedMove(null)} 
          />
        )}

        {selectedAbility && (
          <AbilityInfo 
            abilityId={selectedAbility} 
            onClose={() => setSelectedAbility(null)} 
          />
        )}
      </div>
    </div>
  );
};

export default BattleInterface;
