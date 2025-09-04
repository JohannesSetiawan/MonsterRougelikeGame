import React from 'react';
import type { MonsterInstance } from '../api/types';
import MonsterStats from './MonsterStats';

interface MonsterStatsModalProps {
  monster: MonsterInstance;
  onClose: () => void;
}

const MonsterStatsModal: React.FC<MonsterStatsModalProps> = ({ monster, onClose }) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="monster-stats-modal-backdrop" onClick={handleBackdropClick}>
      <div className="monster-stats-modal">
        <div className="modal-header">
          <h2>Monster Details</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="modal-content">
          <MonsterStats monster={monster} showDetailed={true} />
        </div>
      </div>

      <style>{`
        .monster-stats-modal-backdrop {
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

        .monster-stats-modal {
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
          align-items: center;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }

        .modal-header h2 {
          margin: 0;
          color: var(--text-primary);
          font-size: 1.25rem;
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

        .modal-content {
          padding: 0;
        }

        .modal-content .monster-stats {
          border: none;
          border-radius: 0 0 var(--radius-xl) var(--radius-xl);
        }

        @media (max-width: 768px) {
          .monster-stats-modal-backdrop {
            padding: var(--spacing-md);
          }

          .monster-stats-modal {
            max-height: 85vh;
          }

          .modal-header {
            padding: var(--spacing-md);
          }

          .modal-header h2 {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MonsterStatsModal;
