'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

const SUPABASE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;

export default function CheckoutClient() {
  const { cart, cartSubtotal, removeFromCart, updateQuantity, clearCart, isLoading, setIsLoading } = useCart();
  const [step, setStep] = useState(1); // 1: Cart, 2: Shipping, 3: Payment
  const [shippingInfo, setShippingInfo] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    apartment: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'CA',
    phone: '',
  });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [error, setError] = useState('');
  const [checkoutUrl, setCheckoutUrl] = useState('');

  const shippingCosts = {
    standard: 9.99,
    express: 19.99,
    free: 0,
  };

  // Free shipping over $75
  const qualifiesForFreeShipping = cartSubtotal >= 75;
  const shippingCost = qualifiesForFreeShipping ? 0 : shippingCosts[shippingMethod];
  const taxRate = 0.14975; // Quebec tax rate
  const taxes = (cartSubtotal + shippingCost) * taxRate;
  const total = cartSubtotal + shippingCost + taxes;

  // Create Shopify checkout
  const createCheckout = async () => {
    if (!SUPABASE_FUNCTIONS_URL) {
      setError('Service de paiement non disponible');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const lineItems = cart.map(item => ({
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/shopify-create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineItems,
          email: shippingInfo.email,
          shippingAddress: {
            firstName: shippingInfo.firstName,
            lastName: shippingInfo.lastName,
            address1: shippingInfo.address,
            address2: shippingInfo.apartment,
            city: shippingInfo.city,
            province: shippingInfo.province,
            zip: shippingInfo.postalCode,
            country: shippingInfo.country,
            phone: shippingInfo.phone,
          },
        }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl);
        // Redirect to Shopify checkout
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Erreur lors de la création du paiement');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    // Validate form
    const required = ['email', 'firstName', 'lastName', 'address', 'city', 'province', 'postalCode'];
    const missing = required.filter(field => !shippingInfo[field].trim());

    if (missing.length > 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      setError('Veuillez entrer une adresse courriel valide');
      return;
    }

    setError('');
    setStep(3);
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <svg className="w-24 h-24 mx-auto text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="text-2xl font-bold text-white mb-2">Votre panier est vide</h1>
        <p className="text-gray-400 mb-6">Ajoutez des produits pour passer une commande</p>
        <Link
          href="/store"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-semibold transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link href="/store" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Continuer mes achats
        </Link>
        <h1 className="text-3xl font-bold text-white">Paiement</h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => s < step && setStep(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                s === step
                  ? 'bg-red-600 text-white'
                  : s < step
                  ? 'bg-green-600 text-white cursor-pointer hover:bg-green-700'
                  : 'bg-white/10 text-gray-500'
              }`}
            >
              {s < step ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                s
              )}
            </button>
            {s < 3 && <div className={`w-16 h-1 rounded ${s < step ? 'bg-green-600' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 1: Cart Review */}
          {step === 1 && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Votre panier</h2>
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.variantId} className="flex gap-4 py-4 border-b border-white/10 last:border-0">
                    <Link href={`/store/${item.handle}`} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-white/10">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold line-clamp-2">{item.title}</h3>
                      {item.variant && <p className="text-gray-400 text-sm">{item.variant}</p>}
                      <p className="text-red-400 font-bold mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-white"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg text-white"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="ml-2 p-2 text-gray-400 hover:text-red-500"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="w-full mt-6 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
              >
                Continuer vers la livraison
              </button>
            </div>
          )}

          {/* Step 2: Shipping Info */}
          {step === 2 && (
            <form onSubmit={handleShippingSubmit} className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Informations de livraison</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Courriel *</label>
                  <input
                    type="email"
                    value={shippingInfo.email}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="votre@email.com"
                    required
                  />
                </div>

                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={shippingInfo.firstName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={shippingInfo.lastName}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Adresse *</label>
                  <input
                    type="text"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="123 rue Example"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Appartement, suite, etc.</label>
                  <input
                    type="text"
                    value={shippingInfo.apartment}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, apartment: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                {/* City, Province, Postal */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ville *</label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Province *</label>
                    <select
                      value={shippingInfo.province}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, province: e.target.value })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">--</option>
                      <option value="QC">Québec</option>
                      <option value="ON">Ontario</option>
                      <option value="BC">Colombie-Britannique</option>
                      <option value="AB">Alberta</option>
                      <option value="MB">Manitoba</option>
                      <option value="SK">Saskatchewan</option>
                      <option value="NS">Nouvelle-Écosse</option>
                      <option value="NB">Nouveau-Brunswick</option>
                      <option value="NL">Terre-Neuve-et-Labrador</option>
                      <option value="PE">Île-du-Prince-Édouard</option>
                      <option value="NT">Territoires du Nord-Ouest</option>
                      <option value="YT">Yukon</option>
                      <option value="NU">Nunavut</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Code postal *</label>
                    <input
                      type="text"
                      value={shippingInfo.postalCode}
                      onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="H2X 1Y4"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({ ...shippingInfo, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="514-555-0123"
                  />
                </div>

                {/* Shipping Method */}
                <div className="pt-4 border-t border-white/10">
                  <label className="block text-sm font-medium text-gray-300 mb-3">Méthode de livraison</label>
                  <div className="space-y-2">
                    {qualifiesForFreeShipping && (
                      <label className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl cursor-pointer">
                        <input
                          type="radio"
                          name="shipping"
                          value="free"
                          checked={shippingMethod === 'free' || qualifiesForFreeShipping}
                          onChange={() => setShippingMethod('free')}
                          className="text-red-600"
                        />
                        <div className="flex-1">
                          <span className="text-white font-medium">Livraison gratuite</span>
                          <p className="text-sm text-green-400">Commande de 75$ et plus</p>
                        </div>
                        <span className="text-green-400 font-bold">Gratuit</span>
                      </label>
                    )}
                    {!qualifiesForFreeShipping && (
                      <>
                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                          <input
                            type="radio"
                            name="shipping"
                            value="standard"
                            checked={shippingMethod === 'standard'}
                            onChange={() => setShippingMethod('standard')}
                            className="text-red-600"
                          />
                          <div className="flex-1">
                            <span className="text-white font-medium">Livraison standard</span>
                            <p className="text-sm text-gray-400">5-7 jours ouvrables</p>
                          </div>
                          <span className="text-white font-bold">$9.99</span>
                        </label>
                        <label className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10">
                          <input
                            type="radio"
                            name="shipping"
                            value="express"
                            checked={shippingMethod === 'express'}
                            onChange={() => setShippingMethod('express')}
                            className="text-red-600"
                          />
                          <div className="flex-1">
                            <span className="text-white font-medium">Livraison express</span>
                            <p className="text-sm text-gray-400">2-3 jours ouvrables</p>
                          </div>
                          <span className="text-white font-bold">$19.99</span>
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                >
                  Retour
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  Continuer vers le paiement
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">Paiement sécurisé</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                  {error}
                </div>
              )}

              {/* Shipping Summary */}
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <h3 className="text-white font-medium mb-2">Livrer à:</h3>
                <p className="text-gray-300">
                  {shippingInfo.firstName} {shippingInfo.lastName}<br />
                  {shippingInfo.address}{shippingInfo.apartment && `, ${shippingInfo.apartment}`}<br />
                  {shippingInfo.city}, {shippingInfo.province} {shippingInfo.postalCode}<br />
                  {shippingInfo.email}
                </p>
              </div>

              {/* Payment Info */}
              <div className="mb-6">
                <p className="text-gray-300 mb-4">
                  Vous serez redirigé vers notre processeur de paiement sécurisé Shopify pour finaliser votre commande.
                </p>
                <div className="flex items-center gap-4 text-gray-400">
                  <svg className="w-8 h-8" viewBox="0 0 50 50" fill="currentColor">
                    <path d="M25 2C12.3 2 2 12.3 2 25s10.3 23 23 23 23-10.3 23-23S37.7 2 25 2zm0 5c9.9 0 18 8.1 18 18s-8.1 18-18 18S7 34.9 7 25 15.1 7 25 7z"/>
                    <path d="M23 15h4v12h-4zM23 31h4v4h-4z"/>
                  </svg>
                  <span className="text-sm">Paiement 100% sécurisé par Shopify</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={createCheckout}
                  disabled={isLoading}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirection...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Payer ${total.toFixed(2)}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10 sticky top-4">
            <h2 className="text-xl font-bold text-white mb-4">Résumé</h2>

            {/* Items */}
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.variantId} className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 relative">
                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm line-clamp-1">{item.title}</p>
                    {item.variant && <p className="text-gray-500 text-xs">{item.variant}</p>}
                  </div>
                  <span className="text-white text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4 space-y-2">
              <div className="flex justify-between text-gray-300">
                <span>Sous-total</span>
                <span>${cartSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Livraison</span>
                <span>{shippingCost === 0 ? 'Gratuit' : `$${shippingCost.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-300">
                <span>Taxes (TPS/TVQ)</span>
                <span>${taxes.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white text-lg font-bold pt-2 border-t border-white/10">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {!qualifiesForFreeShipping && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-sm text-red-400">
                  Ajoutez ${(75 - cartSubtotal).toFixed(2)} pour la livraison gratuite!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
