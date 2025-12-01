'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';
import Sidebar from './Sidebar';
import PlayerBar from './PlayerBar';
import Footer from './Footer';
import NotificationPopup from './NotificationPopup';
import { useUI } from '../context/UIContext';

export default function AppLayout({ children }) {
  const { isDesktop, sidebarOpen, sidebarWidth } = useUI();
  const pathname = usePathname();

  // Pages pleine largeur sans marge (Schedule uniquement)
  const fullWidthPages = ['/schedule'];
  const isFullWidth = fullWidthPages.includes(pathname) || pathname.startsWith('/article/');

  const mainStyle = {
    paddingBottom: 0,
    marginLeft: isFullWidth ? 0 : (isDesktop && sidebarOpen ? sidebarWidth : 0),
    transition: 'margin-left 300ms ease',
    minHeight: '100vh',
  };

  return (
    <div className="bg-white text-black dark:bg-[#1e1e1e] dark:text-white">
      <Header />
      <NotificationPopup />
      <Sidebar />
      <main style={mainStyle}>
        {children}
      </main>
      <Footer />
      <PlayerBar />
    </div>
  );
}
