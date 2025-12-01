'use client';
import React from 'react';

const UIContext = React.createContext(null);

export function UIProvider({ children }) {
  // Largeur de la sidebar (w-64)
  const sidebarWidth = 256;

  // Track if we're mounted (client-side)
  const [mounted, setMounted] = React.useState(false);

  // Desktop ? - Start with false on server to avoid hydration mismatch
  const [isDesktop, setIsDesktop] = React.useState(false);

  // Sidebar open state - Start with false on server
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  // Initialize client-side values after mount
  React.useEffect(() => {
    setMounted(true);

    // Set initial desktop state
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);

    // Set initial sidebar state from localStorage
    try {
      const raw = localStorage.getItem('krac.sideCollapsed');
      const collapsed = raw ? JSON.parse(raw) : false;
      setSidebarOpen(!collapsed);
    } catch {
      setSidebarOpen(true);
    }

    // Listen for changes
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Persister à l'inverse (stocke "collapsed") - only after initial mount
  React.useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem('krac.sideCollapsed', JSON.stringify(!sidebarOpen));
    } catch {}
  }, [sidebarOpen, mounted]);

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
