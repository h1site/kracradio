// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Keep it minimal to avoid layout shifts
    return null;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location }} />;
  }

  return children;
}
