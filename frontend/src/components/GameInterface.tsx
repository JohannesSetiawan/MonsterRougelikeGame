import React from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';

const GameInterface: React.FC = () => {
  const { state, dispatch } = useGame();
  const [isProcessingEncounter, setIsProcessingEncounter] = React.useState(false);
  const [processingItemId, setProcessingItemId] = React.useState<string | null>(null);
  const [isEndingRun, setIsEndingRun] = React.useState(false);

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

  const handleUseItem = async (itemId: string) => {
    if (!state.currentRun || processingItemId === itemId) return;

    setProcessingItemId(itemId);
    try {
      const result = await gameApi.useItem(state.currentRun.id, itemId);
      dispatch({ type: 'SET_CURRENT_RUN', payload: result.run });
      // Show message to user
      alert(result.message);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to use item' });
    } finally {
      setProcessingItemId(null);
    }
  };

  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 66) return '#4CAF50';
    if (percentage > 33) return '#FFA726';
    return '#F44336';
  };

  if (!state.currentRun) return null;

  return (
    <div className="game-interface">
      <div className="game-header">
        <h2>Stage {state.currentRun.currentStage}</h2>
        <div className="currency">Coins: {state.currentRun.currency}</div>
        <button 
          onClick={() => handleEndRun('defeat')}
          disabled={isEndingRun || state.isLoading}
        >
          {isEndingRun ? 'Ending...' : 'End Run'}
        </button>
      </div>

      <div className="team-section">
        <h3>Your Team</h3>
        <div className="team-grid">
          {state.currentRun.team.map((monster) => {
            const healthPercentage = getHealthPercentage(monster.currentHp, monster.maxHp);
            return (
              <div key={monster.id} className="team-monster">
                <h4>{monster.name} (Lv.{monster.level})</h4>
                <div className="health-bar">
                  <div 
                    className="health-fill" 
                    style={{ 
                      width: `${healthPercentage}%`,
                      backgroundColor: getHealthColor(healthPercentage)
                    }}
                  />
                  <span className="health-text">
                    {monster.currentHp}/{monster.maxHp}
                  </span>
                </div>
                <div className="exp-bar">
                  <div 
                    className="exp-fill" 
                    style={{ width: `${(monster.experience / (monster.level * 100)) * 100}%` }}
                  />
                </div>
                {monster.isShiny && <span className="shiny">✨</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="inventory-section">
        <h3>Inventory</h3>
        <div className="inventory-grid">
          {state.currentRun.inventory.map((item) => (
            <div key={item.id} className="inventory-item">
              <div>{item.name} x{item.quantity}</div>
              <div className="item-description">{item.description}</div>
              {item.type === 'healing' && (
                <button 
                  onClick={() => handleUseItem(item.id)}
                  disabled={processingItemId === item.id || state.isLoading}
                >
                  {processingItemId === item.id ? 'Using...' : 'Use'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {!state.currentEncounter && !state.battleState.inBattle && (
        <div className="progress-section">
          <button 
            className="progress-button"
            onClick={handleProgressStage}
            disabled={state.isLoading}
          >
            {state.isLoading ? 'Exploring...' : 'Continue Adventure'}
          </button>
        </div>
      )}

      {state.currentEncounter && state.currentEncounter.type !== 'wild_monster' && (
        <div className="encounter-section">
          <h3>Encounter: {state.currentEncounter.type}</h3>
          {state.currentEncounter.type === 'item' && (
            <div>
              <p>You found an item: {state.currentEncounter.data?.name || 'Unknown Item'}!</p>
              <p>{state.currentEncounter.data?.description || 'A mysterious item'}</p>
              <button 
                disabled={isProcessingEncounter || state.isLoading}
                onClick={async () => {
                if (state.currentRun && state.currentEncounter?.data && !isProcessingEncounter) {
                  setIsProcessingEncounter(true);
                  try {
                    const updatedRun = await gameApi.addItemToInventory(state.currentRun.id, state.currentEncounter.data);
                    dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
                    dispatch({ type: 'SET_ENCOUNTER', payload: null });
                  } catch (error) {
                    // Fallback - just continue without adding item
                    dispatch({ type: 'SET_ENCOUNTER', payload: null });
                  } finally {
                    setIsProcessingEncounter(false);
                  }
                } else {
                  dispatch({ type: 'SET_ENCOUNTER', payload: null });
                }
              }}>
                {isProcessingEncounter ? 'Taking...' : 'Take Item'}
              </button>
            </div>
          )}
          {state.currentEncounter.type === 'rest_site' && (
            <div>
              <p>You found a rest site. Your team recovers 50% HP.</p>
              <button 
                disabled={isProcessingEncounter || state.isLoading}
                onClick={() => {
                if (isProcessingEncounter) return;
                setIsProcessingEncounter(true);
                
                if (state.currentRun) {
                  // Heal all monsters by 50%
                  const healedTeam = state.currentRun.team.map(monster => ({
                    ...monster,
                    currentHp: Math.min(monster.maxHp, monster.currentHp + Math.floor(monster.maxHp * 0.5))
                  }));
                  
                  const updatedRun = { ...state.currentRun, team: healedTeam };
                  dispatch({ type: 'SET_CURRENT_RUN', payload: updatedRun });
                }
                dispatch({ type: 'SET_ENCOUNTER', payload: null });
                setIsProcessingEncounter(false);
              }}>
                {isProcessingEncounter ? 'Resting...' : 'Rest and Continue'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameInterface;
