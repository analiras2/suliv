import { createContext, useContext, type ReactNode } from 'react';

const OfflineModeContext = createContext(false);

export interface OfflineModeProviderProps {
  isOffline: boolean;
  children: ReactNode;
}

export function OfflineModeProvider({ isOffline, children }: OfflineModeProviderProps) {
  return <OfflineModeContext.Provider value={isOffline}>{children}</OfflineModeContext.Provider>;
}

export function useOfflineMode(): boolean {
  return useContext(OfflineModeContext);
}
