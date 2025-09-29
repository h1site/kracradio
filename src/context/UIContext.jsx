// src/context/UIContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const Ctx = createContext({
  sidebarOpen: true,
  isDesktop: true,
  openSidebar: () => {},
  closeSidebar: () => {},
  toggleSidebar: () => {},
  sidebarWidth: 260,
});

const KEY = 'kracradio:sidebarOpen';

function getInitialOpen() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === 'true' || raw === 'false') return raw === 'true';
  } catch {}
  // par défaut: ouvert sur desktop, fermé sur mobile
  return window.innerWidth >= 1024;
}

export function UIProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(getInitialOpen);
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const value = useMemo(
    () => ({
      sidebarOpen,
      isDesktop,
      openSidebar,
      closeSidebar,
      toggleSidebar,
      sidebarWidth: 260,
    }),
    [sidebarOpen, isDesktop]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  return useContext(Ctx);
}
