'use client';
// src/pages/StoreDashboard.jsx
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase } from '../lib/supabase';

const STRINGS = {
  fr: {
    title: 'Ma Boutique',
    description: 'Gérez vos morceaux en vente sur store.kracradio.com',
    back: '← Retour au dashboard',

    // Stats
    totalSales: 'Ventes totales',
    totalRevenue: 'Revenus totaux',
    tracksLive: 'Morceaux en vente',
    pendingReview: 'En attente',

    // Tabs
    tabSubmissions: 'Soumissions',
    tabProducts: 'Produits',
    tabSales: 'Ventes',

    // Submissions
    newSubmission: 'Soumettre un morceau',
    noSubmissions: 'Aucune soumission',
    noSubmissionsDesc: 'Soumettez votre premier morceau pour le mettre en vente',

    // Status
    statusPending: 'En attente',
    statusApproved: 'Approuvé',
    statusRejected: 'Refusé',
    statusLive: 'En vente',
    statusDisabled: 'Désactivé',

    // Table
    track: 'Morceau',
    price: 'Prix',
    status: 'Statut',
    date: 'Date',
    actions: 'Actions',
    view: 'Voir',
    sales: 'ventes',
    revenue: 'revenus',

    // Sales
    noSales: 'Aucune vente',
    noSalesDesc: 'Les ventes apparaîtront ici une fois que vous aurez des produits en vente',
    orderDate: 'Date de commande',
    quantity: 'Quantité',
    yourRevenue: 'Votre revenu',

    // Products
    noProducts: 'Aucun produit',
    noProductsDesc: 'Vos produits approuvés apparaîtront ici',

    // Loading
    loading: 'Chargement...',
  },
  en: {
    title: 'My Store',
    description: 'Manage your tracks for sale on store.kracradio.com',
    back: '← Back to dashboard',

    // Stats
    totalSales: 'Total Sales',
    totalRevenue: 'Total Revenue',
    tracksLive: 'Tracks for Sale',
    pendingReview: 'Pending Review',

    // Tabs
    tabSubmissions: 'Submissions',
    tabProducts: 'Products',
    tabSales: 'Sales',

    // Submissions
    newSubmission: 'Submit a track',
    noSubmissions: 'No submissions',
    noSubmissionsDesc: 'Submit your first track to put it up for sale',

    // Status
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',
    statusLive: 'Live',
    statusDisabled: 'Disabled',

    // Table
    track: 'Track',
    price: 'Price',
    status: 'Status',
    date: 'Date',
    actions: 'Actions',
    view: 'View',
    sales: 'sales',
    revenue: 'revenue',

    // Sales
    noSales: 'No sales',
    noSalesDesc: 'Sales will appear here once you have products for sale',
    orderDate: 'Order Date',
    quantity: 'Quantity',
    yourRevenue: 'Your Revenue',

    // Products
    noProducts: 'No products',
    noProductsDesc: 'Your approved products will appear here',

    // Loading
    loading: 'Loading...',
  },
  es: {
    title: 'Mi Tienda',
    description: 'Administra tus pistas a la venta en store.kracradio.com',
    back: '← Volver al dashboard',

    // Stats
    totalSales: 'Ventas totales',
    totalRevenue: 'Ingresos totales',
    tracksLive: 'Pistas en venta',
    pendingReview: 'En revisión',

    // Tabs
    tabSubmissions: 'Envíos',
    tabProducts: 'Productos',
    tabSales: 'Ventas',

    // Submissions
    newSubmission: 'Enviar una pista',
    noSubmissions: 'Sin envíos',
    noSubmissionsDesc: 'Envía tu primera pista para ponerla a la venta',

    // Status
    statusPending: 'Pendiente',
    statusApproved: 'Aprobado',
    statusRejected: 'Rechazado',
    statusLive: 'En venta',
    statusDisabled: 'Deshabilitado',

    // Table
    track: 'Pista',
    price: 'Precio',
    status: 'Estado',
    date: 'Fecha',
    actions: 'Acciones',
    view: 'Ver',
    sales: 'ventas',
    revenue: 'ingresos',

    // Sales
    noSales: 'Sin ventas',
    noSalesDesc: 'Las ventas aparecerán aquí una vez que tengas productos a la venta',
    orderDate: 'Fecha de pedido',
    quantity: 'Cantidad',
    yourRevenue: 'Tu ingreso',

    // Products
    noProducts: 'Sin productos',
    noProductsDesc: 'Tus productos aprobados aparecerán aquí',

    // Loading
    loading: 'Cargando...',
  },
};

