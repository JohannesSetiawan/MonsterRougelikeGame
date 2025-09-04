import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';

interface MoveInfoProps {
  moveId: string;
  onClose: () => void;
}

const MoveInfo: React.FC<MoveInfoProps> = ({ moveId, onClose }) => {
  const [moveData, setMoveData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMoveData = async () => {
      try {
        setLoading(true);
        const data = await gameApi.getMoveData(moveId);
        setMoveData(data);
      } catch (err) {
        setError('Failed to load move data');
        console.error('Error loading move data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMoveData();
  }, [moveId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: '#ff6b6b',
      water: '#4ecdc4',
      grass: '#51cf66',
      electric: '#ffd43b',
      psychic: '#da77f2',
      ice: '#74c0fc',
      dragon: '#845ef7',
      dark: '#495057',
      fighting: '#f03e3e',
      poison: '#9c88ff',
      ground: '#f59f00',
      flying: '#339af0',
      bug: '#8ce99a',
      rock: '#868e96',
      ghost: '#7c2d12',
      steel: '#adb5bd',
      fairy: '#fcc2d7',
      normal: '#ced4da'
    };
    return colors[type] || '#868e96';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'physical': return '⚔️';
      case 'special': return '✨';
      case 'status': return '🔄';
      default: return '❓';
    }
  };

  const getPowerDisplay = (power: number) => {
    if (power === 0) return 'Status';
    return power.toString();
  };

  if (loading) {
    return (
      <div className="move-info-backdrop" onClick={handleBackdropClick}>
        <div className="move-info-modal">
          <div className="loading-content">
            <div className="loading-spinner">⚡</div>
            <p>Loading move data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !moveData) {
    return (
      <div className="move-info-backdrop" onClick={handleBackdropClick}>
        <div className="move-info-modal">
          <div className="error-content">
            <h3>Error</h3>
            <p>{error || 'Move not found'}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="move-info-backdrop" onClick={handleBackdropClick}>
      <div className="move-info-modal">
        <div className="modal-header">
          <div className="move-title">
            <h2>{moveData.name}</h2>
            <div className="move-category">
              <span className="category-icon">{getCategoryIcon(moveData.category)}</span>
              <span className="category-name">{moveData.category}</span>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="move-details">
          <div className="move-type-section">
            <div 
              className="type-badge" 
              style={{ backgroundColor: getTypeColor(moveData.type) }}
            >
              {moveData.type.toUpperCase()}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Power</span>
              <span className="stat-value power">{getPowerDisplay(moveData.power)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Accuracy</span>
              <span className="stat-value accuracy">{moveData.accuracy}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">PP</span>
              <span className="stat-value pp">{moveData.pp}</span>
            </div>
          </div>

          <div className="description-section">
            <h4>Description</h4>
            <p className="move-description">{moveData.description}</p>
          </div>

          {moveData.effect && (
            <div className="effect-section">
              <h4>Special Effect</h4>
              <p className="move-effect">{moveData.effect}</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .move-info-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: var(--spacing-lg);
        }

        .move-info-modal {
          background: var(--bg-primary);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          max-width: 500px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }

        .move-title h2 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
        }

        .move-category {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .category-icon {
          font-size: 1.125rem;
        }

        .category-name {
          text-transform: capitalize;
          font-weight: 500;
        }

        .close-button {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 2rem;
          cursor: pointer;
          width: 3rem;
          height: 3rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .close-button:hover {
          background: var(--error-bg);
          color: var(--error);
          transform: scale(1.1);
        }

        .move-details {
          padding: var(--spacing-lg);
        }

        .move-type-section {
          margin-bottom: var(--spacing-lg);
        }

        .type-badge {
          display: inline-block;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-lg);
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          box-shadow: var(--shadow-md);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: var(--spacing-md);
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .stat-value.power {
          color: var(--error);
        }

        .stat-value.accuracy {
          color: var(--success);
        }

        .stat-value.pp {
          color: var(--primary);
        }

        .description-section,
        .effect-section {
          margin-bottom: var(--spacing-lg);
        }

        .description-section:last-child,
        .effect-section:last-child {
          margin-bottom: 0;
        }

        .description-section h4,
        .effect-section h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
        }

        .move-description,
        .move-effect {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .move-effect {
          background: var(--accent-bg);
          padding: var(--spacing-md);
          border-radius: var(--radius);
          border-left: 3px solid var(--accent);
        }

        .loading-content,
        .error-content {
          padding: var(--spacing-xl);
          text-align: center;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-md);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-content button {
          background: var(--primary);
          color: white;
          border: none;
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius);
          cursor: pointer;
          font-weight: 600;
          margin-top: var(--spacing-md);
        }

        @media (max-width: 768px) {
          .move-info-backdrop {
            padding: var(--spacing-md);
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .modal-header,
          .move-details {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

export default MoveInfo;
