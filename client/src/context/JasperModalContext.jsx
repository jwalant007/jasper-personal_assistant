import React, { createContext, useContext, useState, useCallback } from 'react';

const JasperModalContext = createContext(null);

export function JasperModalProvider({ children }) {
  // Modal visibility map: { [modalId: string]: boolean }
  const [openModals, setOpenModals] = useState({});
  // Optional modal payload data: { [modalId: string]: any }
  const [modalData, setModalData] = useState({});

  const isModalOpen = useCallback((modalId) => {
    return !!openModals[modalId];
  }, [openModals]);

  const getModalData = useCallback((modalId) => {
    return modalData[modalId] || null;
  }, [modalData]);

  const openModal = useCallback((modalId, data = null) => {
    setOpenModals(prev => ({ ...prev, [modalId]: true }));
    if (data !== null) {
      setModalData(prev => ({ ...prev, [modalId]: data }));
    }
  }, []);

  const closeModal = useCallback((modalId) => {
    setOpenModals(prev => ({ ...prev, [modalId]: false }));
    setModalData(prev => {
      const next = { ...prev };
      delete next[modalId];
      return next;
    });
  }, []);

  const toggleModal = useCallback((modalId, data = null) => {
    setOpenModals(prev => {
      const nextState = !prev[modalId];
      if (!nextState) {
        setModalData(d => {
          const nd = { ...d };
          delete nd[modalId];
          return nd;
        });
      } else if (data !== null) {
        setModalData(d => ({ ...d, [modalId]: data }));
      }
      return { ...prev, [modalId]: nextState };
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals({});
    setModalData({});
  }, []);

  const value = {
    openModals,
    modalData,
    isModalOpen,
    getModalData,
    openModal,
    closeModal,
    toggleModal,
    closeAllModals
  };

  return (
    <JasperModalContext.Provider value={value}>
      {children}
    </JasperModalContext.Provider>
  );
}

export function useJasperModals() {
  const context = useContext(JasperModalContext);
  if (!context) {
    throw new Error('useJasperModals must be used within a JasperModalProvider');
  }
  return context;
}