function StatusBadge({ status, L }) {
  const styles = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    live: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    disabled: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
  };

  const labels = {
    pending: L.statusPending,
    approved: L.statusApproved,
    rejected: L.statusRejected,
    live: L.statusLive,
    disabled: L.statusDisabled,
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function StoreDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('submissions');
  const [submissions, setSubmissions] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    tracksLive: 0,
    pendingReview: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load submissions
      const { data: submissionsData } = await supabase
        .from('store_submissions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setSubmissions(submissionsData || []);

      // Load products
      const { data: productsData } = await supabase
        .from('store_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProducts(productsData || []);

      // Load sales
      const { data: salesData } = await supabase
        .from('store_sales')
        .select('*')
        .eq('user_id', user.id)
        .order('order_date', { ascending: false });

      setSales(salesData || []);

      // Calculate stats
      const totalSalesCount = salesData?.reduce((sum, s) => sum + (s.quantity || 1), 0) || 0;
      const totalRevenueAmount = salesData?.reduce((sum, s) => sum + parseFloat(s.revenue_artist || 0), 0) || 0;
      const tracksLiveCount = productsData?.filter(p => p.status === 'live').length || 0;
      const pendingCount = submissionsData?.filter(s => s.status === 'pending').length || 0;

      setStats({
        totalSales: totalSalesCount,
        totalRevenue: totalRevenueAmount,
        tracksLive: tracksLiveCount,
        pendingReview: pendingCount,
      });
    } catch (error) {
      console.error('Error loading store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-CA' : lang === 'es' ? 'es-ES' : 'en-CA', {
      style: 'currency',
      currency: 'CAD',
    }).format(amount || 0);
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Seo lang={lang} title={L.title} description={L.description} path="/dashboard/store" type="website" />

      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-block"
              >
                {L.back}
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{L.title}</h1>
            </div>
            <Link
              href="/store/submit"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {L.newSubmission}
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalSales}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.totalSales}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalRevenue}</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.tracksLive}</p>
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-1">{stats.tracksLive}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.pendingReview}</p>
            <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendingReview}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {['submissions', 'products', 'sales'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {L[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`]}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-green-600 rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Submissions Tab */}
            {activeTab === 'submissions' && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {submissions.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{L.noSubmissions}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.noSubmissionsDesc}</p>
                    <Link
                      href="/store/submit"
                      className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
                    >
                      {L.newSubmission}
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.track}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.price}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.status}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.date}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {sub.cover_image_url && (
                                  <img src={sub.cover_image_url} alt="" className="w-10 h-10 rounded object-cover" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.track_title}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.artist_name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {formatCurrency(sub.requested_price)}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={sub.status} L={L} />
                              {sub.status === 'rejected' && sub.admin_comment && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{sub.admin_comment}</p>
                              )}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(sub.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {products.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{L.noProducts}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.noProductsDesc}</p>
                  </div>
                ) : (
                  <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                        {product.cover_image_url && (
                          <img src={product.cover_image_url} alt="" className="w-full aspect-square object-cover" />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{product.track_title}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{product.artist_name}</p>
                            </div>
                            <StatusBadge status={product.status} L={L} />
                          </div>
                          <div className="mt-3 flex items-center justify-between text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(product.price)}</span>
                            {product.shopify_product_id && (
                              <a
                                href={`https://store.kracradio.com/products/${product.shopify_product_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                {L.view}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sales Tab */}
            {activeTab === 'sales' && (
              <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                {sales.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">{L.noSales}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.noSalesDesc}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.track}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.orderDate}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.quantity}</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.yourRevenue}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {sales.map((sale) => {
                          const product = products.find(p => p.id === sale.store_product_id);
                          return (
                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {product?.track_title || 'Unknown'}
                                </p>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(sale.order_date)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {sale.quantity || 1}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-green-600 dark:text-green-400">
                                {formatCurrency(sale.revenue_artist)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
