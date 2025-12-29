'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'kracradio_cart';

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  }, []);

  // Save cart to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cart]);

  // Add item to cart
  const addToCart = useCallback((product, variant = null, quantity = 1) => {
    setCart((prevCart) => {
      const variantId = variant?.id || product.variants?.[0]?.id || product.id;
      const existingIndex = prevCart.findIndex(
        (item) => item.variantId === variantId
      );

      if (existingIndex > -1) {
        // Update quantity if item exists
        const updatedCart = [...prevCart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + quantity,
        };
        return updatedCart;
      }

      // Add new item
      return [
        ...prevCart,
        {
          id: product.id,
          variantId,
          title: product.title,
          variant: variant?.title || product.variants?.[0]?.title || null,
          price: parseFloat(variant?.price || product.price || 0),
          compareAtPrice: variant?.compare_at_price || product.compare_at_price || null,
          image: variant?.image_url || product.image_url || product.images?.[0] || null,
          handle: product.handle,
          quantity,
          availableQuantity: variant?.inventory_quantity || product.inventory_quantity || 999,
        },
      ];
    });

    // Open cart drawer when adding
    setIsCartOpen(true);
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((variantId) => {
    setCart((prevCart) => prevCart.filter((item) => item.variantId !== variantId));
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((variantId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: Math.min(quantity, item.availableQuantity) }
          : item
      )
    );
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  // Calculate totals
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Toggle cart drawer
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const value = {
    cart,
    cartCount,
    cartSubtotal,
    isCartOpen,
    isLoading,
    setIsLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
