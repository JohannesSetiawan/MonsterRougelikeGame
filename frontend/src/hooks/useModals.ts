import React from 'react';

export const useModals = () => {
  const [showTeamManagement, setShowTeamManagement] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);
  const [showDebugPage, setShowDebugPage] = React.useState(false);
  const [showShop, setShowShop] = React.useState(false);

  // Debug mode keyboard shortcut (Ctrl+Shift+D)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugPage(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    showTeamManagement,
    setShowTeamManagement,
    selectedItem,
    setSelectedItem,
    showDebugPage,
    setShowDebugPage,
    showShop,
    setShowShop
  };
};
