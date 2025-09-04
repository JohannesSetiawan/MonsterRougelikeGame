import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { gameApi } from '../api/gameApi';
import type { Monster } from '../api/types';

const StarterSelection: React.FC = () => {
  const [starters, setStarters] = useState<Monster[]>([]);
  const [selectedStarter, setSelectedStarter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const { state, dispatch } = useGame();

  useEffect(() => {
    const fetchStarters = async () => {
      setIsLoading(true);
      try {
        const starterMonsters = await gameApi.getStarters();
        setStarters(starterMonsters);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load starter monsters' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStarters();
  }, [dispatch]);

  const handleStartRun = async () => {
    if (!selectedStarter || !state.player) return;

    setIsStarting(true);
    try {
      const newRun = await gameApi.startRun(state.player.id, selectedStarter);
      dispatch({ type: 'SET_CURRENT_RUN', payload: newRun });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to start new run' });
    } finally {
      setIsStarting(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return '#ff4444';
      case 'water': return '#4444ff';
      default: return '#888';
    }
  };

  if (isLoading) {
    return <div className="loading">Loading starter monsters...</div>;
  }

  return (
    <div className="starter-selection">
      <h1>Choose Your Starter Monster</h1>
      
      {/* Enhanced Player Information Card */}
      <div className="player-stats-card">
        <h2>Player Information</h2>
        <div className="player-stats-grid">
          <div className="stat-item">
            <span className="stat-label">Username</span>
            <span className="stat-value">{state.player?.username}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Player ID</span>
            <span className="stat-value player-id">{state.player?.id}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Runs</span>
            <span className="stat-value">{state.player?.totalRuns || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Best Stage</span>
            <span className="stat-value">{state.player?.bestStage || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Permanent Currency</span>
            <span className="stat-value currency">💰 {state.player?.permanentCurrency}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Member Since</span>
            <span className="stat-value">
              {state.player?.createdAt 
                ? new Date(state.player.createdAt).toLocaleDateString()
                : 'Unknown'
              }
            </span>
          </div>
        </div>
      </div>

      <p className="selection-prompt">Select your starting companion for this adventure!</p>
      
      <div className="starters-grid">
        {starters.map((monster) => (
          <div
            key={monster.id}
            className={`starter-card ${selectedStarter === monster.id ? 'selected' : ''}`}
            onClick={() => setSelectedStarter(monster.id)}
          >
            <h3>{monster.name}</h3>
            <div className="monster-types">
              {monster.type.map(type => (
                <span 
                  key={type} 
                  className="type-badge"
                  style={{ backgroundColor: getTypeColor(type) }}
                >
                  {type}
                </span>
              ))}
            </div>
            <p className="description">{monster.description}</p>
            <div className="stats">
              <div>HP: {monster.baseStats.hp}</div>
              <div>ATK: {monster.baseStats.attack}</div>
              <div>DEF: {monster.baseStats.defense}</div>
              <div>SP.ATK: {monster.baseStats.specialAttack}</div>
              <div>SP.DEF: {monster.baseStats.specialDefense}</div>
              <div>SPD: {monster.baseStats.speed}</div>
            </div>
            <div className="rarity">{monster.rarity}</div>
          </div>
        ))}
      </div>

      <button
        className="start-run-button"
        onClick={handleStartRun}
        disabled={!selectedStarter || isStarting}
      >
        {isStarting ? 'Starting Run...' : 'Start New Run'}
      </button>
    </div>
  );
};

export default StarterSelection;
