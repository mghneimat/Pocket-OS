import { createContext, useContext } from 'react';

const SectionEditContext = createContext(null);

export function SectionEditProvider({ children, onClose, onSaved }) {
  return (
    <SectionEditContext.Provider value={{ isActive: true, onClose, onSaved }}>
      {children}
    </SectionEditContext.Provider>
  );
}

export function useSectionEdit() {
  const ctx = useContext(SectionEditContext);
  if (!ctx) {
    throw new Error('useSectionEdit must be used within SectionEditProvider');
  }
  return ctx;
}

/** Returns null when not editing from the app shell */
export function useSectionEditOptional() {
  return useContext(SectionEditContext);
}
