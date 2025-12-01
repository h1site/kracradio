'use client';
// src/components/ProtectedRoute.jsx
import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import RedirectTo from './RedirectTo';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  console.log('[ProtectedRoute] loading:', loading, 'user:', user?.email);

  if (loading) {
    console.log('[ProtectedRoute] Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-500 rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to /login');
    return <RedirectTo href={`/login?from=${encodeURIComponent(pathname)}`} replace />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering children');
  return children;
}
