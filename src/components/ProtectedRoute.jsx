// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('[ProtectedRoute] loading:', loading, 'user:', user?.email);

  if (loading) {
    console.log('[ProtectedRoute] Still loading, returning null');
    // Keep it minimal to avoid layout shifts
    return null;
  }

  if (!user) {
    console.log('[ProtectedRoute] No user, redirecting to /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('[ProtectedRoute] User authenticated, rendering children');
  return children;
}
