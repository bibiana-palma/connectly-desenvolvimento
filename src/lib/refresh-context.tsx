import React, { createContext, useContext, useState } from 'react';

type RefreshContextType = {
  version: number;
  bump: () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  return <RefreshContext.Provider value={{ version, bump }}>{children}</RefreshContext.Provider>;
}

export function useRefresh() {
  const ctx = useContext(RefreshContext);
  if (!ctx) throw new Error('useRefresh must be used within a RefreshProvider');
  return ctx;
}

export default RefreshContext;
