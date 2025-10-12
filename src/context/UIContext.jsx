import React from 'react';

const UIContext = React.createContext(null);

export function UIProvider({ children }) {
  // Largeur de la sidebar (w-64)
  const sidebarWidth = 256;

  // Desktop ?
  const getIsDesktop = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(min-width: 1024px)').matches;

  const [isDesktop, setIsDesktop] = React.useState(getIsDesktop);

  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Restaurer préférence (ancienne clé : collapsed)
  const [sidebarOpen, setSidebarOpen] = React.useState(() => {
    try {
      const raw = localStorage.getItem('krac.sideCollapsed');
      const collapsed = raw ? JSON.parse(raw) : false;
      return !collapsed; // si collapsed => open = false
    } catch {
      return true;
    }
  });

  // Persister à l’inverse (stocke "collapsed")
  React.useEffect(() => {
    try {
      localStorage.setItem('krac.sideCollapsed', JSON.stringify(!sidebarOpen));
    } catch {}
  }, [sidebarOpen]);

  // API
  const openSidebar  = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const value = {
    isDesktop,
    sidebarWidth,
    sidebarOpen: isDesktop ? sidebarOpen : false, // jamais "open" en mobile (pas de sidebar)
    setSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  const ctx = React.useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
}
