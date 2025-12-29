'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../../context/CartContext';

export default function ProductDetail({ product, relatedProducts }) {
  const { addToCart } = useCart();
  const [selectedVariant, setSelectedVariant] = useState(product?.variants?.[0] || null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-24 h-24 mx-auto text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mb-2">Produit non trouvé</h1>
          <p className="text-gray-400 mb-6">Ce produit n'existe pas ou n'est plus disponible.</p>
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
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : [product.image_url].filter(Boolean);
  const currentPrice = parseFloat(selectedVariant?.price || product.price || 0);
  const comparePrice = selectedVariant?.compare_at_price || product.compare_at_price;
  const hasDiscount = comparePrice && parseFloat(comparePrice) > currentPrice;
  const discountPercent = hasDiscount ? Math.round((1 - currentPrice / parseFloat(comparePrice)) * 100) : 0;
  const isAvailable = product.available !== false && (selectedVariant?.available !== false);

  const handleAddToCart = () => {
    setIsAdding(true);
    addToCart(product, selectedVariant, quantity);
    setTimeout(() => setIsAdding(false), 500);
  };

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-8 animate-fade-in">
          <ol className="flex items-center gap-2 text-sm text-gray-400">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Accueil</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/store" className="hover:text-white transition-colors">Boutique</Link>
            </li>
            <li>/</li>
            <li className="text-white truncate max-w-[200px]">{product.title}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="aspect-square rounded-2xl overflow-hidden bg-white/5 mb-4">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600">
                  <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === idx ? 'border-red-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {/* Vendor */}
            {product.vendor && (
              <p className="text-red-400 text-sm font-semibold uppercase tracking-wider mb-2">
                {product.vendor}
              </p>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
              {product.title}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-red-400">
                ${currentPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-gray-500 line-through">
                    ${parseFloat(comparePrice).toFixed(2)}
                  </span>
                  <span className="px-2 py-1 bg-red-600 text-white text-sm font-bold rounded">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Availability */}
            <div className="mb-6">
              {isAvailable ? (
                <span className="inline-flex items-center gap-2 text-green-400 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  En stock
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-red-400 text-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Rupture de stock
                </span>
              )}
            </div>

            {/* Variants */}
            {product.variants?.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Variante
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.available === false}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-red-500 bg-red-500/20 text-white'
                          : 'border-white/20 text-gray-300 hover:border-white/40'
                      } ${variant.available === false ? 'opacity-50 cursor-not-allowed line-through' : ''}`}
                    >
                      {variant.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantité
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span className="w-12 text-center text-white text-xl font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || isAdding}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                isAvailable
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              } ${isAdding ? 'scale-95' : ''}`}
            >
              {isAdding ? (
                <>
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajouté!
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {isAvailable ? 'Ajouter au panier' : 'Rupture de stock'}
                </>
              )}
            </button>

            {/* Description */}
            {product.description && (
              <div className="mt-8 pt-8 border-t border-white/10">
                <h2 className="text-lg font-bold text-white mb-4">Description</h2>
                <div
                  className="text-gray-300 prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            )}

            {/* Tags */}
            {product.tags?.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">Produits similaires</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => {
                const price = parseFloat(p.price || 0);
                const compare = p.compare_at_price ? parseFloat(p.compare_at_price) : null;
                const discount = compare && compare > price;

                return (
                  <Link
                    key={p.id}
                    href={`/store/${p.handle}`}
                    className="group bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={p.image_url || '/images/default-cover.jpg'}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {discount && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                          -{Math.round((1 - price / compare) * 100)}%
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-red-400 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-red-400 font-bold text-sm mt-1">
                        ${price.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
