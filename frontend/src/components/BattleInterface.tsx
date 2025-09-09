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
import type { BattleAction, Move, StatModifiers } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const BattleInterface: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleLog, setBattleLog] = useState<Array<{text: string, isCritical?: boolean}>>([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [movesData, setMovesData] = useState<Record<string, Move>>({});
  const [showItemBag, setShowItemBag] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showOpponentStats, setShowOpponentStats] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [battleContext, setBattleContext] = useState<{
    playerStatModifiers: StatModifiers;
    opponentStatModifiers: StatModifiers;
  } | null>(null);
  const [criticalHitEffect, setCriticalHitEffect] = useState<'player' | 'opponent' | null>(null);
  const [playerGoesFirst, setPlayerGoesFirst] = useState<boolean>(true);
  const [showTurnOrder, setShowTurnOrder] = useState<boolean>(false);
  
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
        setBattleLog(prev => [...prev, ...battleInit.effects.map(text => ({ text }))]);
      }

      // Store battle context with stat modifiers
      setBattleContext(battleInit.battleContext);

      // Set turn order and show turn order display
      setPlayerGoesFirst(battleInit.playerGoesFirst);
      setShowTurnOrder(true);
      
      // Hide turn order display after 3 seconds
      setTimeout(() => setShowTurnOrder(false), 3000);

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
      setBattleLog(prev => [...prev, { text: 'Battle initialization failed!' }]);
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
        opponentMonster,
        battleContext || undefined,
        playerGoesFirst
      );

      // Update battle log and check for critical hits
      if (result.result.effects) {
        const hasCriticalHit = result.result.isCritical;
        setBattleLog(prev => [...prev, ...result.result.effects!.map(text => ({ 
          text, 
          isCritical: text.includes('Critical hit!') 
        }))]);
        
        // Add speed advantage message if battle ended due to speed (but not for items or catching)
        if (result.result.battleEnded && 
            result.result.winner === 'player' && 
            result.result.effects!.some(effect => effect.includes('fainted')) &&
            !result.result.effects!.some(effect => effect.includes('Items are used with priority')) &&
            !result.result.effects!.some(effect => effect.includes('Catching attempts are made with priority'))) {
          const speedAdvantageMsg = playerGoesFirst ? 
            `⚡ ${playerMonster.name}'s superior speed prevented retaliation!` :
            `⚡ ${playerMonster.name} struck back with lightning speed!`;
          setBattleLog(prev => [...prev, { text: speedAdvantageMsg, isCritical: false }]);
        }
        
        // Trigger critical hit animation if it occurred
        if (hasCriticalHit) {
          setCriticalHitEffect('opponent'); // Assuming player is attacking opponent
          setTimeout(() => setCriticalHitEffect(null), 600);
        }
      }

      // Update battle context if returned
      if (result.battleContext) {
        setBattleContext(result.battleContext);
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
        setBattleLog(prev => [...prev, { text: '💀 All your monsters have fainted! Your adventure ends here.' }]);
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
          setBattleLog(prev => [...prev, { text: '🎉 Victory! You won the battle!' }]);
        } else if (result.result.winner === 'opponent') {
          setBattleLog(prev => [...prev, { text: '💀 Defeat! Your monster fainted!' }]);
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
      // Handle battle action errors gracefully - don't navigate away from battle
      const errorMessage = ErrorHandler.getDisplayMessage(error, 'Action failed');
      
      // Add error message to battle log as a warning
      setBattleLog(prev => [...prev, { text: `⚠️ ${errorMessage}` }]);
      
      // Log the error for debugging but don't set global error state
      ErrorHandler.handle(error, 'BattleInterface.handleBattleAction');
      
      // Don't update any game state - keep everything as it was
      // Player can retry the action or choose a different action
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

  const handleUseItem = (itemId: string, targetMoveId?: string) => {
    if (isProcessing || battleEnded) return;
    
    setShowItemBag(false);
    
    // Create battle action with optional target move
    const action: BattleAction = { 
      type: 'item', 
      itemId,
      ...(targetMoveId && { targetMoveId })
    };
    
    // Handle monster ball usage
    if (itemId === 'monster_ball' || itemId === 'great_ball' || itemId === 'ultra_ball') {
      handleBattleAction({ type: 'item', itemId });
    } else {
      // Handle other items (like potions, ethers, etc.)
      handleBattleAction(action);
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
          <Card className={`border-2 border-red-500/50 bg-red-950/20 ${criticalHitEffect === 'opponent' ? 'critical-hit-flash' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-red-200">
                    {opponentMonster.name}
                  </CardTitle>
                  <p className="text-red-300/70">Level {opponentMonster.level}</p>
                  <p className="text-red-400/60 text-sm font-mono">SPD: {opponentMonster.stats.speed}</p>
                </div>
                <div className="flex gap-2">
                  {!playerGoesFirst && showTurnOrder && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50 animate-pulse">
                      ⚡ 1st
                    </Badge>
                  )}
                  {playerGoesFirst && showTurnOrder && (
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/50">
                      2nd
                    </Badge>
                  )}
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
          <Card className={`border-2 border-blue-500/50 bg-blue-950/20 ${criticalHitEffect === 'player' ? 'critical-hit-flash' : ''}`}>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-blue-200">
                    {playerMonster.name}
                  </CardTitle>
                  <p className="text-blue-300/70">Level {playerMonster.level}</p>
                  <p className="text-blue-400/60 text-sm font-mono">SPD: {playerMonster.stats.speed}</p>
                </div>
                <div className="flex gap-2">
                  {playerGoesFirst && showTurnOrder && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/50 animate-pulse">
                      ⚡ 1st
                    </Badge>
                  )}
                  {!playerGoesFirst && showTurnOrder && (
                    <Badge className="bg-gray-500/20 text-gray-300 border-gray-500/50">
                      2nd
                    </Badge>
                  )}
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

        {/* Turn Order Display */}
        {showTurnOrder && (
          <Card className="border-2 border-cyan-500/50 bg-cyan-950/20 animate-pulse">
            <CardContent className="py-4">
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-200 mb-2">
                  ⚡ Turn Order ⚡
                </div>
                {(battleLog.some(log => log.text.includes('Items are used with priority')) || 
                  battleLog.some(log => log.text.includes('Catching attempts are made with priority'))) && (
                  <div className="text-sm text-yellow-300 mb-2">
                    {battleLog.some(log => log.text.includes('Items are used with priority')) && '📦 Items always go first!'}
                    {battleLog.some(log => log.text.includes('Catching attempts are made with priority')) && '⚾ Catching always goes first!'}
                  </div>
                )}
                <div className="flex justify-center items-center gap-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    playerGoesFirst 
                      ? 'bg-green-500/30 border border-green-400/50 text-green-200' 
                      : 'bg-gray-500/30 border border-gray-400/50 text-gray-300'
                  }`}>
                    <span className="text-lg">{playerGoesFirst ? '1st' : '2nd'}</span>
                    <span className="font-semibold">{playerMonster.name}</span>
                    <span className="text-sm opacity-75">
                      {battleLog.some(log => log.text.includes('Items are used with priority'))
                        ? '(Item Priority)' 
                        : battleLog.some(log => log.text.includes('Catching attempts are made with priority'))
                          ? '(Catch Priority)'
                          : `(${playerMonster.stats.speed} SPD)`
                      }
                    </span>
                  </div>
                  <div className="text-cyan-200 text-xl">VS</div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    !playerGoesFirst 
                      ? 'bg-green-500/30 border border-green-400/50 text-green-200' 
                      : 'bg-gray-500/30 border border-gray-400/50 text-gray-300'
                  }`}>
                    <span className="text-lg">{!playerGoesFirst ? '1st' : '2nd'}</span>
                    <span className="font-semibold">{opponentMonster.name}</span>
                    <span className="text-sm opacity-75">({opponentMonster.stats.speed} SPD)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Battle Log */}
        <Card className="border-2 border-amber-500/50 bg-amber-950/10">
          <CardHeader>
            <CardTitle className="text-amber-200">Battle Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {battleLog.slice(-6).map((message, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 bg-amber-950/20 rounded ${
                    message.isCritical 
                      ? 'text-red-400 font-bold animate-pulse border-l-4 border-red-500' 
                      : (message.text.includes('Items are used with priority') || message.text.includes('Catching attempts are made with priority'))
                        ? 'text-yellow-300 font-semibold border-l-4 border-yellow-500'
                        : 'text-amber-100/80'
                  }`}
                >
                  {message.text}
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
            inBattle={true}
            activeMonster={playerMonster}
            movesData={movesData}
          />
        )}

        {showPlayerStats && (
          <MonsterStatsModal
            monster={{
              ...playerMonster,
              statModifiers: battleContext?.playerStatModifiers
            }}
            onClose={() => setShowPlayerStats(false)}
          />
        )}

        {showOpponentStats && (
          <MonsterStatsModal
            monster={{
              ...opponentMonster,
              statModifiers: battleContext?.opponentStatModifiers
            }}
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
