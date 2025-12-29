'use client';

import React from 'react';
import { useCart } from '../../context/CartContext';

export default function CartButton({ className = '' }) {
  const { cartCount, toggleCart } = useCart();

  return (
    <button
      onClick={toggleCart}
      className={`relative p-2 hover:bg-white/10 rounded-lg transition-colors ${className}`}
      aria-label={`Panier (${cartCount} articles)`}
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
}
