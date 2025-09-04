import React, { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';

interface AbilityInfoProps {
  abilityId: string;
  onClose: () => void;
}

const AbilityInfo: React.FC<AbilityInfoProps> = ({ abilityId, onClose }) => {
  const [abilityData, setAbilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAbilityData = async () => {
      try {
        setLoading(true);
        const data = await gameApi.getAbilityData(abilityId);
        setAbilityData(data);
      } catch (err) {
        setError('Failed to load ability data');
        console.error('Error loading ability data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAbilityData();
  }, [abilityId]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getAbilityIcon = (abilityName: string) => {
    const icons: Record<string, string> = {
      intimidate: '😤',
      blaze: '🔥',
      torrent: '🌊',
      overgrow: '🌱',
      'swift-swim': '💨',
      'static': '⚡',
      'thick-fat': '🛡️',
      'poison-point': '☠️',
      'keen-eye': '👁️',
      'compound-eyes': '👀',
      'shield-dust': '✨',
      'run-away': '💨',
      'color-change': '🎨',
      'synchronize': '🔄',
      'inner-focus': '🧘',
      'levitate': '🎈',
      'trace': '📋',
      'huge-power': '💪',
      'wonder-guard': '⭐',
      'arena-trap': '🕳️',
      'shadow-tag': '👥',
      'rough-skin': '🦾',
      'speed-boost': '⚡',
      'battle-armor': '🛡️',
      'sturdy': '⛰️',
      'magnet-pull': '🧲',
      'soundproof': '🔇',
      'rain-dish': '🌧️',
      'sand-stream': '🌪️',
      'pressure': '⏰',
      'unnerve': '😰',
      'mold-breaker': '🔨'
    };
    return icons[abilityName.toLowerCase()] || '✨';
  };

  const getTriggerColor = (trigger: string) => {
    const colors: Record<string, string> = {
      'on-switch-in': '#4ecdc4',
      'passive': '#51cf66',
      'on-attack': '#ff6b6b',
      'on-damage': '#ffd43b',
      'weather-boost': '#74c0fc',
      'type-boost': '#da77f2',
      'status-prevent': '#868e96',
      'stat-boost': '#845ef7'
    };
    return colors[trigger] || '#ced4da';
  };

  if (loading) {
    return (
      <div className="ability-info-backdrop" onClick={handleBackdropClick}>
        <div className="ability-info-modal">
          <div className="loading-content">
            <div className="loading-spinner">✨</div>
            <p>Loading ability data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !abilityData) {
    return (
      <div className="ability-info-backdrop" onClick={handleBackdropClick}>
        <div className="ability-info-modal">
          <div className="error-content">
            <h3>Error</h3>
            <p>{error || 'Ability not found'}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ability-info-backdrop" onClick={handleBackdropClick}>
      <div className="ability-info-modal">
        <div className="modal-header">
          <div className="ability-title">
            <div className="ability-name">
              <span className="ability-icon">{getAbilityIcon(abilityData.id)}</span>
              <h2>{abilityData.name}</h2>
            </div>
            {abilityData.trigger && (
              <div 
                className="ability-trigger"
                style={{ backgroundColor: getTriggerColor(abilityData.trigger) }}
              >
                {abilityData.trigger.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </div>
            )}
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="ability-details">
          <div className="description-section">
            <h4>Description</h4>
            <p className="ability-description">{abilityData.description}</p>
          </div>

          {abilityData.effect && (
            <div className="effect-section">
              <h4>Battle Effect</h4>
              <p className="ability-effect">{abilityData.effect}</p>
            </div>
          )}

          {abilityData.flavorText && (
            <div className="flavor-section">
              <h4>Flavor Text</h4>
              <p className="ability-flavor">{abilityData.flavorText}</p>
            </div>
          )}

          {abilityData.stats && abilityData.stats.length > 0 && (
            <div className="stats-section">
              <h4>Stat Changes</h4>
              <div className="stat-changes">
                {abilityData.stats.map((statChange: any, index: number) => (
                  <div key={index} className="stat-change-item">
                    <span className="stat-name">{statChange.stat}</span>
                    <span 
                      className={`stat-modifier ${statChange.change > 0 ? 'positive' : 'negative'}`}
                    >
                      {statChange.change > 0 ? '+' : ''}{statChange.change}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {abilityData.activationRate && (
            <div className="activation-section">
              <h4>Activation</h4>
              <div className="activation-info">
                <span className="activation-rate">
                  {abilityData.activationRate}% chance
                </span>
              </div>
            </div>
          )}

          {abilityData.hiddenAbility && (
            <div className="hidden-ability-notice">
              <span className="hidden-badge">Hidden Ability</span>
              <p>This is a rare hidden ability that can only be obtained through special encounters.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ability-info-backdrop {
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

        .ability-info-modal {
          background: var(--bg-primary);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          max-width: 550px;
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

        .ability-title {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .ability-name {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .ability-icon {
          font-size: 1.5rem;
        }

        .ability-name h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
        }

        .ability-trigger {
          display: inline-block;
          padding: 0.25rem var(--spacing-sm);
          border-radius: var(--radius);
          color: white;
          font-size: 0.75rem;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
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

        .ability-details {
          padding: var(--spacing-lg);
        }

        .description-section,
        .effect-section,
        .flavor-section,
        .stats-section,
        .activation-section,
        .hidden-ability-notice {
          margin-bottom: var(--spacing-lg);
        }

        .description-section:last-child,
        .effect-section:last-child,
        .flavor-section:last-child,
        .stats-section:last-child,
        .activation-section:last-child,
        .hidden-ability-notice:last-child {
          margin-bottom: 0;
        }

        .description-section h4,
        .effect-section h4,
        .flavor-section h4,
        .stats-section h4,
        .activation-section h4 {
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
        }

        .ability-description,
        .ability-effect,
        .ability-flavor {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .ability-effect {
          background: var(--primary-bg);
          padding: var(--spacing-md);
          border-radius: var(--radius);
          border-left: 3px solid var(--primary);
        }

        .ability-flavor {
          font-style: italic;
          color: var(--text-muted);
          background: var(--surface);
          padding: var(--spacing-md);
          border-radius: var(--radius);
        }

        .stat-changes {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-sm);
        }

        .stat-change-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: var(--card-bg);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .stat-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        .stat-modifier {
          font-weight: 600;
          font-size: 0.875rem;
        }

        .stat-modifier.positive {
          color: var(--success);
        }

        .stat-modifier.negative {
          color: var(--error);
        }

        .activation-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .activation-rate {
          background: var(--accent-bg);
          color: var(--accent);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius);
          font-weight: 600;
          font-size: 0.875rem;
        }

        .hidden-ability-notice {
          background: linear-gradient(135deg, var(--accent-bg), var(--primary-bg));
          padding: var(--spacing-md);
          border-radius: var(--radius-lg);
          border: 1px solid var(--accent);
        }

        .hidden-badge {
          display: inline-block;
          background: var(--accent);
          color: white;
          padding: 0.25rem var(--spacing-sm);
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: var(--spacing-sm);
        }

        .hidden-ability-notice p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.875rem;
          line-height: 1.4;
        }

        .loading-content,
        .error-content {
          padding: var(--spacing-xl);
          text-align: center;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: glow 2s ease-in-out infinite alternate;
          margin-bottom: var(--spacing-md);
        }

        @keyframes glow {
          from { text-shadow: 0 0 5px rgba(218, 119, 242, 0.5); }
          to { text-shadow: 0 0 20px rgba(218, 119, 242, 0.8); }
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
          .ability-info-backdrop {
            padding: var(--spacing-md);
          }

          .modal-header,
          .ability-details {
            padding: var(--spacing-md);
          }

          .ability-name {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }

          .stat-changes {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AbilityInfo;
