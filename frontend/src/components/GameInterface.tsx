import React from 'react';
import { useGame } from '../context/GameContext';
import TeamManagement from './TeamManagement';
import ItemInfo from './ItemInfo';
import DebugPage from './DebugPage';
import MonsterSelectionModal from './MonsterSelectionModal';
import Shop from './Shop';
import { GameHeader } from './GameHeader';
import { PermanentItemsSection } from './PermanentItemsSection';
import { TeamSection } from './TeamSection';
import { InventorySection } from './InventorySection';
import { ProgressSection } from './ProgressSection';
import { EncounterSection } from './EncounterSection';
import { useGameActions } from '../hooks/useGameActions';
import { useItemActions } from '../hooks/useItemActions';
import { useEncounterActions } from '../hooks/useEncounterActions';
import { useShopActions } from '../hooks/useShopActions';
import { useModals } from '../hooks/useModals';


const GameInterface: React.FC = () => {
  const { state } = useGame();
  
  // Custom hooks for different functionality
  const { handleEndRun, handleSaveProgress, handleProgressStage, isEndingRun, isSaving } = useGameActions();
  const { handleItemClick, handleMonsterSelection, processingItemId, showMonsterSelection, setShowMonsterSelection } = useItemActions();
  const { handleItemEncounter, handleRestSiteEncounter, isProcessingEncounter } = useEncounterActions();
  const { handleShopPurchase } = useShopActions();
  const { 
    showTeamManagement, 
    setShowTeamManagement, 
    selectedItem, 
    setSelectedItem, 
    showDebugPage, 
    setShowDebugPage, 
    showShop, 
    setShowShop 
  } = useModals();

  if (!state.currentRun) return null;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Game Header */}
        <GameHeader
          currentStage={state.currentRun.currentStage}
          currency={state.currentRun.currency}
          onTeamManagement={() => setShowTeamManagement(true)}
          onDebugPage={() => setShowDebugPage(true)}
          onSaveProgress={handleSaveProgress}
          onEndRun={() => handleEndRun('defeat')}
          isSaving={isSaving}
          isEndingRun={isEndingRun}
          isLoading={state.isLoading}
        />

        {/* Permanent Items Section */}
        <PermanentItemsSection permanentItems={state.currentRun.permanentItems || []} />

        {/* Team Section */}
        <TeamSection team={state.currentRun.team} />

        {/* Inventory Section */}
        <InventorySection
          inventory={state.currentRun.inventory}
          onItemClick={handleItemClick}
          onItemInfo={setSelectedItem}
          processingItemId={processingItemId}
          isLoading={state.isLoading}
        />

        {/* Progress Section */}
        {!state.currentEncounter && !state.battleState.inBattle && (
          <ProgressSection
            onProgressStage={handleProgressStage}
            onShowShop={() => setShowShop(true)}
            isLoading={state.isLoading}
          />
        )}

        {/* Encounter Section */}
        <EncounterSection
          encounter={state.currentEncounter}
          onItemEncounter={handleItemEncounter}
          onRestSiteEncounter={handleRestSiteEncounter}
          isProcessingEncounter={isProcessingEncounter}
          isLoading={state.isLoading}
        />

        {/* Team Management Modal */}
        {showTeamManagement && (
          <TeamManagement
            team={state.currentRun.team}
            onClose={() => setShowTeamManagement(false)}
          />
        )}

        {/* Item Info Modal */}
        {selectedItem && (
          <ItemInfo 
            itemId={selectedItem} 
            onClose={() => setSelectedItem(null)} 
          />
        )}

        {/* Debug Page Modal */}
        {showDebugPage && (
          <DebugPage 
            onClose={() => setShowDebugPage(false)} 
          />
        )}

        {/* Monster Selection Modal for items like rare candy */}
        {showMonsterSelection && state.currentRun && (
          <MonsterSelectionModal
            monsters={state.currentRun.team}
            itemName={state.currentRun.inventory.find(item => item.id === showMonsterSelection)?.name || showMonsterSelection}
            onSelectMonster={(monsterId) => handleMonsterSelection(showMonsterSelection, monsterId)}
            onClose={() => setShowMonsterSelection(null)}
            isProcessing={processingItemId === showMonsterSelection}
          />
        )}

        {/* Shop Modal */}
        {showShop && state.currentRun && (
          <Shop
            isOpen={showShop}
            onClose={() => setShowShop(false)}
            currentCurrency={state.currentRun.currency}
            onPurchase={handleShopPurchase}
          />
        )}
      </div>
    </div>
  );
};

export default GameInterface;
