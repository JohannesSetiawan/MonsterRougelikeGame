import React, { useState } from 'react';
import type { MonsterInstance } from '../api/types';
import MonsterStatsModal from './MonsterStatsModal';

interface TeamManagementProps {
  team: MonsterInstance[];
  onClose: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ team, onClose }) => {
  const [selectedMonster, setSelectedMonster] = useState<MonsterInstance | null>(null);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getHealthPercentage = (current: number, max: number) => {
    return (current / max) * 100;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage > 70) return '#10b981';
    if (percentage > 30) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="team-management-backdrop" onClick={handleBackdropClick}>
      <div className="team-management-modal">
        <div className="modal-header">
          <h2>Your Team</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="team-grid">
          {team.map((monster) => (
            <div key={monster.id} className="team-member-card">
              <div className="team-member-header">
                <div className="monster-name-level">
                  <h3>{monster.name} {monster.isShiny && '✨'}</h3>
                  <span className="level">Lv.{monster.level}</span>
                </div>
                <button
                  className="view-stats-button"
                  onClick={() => setSelectedMonster(monster)}
                  title="View detailed stats"
                >
                  📊
                </button>
              </div>

              <div className="monster-quick-info">
                <div className="ability-display">
                  <span className="ability-label">Ability:</span>
                  <span className="ability-name">{monster.ability}</span>
                </div>

                <div className="health-section">
                  <div className="stat-label-row">
                    <span>HP</span>
                    <span>{monster.currentHp}/{monster.maxHp}</span>
                  </div>
                  <div className="health-bar">
                    <div 
                      className="health-fill"
                      style={{ 
                        width: `${getHealthPercentage(monster.currentHp, monster.maxHp)}%`,
                        backgroundColor: getHealthColor(getHealthPercentage(monster.currentHp, monster.maxHp))
                      }}
                    />
                  </div>
                </div>

                <div className="exp-section">
                  <div className="stat-label-row">
                    <span>EXP</span>
                    <span>{monster.experience}/{monster.level * 100}</span>
                  </div>
                  <div className="exp-bar">
                    <div 
                      className="exp-fill"
                      style={{ width: `${(monster.experience / (monster.level * 100)) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="moves-preview">
                  <h4>Moves</h4>
                  <div className="moves-list-compact">
                    {monster.moves.map((moveId, index) => (
                      <span key={index} className="move-tag">
                        {moveId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {monster.currentHp === 0 && (
                <div className="fainted-overlay">
                  <span>💀 Fainted</span>
                </div>
              )}
            </div>
          ))}

          {team.length === 0 && (
            <div className="empty-team">
              <p>No monsters in your team yet!</p>
            </div>
          )}
        </div>

        {selectedMonster && (
          <MonsterStatsModal
            monster={selectedMonster}
            onClose={() => setSelectedMonster(null)}
          />
        )}
      </div>

      <style>{`
        .team-management-backdrop {
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

        .team-management-modal {
          background: var(--bg-primary);
          border: 2px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .modal-header h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.5rem;
          font-weight: 600;
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
        }

        .close-button:hover {
          background: var(--error-bg);
          color: var(--error);
          transform: scale(1.1);
        }

        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
        }

        .team-member-card {
          background: var(--card-bg);
          border: 2px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          position: relative;
          transition: all 0.2s ease;
        }

        .team-member-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .team-member-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-md);
        }

        .monster-name-level {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .monster-name-level h3 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.125rem;
          font-weight: 600;
        }

        .level {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: var(--radius);
          font-size: 0.75rem;
          font-weight: 600;
          align-self: flex-start;
        }

        .view-stats-button {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.5rem;
          font-size: 1.125rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2.25rem;
          height: 2.25rem;
        }

        .view-stats-button:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }

        .monster-quick-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .ability-display {
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

        .health-section,
        .exp-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .stat-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .stat-label-row span:first-child {
          color: var(--text-primary);
        }

        .stat-label-row span:last-child {
          color: var(--text-secondary);
        }

        .health-bar,
        .exp-bar {
          height: 6px;
          background: var(--surface);
          border-radius: var(--radius-sm);
          overflow: hidden;
        }

        .health-fill,
        .exp-fill {
          height: 100%;
          transition: width 0.3s ease;
          border-radius: var(--radius-sm);
        }

        .exp-fill {
          background: var(--primary);
        }

        .moves-preview h4 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
          font-size: 0.875rem;
          font-weight: 600;
        }

        .moves-list-compact {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        .move-tag {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .fainted-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--error);
          font-weight: 600;
          font-size: 1.125rem;
        }

        .empty-team {
          grid-column: 1 / -1;
          text-align: center;
          color: var(--text-secondary);
          padding: var(--spacing-xl);
        }

        @media (max-width: 768px) {
          .team-management-backdrop {
            padding: var(--spacing-md);
          }

          .team-grid {
            grid-template-columns: 1fr;
            padding: var(--spacing-md);
            gap: var(--spacing-md);
          }

          .modal-header {
            padding: var(--spacing-md);
          }

          .team-member-card {
            padding: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

export default TeamManagement;
