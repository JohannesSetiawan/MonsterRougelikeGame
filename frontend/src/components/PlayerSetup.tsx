import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';

const PlayerSetup: React.FC = () => {
  const [username, setUsername] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { dispatch } = useGame();

  const handleCreatePlayer = async () => {
    if (!username.trim()) return;
    
    setIsCreating(true);
    try {
      const player = await gameApi.createPlayer(username.trim());
      dispatch({ type: 'SET_PLAYER', payload: player });
      setPlayerId(player.id);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create player' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadPlayer = async () => {
    if (!playerId.trim()) return;
    
    setIsLoading(true);
    try {
      const player = await gameApi.getPlayer(playerId.trim());
      dispatch({ type: 'SET_PLAYER', payload: player });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Player not found' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="player-setup">
      <h1>Pokemon Roguelike</h1>
      
      <div className="create-player">
        <h2>Create New Player</h2>
        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isCreating}
        />
        <button 
          onClick={handleCreatePlayer}
          disabled={isCreating || !username.trim()}
        >
          {isCreating ? 'Creating...' : 'Create Player'}
        </button>
      </div>

      <div className="load-player">
        <h2>Load Existing Player</h2>
        <input
          type="text"
          placeholder="Enter player ID"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          disabled={isLoading}
        />
        <button 
          onClick={handleLoadPlayer}
          disabled={isLoading || !playerId.trim()}
        >
          {isLoading ? 'Loading...' : 'Load Player'}
        </button>
      </div>
    </div>
  );
};

export default PlayerSetup;
