import React from 'react';
import type { MonsterInstance } from '../api/types';

interface MonsterStatsProps {
  monster: MonsterInstance;
  showDetailed?: boolean;
  className?: string;
}

const MonsterStats: React.FC<MonsterStatsProps> = ({ 
  monster, 
  showDetailed = false, 
  className = '' 
}) => {
  const getStatBarWidth = (stat: number, maxStat: number = 200) => {
    return Math.min((stat / maxStat) * 100, 100);
  };

  const getStatColor = (stat: number) => {
    if (stat >= 120) return '#10b981'; // High stat - green
    if (stat >= 80) return '#3b82f6';  // Good stat - blue
    if (stat >= 50) return '#f59e0b';  // Average stat - yellow
    return '#ef4444'; // Low stat - red
  };

  const getHealthPercentage = () => {
    return (monster.currentHp / monster.maxHp) * 100;
  };

  const getExperiencePercentage = () => {
    const expRequired = monster.level * 100;
    return (monster.experience / expRequired) * 100;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 70) return '#10b981';
    if (percentage > 30) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={`monster-stats ${className}`}>
      {/* Basic Info */}
      <div className="monster-header">
        <div className="monster-name-level">
          <h3>{monster.name} {monster.isShiny && '✨'}</h3>
          <span className="level">Lv.{monster.level}</span>
        </div>
        <div className="monster-ability">
          <span className="ability-label">Ability:</span>
          <span className="ability-name">{monster.ability}</span>
        </div>
      </div>

      {/* Health Bar */}
      <div className="stat-section">
        <div className="stat-label-row">
          <span className="stat-label">HP</span>
          <span className="stat-value">{monster.currentHp}/{monster.maxHp}</span>
        </div>
        <div className="stat-bar health-bar">
          <div 
            className="stat-fill health-fill"
            style={{ 
              width: `${getHealthPercentage()}%`,
              backgroundColor: getHealthColor(getHealthPercentage())
            }}
          />
        </div>
      </div>

      {/* Experience Bar */}
      <div className="stat-section">
        <div className="stat-label-row">
          <span className="stat-label">EXP</span>
          <span className="stat-value">{monster.experience}/{monster.level * 100}</span>
        </div>
        <div className="stat-bar exp-bar">
          <div 
            className="stat-fill exp-fill"
            style={{ width: `${getExperiencePercentage()}%` }}
          />
        </div>
      </div>

      {/* Detailed Stats */}
      {showDetailed && (
        <div className="detailed-stats">
          <h4>Base Stats</h4>
          <div className="stats-grid">
            <div className="stat-row">
              <span className="stat-name">Attack</span>
              <span className="stat-number">{monster.stats.attack}</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${getStatBarWidth(monster.stats.attack)}%`,
                    backgroundColor: getStatColor(monster.stats.attack)
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-name">Defense</span>
              <span className="stat-number">{monster.stats.defense}</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${getStatBarWidth(monster.stats.defense)}%`,
                    backgroundColor: getStatColor(monster.stats.defense)
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-name">Sp. Attack</span>
              <span className="stat-number">{monster.stats.specialAttack}</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${getStatBarWidth(monster.stats.specialAttack)}%`,
                    backgroundColor: getStatColor(monster.stats.specialAttack)
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-name">Sp. Defense</span>
              <span className="stat-number">{monster.stats.specialDefense}</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${getStatBarWidth(monster.stats.specialDefense)}%`,
                    backgroundColor: getStatColor(monster.stats.specialDefense)
                  }}
                />
              </div>
            </div>

            <div className="stat-row">
              <span className="stat-name">Speed</span>
              <span className="stat-number">{monster.stats.speed}</span>
              <div className="stat-bar">
                <div 
                  className="stat-fill"
                  style={{ 
                    width: `${getStatBarWidth(monster.stats.speed)}%`,
                    backgroundColor: getStatColor(monster.stats.speed)
                  }}
                />
              </div>
            </div>
          </div>

          {/* Moves */}
          <div className="moves-section">
            <h4>Moves</h4>
            <div className="moves-list">
              {monster.moves.map((moveId, index) => (
                <div key={index} className="move-item">
                  <span className="move-name">{moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .monster-stats {
          background: var(--card-bg);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-md);
          backdrop-filter: blur(4px);
        }

        .monster-header {
          margin-bottom: var(--spacing-lg);
        }

        .monster-name-level {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-sm);
        }

        .monster-name-level h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .level {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .monster-ability {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
          font-size: 0.875rem;
        }

        .ability-label {
          color: var(--text-secondary);
          font-weight: 500;
        }

        .ability-name {
          color: var(--accent);
          font-weight: 600;
          text-transform: capitalize;
          padding: 0.25rem 0.5rem;
          background: var(--accent-bg);
          border-radius: var(--radius-sm);
        }

        .stat-section {
          margin-bottom: var(--spacing-md);
        }

        .stat-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .stat-value {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .stat-bar {
          height: 8px;
          background: var(--surface);
          border-radius: var(--radius-sm);
          overflow: hidden;
          position: relative;
        }

        .stat-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.2s ease;
          border-radius: var(--radius-sm);
        }

        .health-fill {
          background: #10b981;
        }

        .exp-fill {
          background: var(--primary);
        }

        .detailed-stats {
          margin-top: var(--spacing-lg);
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--border);
        }

        .detailed-stats h4 {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--text-primary);
          font-size: 1rem;
          font-weight: 600;
        }

        .stats-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        .stat-row {
          display: grid;
          grid-template-columns: 1fr auto 2fr;
          gap: var(--spacing-md);
          align-items: center;
        }

        .stat-name {
          font-size: 0.875rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .stat-number {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 600;
          min-width: 3rem;
          text-align: right;
        }

        .moves-section {
          margin-top: var(--spacing-lg);
        }

        .moves-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--spacing-sm);
        }

        .move-item {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: var(--spacing-sm);
          text-align: center;
        }

        .move-name {
          font-size: 0.875rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        /* Compact version for battle */
        .monster-stats.compact {
          padding: var(--spacing-md);
        }

        .monster-stats.compact .monster-header {
          margin-bottom: var(--spacing-md);
        }

        .monster-stats.compact .stat-section {
          margin-bottom: var(--spacing-sm);
        }

        @media (max-width: 768px) {
          .stat-row {
            grid-template-columns: 1fr auto;
            gap: var(--spacing-sm);
          }

          .stat-row .stat-bar {
            grid-column: 1 / -1;
            margin-top: 0.25rem;
          }

          .moves-list {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default MonsterStats;
