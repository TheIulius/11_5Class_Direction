import { useState, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

export type DrawerTier = 'none' | 'primary' | 'secondary';

export interface DrawerState {
  isPrimaryExpanded: boolean;
  isSecondaryExpanded: boolean;
  isChipsExpanded: boolean;
  activeTier: DrawerTier;
  togglePrimary: () => void;
  toggleSecondary: () => void;
  toggleChips: () => void;
  setPrimaryExpanded: (expanded: boolean) => void;
  setSecondaryExpanded: (expanded: boolean) => void;
  closeAll: () => void;
}

export function useDrawerState(initialPrimaryExpanded = false): DrawerState {
  const [isPrimaryExpanded, setIsPrimaryExpanded] = useState(initialPrimaryExpanded);
  const [isSecondaryExpanded, setIsSecondaryExpanded] = useState(false);
  const [isChipsExpanded, setIsChipsExpanded] = useState(true);

  const togglePrimary = useCallback(() => {
    triggerHaptic('light');
    setIsPrimaryExpanded((prev) => !prev);
    // If opening primary, ensure secondary isn't covering it
    setIsSecondaryExpanded(false);
  }, []);

  const toggleSecondary = useCallback(() => {
    triggerHaptic('light');
    setIsSecondaryExpanded((prev) => !prev);
  }, []);

  const toggleChips = useCallback(() => {
    triggerHaptic('light');
    setIsChipsExpanded((prev) => !prev);
  }, []);

  const setPrimary = useCallback((expanded: boolean) => {
    setIsPrimaryExpanded(expanded);
    if (expanded) setIsSecondaryExpanded(false);
  }, []);

  const setSecondary = useCallback((expanded: boolean) => {
    setIsSecondaryExpanded(expanded);
  }, []);

  const closeAll = useCallback(() => {
    setIsPrimaryExpanded(false);
    setIsSecondaryExpanded(false);
  }, []);

  const activeTier: DrawerTier = isSecondaryExpanded
    ? 'secondary'
    : isPrimaryExpanded
    ? 'primary'
    : 'none';

  return {
    isPrimaryExpanded,
    isSecondaryExpanded,
    isChipsExpanded,
    activeTier,
    togglePrimary,
    toggleSecondary,
    toggleChips,
    setPrimaryExpanded: setPrimary,
    setSecondaryExpanded: setSecondary,
    closeAll,
  };
}
