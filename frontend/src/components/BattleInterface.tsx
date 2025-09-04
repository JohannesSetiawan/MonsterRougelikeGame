import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import ItemBag from './ItemBag';
import MonsterStatsModal from './MonsterStatsModal';
import MoveInfo from './MoveInfo';
import AbilityInfo from './AbilityInfo';
import type { BattleAction, Move } from '../api/types';

const BattleInterface: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isProcessing, setIsProcessing] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battleEnded, setBattleEnded] = useState(false);
  const [movesData, setMovesData] = useState<Record<string, Move>>({});
  const [showItemBag, setShowItemBag] = useState(false);
  const [battleInitialized, setBattleInitialized] = useState(false);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showOpponentStats, setShowOpponentStats] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  const playerMonster = state.battleState.playerMonster;
  const opponentMonster = state.battleState.opponentMonster;
  const currentRun = state.currentRun;

  // Load moves data when component mounts
  React.useEffect(() => {
    const loadMovesData = async () => {
      try {
        const moves = await gameApi.getAllMoves();
        setMovesData(moves);
      } catch (error) {
        console.error('Failed to load moves data:', error);
        // Fallback to empty object, individual move calls will be made
        setMovesData({});
      }
    };
    loadMovesData();
  }, []);

  // Initialize battle on first render
  React.useEffect(() => {
    if (playerMonster && opponentMonster && currentRun && !battleInitialized) {
      initializeBattle();
    }
  }, [playerMonster, opponentMonster, currentRun, battleInitialized]);

  const initializeBattle = async () => {
    if (!playerMonster || !opponentMonster || !currentRun || battleInitialized) return;
    
    try {
      setIsProcessing(true);
      const battleInit = await gameApi.initializeBattle(
        currentRun.id,
        playerMonster.id,
        opponentMonster
      );

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

      setBattleInitialized(true);
    } catch (error) {
      console.error('Failed to initialize battle:', error);
      setBattleLog(prev => [...prev, 'Battle initialization failed!']);
    } finally {
      setIsProcessing(false);
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
              // Reload player data
              if (state.player) {
                const updatedPlayer = await gameApi.getPlayer(state.player.id);
                dispatch({ type: 'SET_PLAYER', payload: updatedPlayer });
              }
            } catch (error) {
              // Fallback - just reset the game
              dispatch({ type: 'RESET_GAME' });
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
        }, endDelay);
      }

    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Battle action failed' });
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

  const getHealthColor = (percentage: number) => {
    if (percentage > 66) return '#4CAF50';
    if (percentage > 33) return '#FFA726';
    return '#F44336';
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
    
    // Fallback data for basic moves if API data not yet loaded
    const fallbackMoves: Record<string, { name: string; power: number; accuracy: number; pp: number }> = {
      'scratch': { name: 'Scratch', power: 40, accuracy: 100, pp: 35 },
      'ember': { name: 'Ember', power: 40, accuracy: 100, pp: 25 },
      'flame_burst': { name: 'Flame Burst', power: 70, accuracy: 100, pp: 15 },
      'water_gun': { name: 'Water Gun', power: 40, accuracy: 100, pp: 25 },
      'bubble_beam': { name: 'Bubble Beam', power: 65, accuracy: 100, pp: 20 },
      'hydro_pump': { name: 'Hydro Pump', power: 110, accuracy: 80, pp: 5 },
    };
    
    return fallbackMoves[moveId] || { 
      name: moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      power: 50, 
      accuracy: 100,
      pp: 20
    };
  };

  return (
    <div className="battle-interface">
      <div className="battle-field">
        {/* Opponent Monster */}
        <div className="opponent-section">
          <div className="monster-info opponent-monster">
            <div className="monster-header-row">
              <h3>{opponentMonster.name} (Lv.{opponentMonster.level})</h3>
              <button 
                className="stats-button opponent-stats-button"
                onClick={() => setShowOpponentStats(true)}
                disabled={isProcessing}
                title="View opponent stats"
              >
                📊
              </button>
            </div>
            <div className="ability-info">
              Ability: 
              <button 
                className="ability-button"
                onClick={() => setSelectedAbility(opponentMonster.ability)}
                title="Click to view ability details"
              >
                {opponentMonster.ability}
              </button>
            </div>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ 
                  width: `${getHealthPercentage(opponentMonster.currentHp, opponentMonster.maxHp)}%`,
                  backgroundColor: getHealthColor(getHealthPercentage(opponentMonster.currentHp, opponentMonster.maxHp))
                }}
              />
              <span className="health-text">
                {opponentMonster.currentHp}/{opponentMonster.maxHp}
              </span>
            </div>
            {opponentMonster.isShiny && <span className="shiny">✨</span>}
          </div>
        </div>

        {/* Player Monster */}
        <div className="player-section">
          <div className="monster-info player-monster">
            <div className="monster-header-row">
              <h3>{playerMonster.name} (Lv.{playerMonster.level})</h3>
              <button 
                className="stats-button player-stats-button"
                onClick={() => setShowPlayerStats(true)}
                disabled={isProcessing}
                title="View your monster's stats"
              >
                📊
              </button>
            </div>
            <div className="ability-info">
              Ability: 
              <button 
                className="ability-button"
                onClick={() => setSelectedAbility(playerMonster.ability)}
                title="Click to view ability details"
              >
                {playerMonster.ability}
              </button>
            </div>
            <div className="health-bar">
              <div 
                className="health-fill" 
                style={{ 
                  width: `${getHealthPercentage(playerMonster.currentHp, playerMonster.maxHp)}%`,
                  backgroundColor: getHealthColor(getHealthPercentage(playerMonster.currentHp, playerMonster.maxHp))
                }}
              />
              <span className="health-text">
                {playerMonster.currentHp}/{playerMonster.maxHp}
              </span>
            </div>
            <div className="exp-bar">
              <div 
                className="exp-fill" 
                style={{ width: `${(playerMonster.experience / (playerMonster.level * 100)) * 100}%` }}
              />
            </div>
            {playerMonster.isShiny && <span className="shiny">✨</span>}
          </div>
        </div>
      </div>

      {/* Battle Log */}
      <div className="battle-log">
        {battleLog.slice(-6).map((message, index) => (
          <div key={index} className="log-message">{message}</div>
        ))}
        {isProcessing && (
          <div className="log-message processing">
            <span className="processing-indicator">⚡</span> Processing turn...
          </div>
        )}
      </div>

      {/* Battle Actions */}
      <div className="battle-actions">
        <div className="moves-section">
          <h4>Moves</h4>
          <div className="moves-grid">
            {playerMonster.moves.map((moveId) => {
              const move = getMoveData(moveId);
              const currentPP = (playerMonster.movePP && playerMonster.movePP[moveId]) || 0;
              const maxPP = move.pp;
              const isOutOfPP = currentPP <= 0;
              
              return (
                <div key={moveId} className="move-button-container">
                  <button
                    className={`move-button ${isOutOfPP ? 'out-of-pp' : ''}`}
                    onClick={() => handleAttack(moveId)}
                    disabled={isProcessing || battleEnded || isOutOfPP}
                  >
                    <div className="move-name">{move.name}</div>
                    <div className="move-info">
                      PWR: {move.power} | ACC: {move.accuracy}% | PP: {currentPP}/{maxPP}
                    </div>
                  </button>
                  <button
                    className="move-info-button"
                    onClick={() => setSelectedMove(moveId)}
                    title="View move details"
                  >
                    ℹ️
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="other-actions">
          <button
            className="action-button bag-button"
            onClick={handleOpenBag}
            disabled={isProcessing || battleEnded}
          >
            🎒 Bag
          </button>
          <button
            className="action-button flee-button"
            onClick={handleFlee}
            disabled={isProcessing || battleEnded}
          >
            Flee
          </button>
        </div>
      </div>

      {/* Item Bag Modal */}
      {showItemBag && (
        <ItemBag
          inventory={currentRun.inventory}
          onUseItem={handleUseItem}
          onClose={handleCloseBag}
          isProcessing={isProcessing}
        />
      )}

      {/* Monster Stats Modals */}
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

      {/* Move Info Modal */}
      {selectedMove && (
        <MoveInfo 
          moveId={selectedMove} 
          onClose={() => setSelectedMove(null)} 
        />
      )}

      {/* Ability Info Modal */}
      {selectedAbility && (
        <AbilityInfo 
          abilityId={selectedAbility} 
          onClose={() => setSelectedAbility(null)} 
        />
      )}
    </div>
  );
};

export default BattleInterface;
