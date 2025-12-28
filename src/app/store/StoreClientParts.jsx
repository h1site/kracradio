'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';

const INITIAL_LOAD = 12;
const LOAD_MORE = 12;

// Product Card Component
function ProductCard({ product, index }) {
  const currentPrice = parseFloat(product.price || 0);
  const comparePrice = product.compare_at_price ? parseFloat(product.compare_at_price) : null;
  const hasDiscount = comparePrice && comparePrice > currentPrice;
  const discountPercent = hasDiscount ? Math.round((1 - currentPrice / comparePrice) * 100) : 0;

  return (
    <a
      href={`https://store.kracradio.com/products/${product.handle}`}
      target="_blank"
      rel="noopener noreferrer"
      className="product-card group block bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:bg-white/10 transition-all duration-300 hover:border-white/20 h-full"
      style={{ animationDelay: `${0.05 * (index % LOAD_MORE)}s` }}
    >
      <div className="aspect-square overflow-hidden relative">
        <img
          src={product.image_url || '/images/default-cover.jpg'}
          alt={product.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discountPercent}%
          </div>
        )}
        {product.available === false && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Rupture de stock</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white text-base line-clamp-2 group-hover:text-red-400 transition-colors mb-1">
          {product.title}
        </h3>
        {product.vendor && (
          <p className="text-xs text-gray-400 line-clamp-1 mb-2">
            {product.vendor}
          </p>
        )}
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-red-400">
                ${currentPrice.toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 line-through">
                ${comparePrice.toFixed(2)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-red-400">
              ${currentPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export default function StoreClientParts({ initialProducts }) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const loaderRef = useRef(null);
  const searchInputRef = useRef(null);

  // Extract unique categories/vendors
  const categories = useMemo(() => {
    const vendors = [...new Set(initialProducts.map(p => p.vendor).filter(Boolean))];
    return ['all', ...vendors];
  }, [initialProducts]);

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(product =>
        product.title?.toLowerCase().includes(query) ||
        product.vendor?.toLowerCase().includes(query) ||
        product.product_type?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(product => product.vendor === selectedCategory);
    }

    return result;
  }, [initialProducts, searchQuery, selectedCategory]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(INITIAL_LOAD);
  }, [searchQuery, selectedCategory]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (visibleCount >= filteredProducts.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + LOAD_MORE, filteredProducts.length));
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  if (initialProducts.length === 0) {
    return (
      <div className="text-center py-20">
        <svg className="w-20 h-20 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-gray-400 text-lg mb-4">Aucun produit disponible pour le moment</p>
        <a
          href="https://store.kracradio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition-colors"
        >
          Visiter la boutique Shopify
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-12 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 2 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }`}
              >
                {category === 'all' ? 'Tous' : category}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results count */}
      {(searchQuery || selectedCategory !== 'all') && (
        <p className="text-sm text-gray-400 mb-4">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'produit' : 'produits'}
          {searchQuery && ` pour "${searchQuery}"`}
          {selectedCategory !== 'all' && ` dans ${selectedCategory}`}
        </p>
      )}

      {filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-400 mb-4">Aucun résultat pour votre recherche</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>

          {/* Loader for infinite scroll */}
          {hasMore && (
            <div ref={loaderRef} className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </>
      )}

      {/* CTA to Shopify */}
      <div className="text-center mt-12 pt-8 border-t border-white/10">
        <p className="text-gray-400 mb-4">
          Vous voulez voir plus de produits ou finaliser votre commande?
        </p>
        <a
          href="https://store.kracradio.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-red-600 text-white rounded-full font-bold text-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
        >
          Aller à la boutique Shopify
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
