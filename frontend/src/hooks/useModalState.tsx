import React, { useState, useCallback, createContext, useContext } from 'react';

interface ModalState {
  isAnyModalOpen: boolean;
  registerModal: (modalId: string, isOpen: boolean) => void;
  unregisterModal: (modalId: string) => void;
}

const ModalStateContext = createContext<ModalState>({
  isAnyModalOpen: false,
  registerModal: () => {},
  unregisterModal: () => {}
});

export const useModalState = () => {
  const [openModals, setOpenModals] = useState<Set<string>>(new Set());

  const registerModal = useCallback((modalId: string, isOpen: boolean) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      if (isOpen) {
        newSet.add(modalId);
      } else {
        newSet.delete(modalId);
      }
      return newSet;
    });
  }, []);

  const unregisterModal = useCallback((modalId: string) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalId);
      return newSet;
    });
  }, []);

  const isAnyModalOpen = openModals.size > 0;

  return {
    isAnyModalOpen,
    registerModal,
    unregisterModal
  };
};

export const ModalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const modalState = useModalState();
  
  return (
    <ModalStateContext.Provider value={modalState}>
      {children}
    </ModalStateContext.Provider>
  );
};

export const useModalStateContext = () => {
  const context = useContext(ModalStateContext);
  if (!context) {
    throw new Error('useModalStateContext must be used within a ModalStateProvider');
  }
  return context;
};
