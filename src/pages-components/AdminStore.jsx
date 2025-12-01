'use client';
// src/pages/AdminStore.jsx
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n';
import Seo from '../seo/Seo';
import { supabase, SUPABASE_FUNCTIONS_URL } from '../lib/supabase';

const STRINGS = {
  fr: {
    title: 'Admin - Boutique',
    description: 'Gérer les soumissions de vente',
    back: '← Retour à l\'admin',
    accessDenied: 'Accès refusé - Admins uniquement',

    // Tabs
    tabPending: 'En attente',
    tabApproved: 'Approuvés',
    tabRejected: 'Refusés',
    tabAll: 'Tous',

    // Table
    track: 'Morceau',
    artist: 'Artiste',
    price: 'Prix',
    type: 'Type',
    rights: 'Droits',
    date: 'Date',
    actions: 'Actions',
    message: 'Message',
    noMessage: 'Aucun message',

    // Actions
    approve: 'Approuver',
    reject: 'Refuser',
    listen: 'Écouter',
    view: 'Voir',

    // Status
    statusPending: 'En attente',
    statusApproved: 'Approuvé',
    statusRejected: 'Refusé',

    // Modal
    rejectTitle: 'Refuser la soumission',
    rejectReason: 'Raison du refus',
    rejectPlaceholder: 'Expliquez pourquoi cette soumission est refusée...',
    cancel: 'Annuler',
    confirm: 'Confirmer',

    // Empty
    noSubmissions: 'Aucune soumission',
    noSubmissionsDesc: 'Les soumissions apparaîtront ici',

    // Messages
    success: 'Succès',
    error: 'Erreur',
    approveSuccess: 'Soumission approuvée',
    rejectSuccess: 'Soumission refusée',
    syncSuccess: 'Produit synchronisé avec Shopify',
    syncError: 'Erreur de synchronisation Shopify',

    // Stats
    totalPending: 'En attente',
    totalApproved: 'Approuvés',
    totalRejected: 'Refusés',
    totalRevenue: 'Revenus plateforme',
    totalSales: 'Ventes totales',
    artistPayouts: 'Revenus artistes',
    liveProducts: 'Produits en ligne',

    // Tabs
    tabSales: 'Ventes',
    tabPayouts: 'Paiements',

    // Sales table
    order: 'Commande',
    product: 'Produit',
    quantity: 'Qté',
    gross: 'Brut',
    artistShare: 'Part artiste',
    platformShare: 'Part plateforme',
    country: 'Pays',
    noSales: 'Aucune vente',
    noSalesDesc: 'Les ventes apparaîtront ici',

    // Payouts
    payoutStatus: 'Statut',
    payoutPending: 'En attente',
    payoutProcessed: 'Traité',
    markPaid: 'Marquer payé',
    totalOwed: 'Total dû',
    noPendingPayouts: 'Aucun paiement en attente',

    loading: 'Chargement...',
    yes: 'Oui',
    no: 'Non',

    // Shopify
    syncToShopify: 'Sync Shopify',
    syncing: 'Synchronisation...',
    liveOnShopify: 'En ligne',
    approveAndSync: 'Approuver + Shopify',
    resync: 'Resync',
    resyncSuccess: 'Produit resynchronisé avec Shopify',
    resyncError: 'Erreur de resynchronisation',
    remove: 'Retirer',
    removeSuccess: 'Produit retiré de Shopify',
    removeError: 'Erreur lors du retrait',
  },
  en: {
    title: 'Admin - Store',
    description: 'Manage sale submissions',
    back: '← Back to admin',
    accessDenied: 'Access denied - Admins only',

    // Tabs
    tabPending: 'Pending',
    tabApproved: 'Approved',
    tabRejected: 'Rejected',
    tabAll: 'All',

    // Table
    track: 'Track',
    artist: 'Artist',
    price: 'Price',
    type: 'Type',
    rights: 'Rights',
    date: 'Date',
    actions: 'Actions',
    message: 'Message',
    noMessage: 'No message',

    // Actions
    approve: 'Approve',
    reject: 'Reject',
    listen: 'Listen',
    view: 'View',

    // Status
    statusPending: 'Pending',
    statusApproved: 'Approved',
    statusRejected: 'Rejected',

    // Modal
    rejectTitle: 'Reject Submission',
    rejectReason: 'Rejection Reason',
    rejectPlaceholder: 'Explain why this submission is rejected...',
    cancel: 'Cancel',
    confirm: 'Confirm',

    // Empty
    noSubmissions: 'No submissions',
    noSubmissionsDesc: 'Submissions will appear here',

    // Messages
    success: 'Success',
    error: 'Error',
    approveSuccess: 'Submission approved',
    rejectSuccess: 'Submission rejected',
    syncSuccess: 'Product synced to Shopify',
    syncError: 'Shopify sync error',

    // Stats
    totalPending: 'Pending',
    totalApproved: 'Approved',
    totalRejected: 'Rejected',
    totalRevenue: 'Platform Revenue',
    totalSales: 'Total Sales',
    artistPayouts: 'Artist Revenue',
    liveProducts: 'Live Products',

    // Tabs
    tabSales: 'Sales',
    tabPayouts: 'Payouts',

    // Sales table
    order: 'Order',
    product: 'Product',
    quantity: 'Qty',
    gross: 'Gross',
    artistShare: 'Artist Share',
    platformShare: 'Platform Share',
    country: 'Country',
    noSales: 'No sales yet',
    noSalesDesc: 'Sales will appear here',

    // Payouts
    payoutStatus: 'Status',
    payoutPending: 'Pending',
    payoutProcessed: 'Processed',
    markPaid: 'Mark as Paid',
    totalOwed: 'Total Owed',
    noPendingPayouts: 'No pending payouts',

    loading: 'Loading...',
    yes: 'Yes',
    no: 'No',

    // Shopify
    syncToShopify: 'Sync Shopify',
    syncing: 'Syncing...',
    liveOnShopify: 'Live',
    approveAndSync: 'Approve + Shopify',
    resync: 'Resync',
    resyncSuccess: 'Product resynced to Shopify',
    resyncError: 'Resync error',
    remove: 'Remove',
    removeSuccess: 'Product removed from Shopify',
    removeError: 'Remove error',
  },
  es: {
    title: 'Admin - Tienda',
    description: 'Gestionar envíos de venta',
    back: '← Volver al admin',
    accessDenied: 'Acceso denegado - Solo administradores',

    // Tabs
    tabPending: 'Pendientes',
    tabApproved: 'Aprobados',
    tabRejected: 'Rechazados',
    tabAll: 'Todos',

    // Table
    track: 'Pista',
    artist: 'Artista',
    price: 'Precio',
    type: 'Tipo',
    rights: 'Derechos',
    date: 'Fecha',
    actions: 'Acciones',
    message: 'Mensaje',
    noMessage: 'Sin mensaje',

    // Actions
    approve: 'Aprobar',
    reject: 'Rechazar',
    listen: 'Escuchar',
    view: 'Ver',

    // Status
    statusPending: 'Pendiente',
    statusApproved: 'Aprobado',
    statusRejected: 'Rechazado',

    // Modal
    rejectTitle: 'Rechazar envío',
    rejectReason: 'Razón del rechazo',
    rejectPlaceholder: 'Explica por qué este envío es rechazado...',
    cancel: 'Cancelar',
    confirm: 'Confirmar',

    // Empty
    noSubmissions: 'Sin envíos',
    noSubmissionsDesc: 'Los envíos aparecerán aquí',

    // Messages
    success: 'Éxito',
    error: 'Error',
    approveSuccess: 'Envío aprobado',
    rejectSuccess: 'Envío rechazado',
    syncSuccess: 'Producto sincronizado con Shopify',
    syncError: 'Error de sincronización Shopify',

    // Stats
    totalPending: 'Pendientes',
    totalApproved: 'Aprobados',
    totalRejected: 'Rechazados',
    totalRevenue: 'Ingresos plataforma',
    totalSales: 'Ventas totales',
    artistPayouts: 'Ingresos artistas',
    liveProducts: 'Productos en línea',

    // Tabs
    tabSales: 'Ventas',
    tabPayouts: 'Pagos',

    // Sales table
    order: 'Pedido',
    product: 'Producto',
    quantity: 'Cant',
    gross: 'Bruto',
    artistShare: 'Parte artista',
    platformShare: 'Parte plataforma',
    country: 'País',
    noSales: 'Sin ventas',
    noSalesDesc: 'Las ventas aparecerán aquí',

    // Payouts
    payoutStatus: 'Estado',
    payoutPending: 'Pendiente',
    payoutProcessed: 'Procesado',
    markPaid: 'Marcar pagado',
    totalOwed: 'Total adeudado',
    noPendingPayouts: 'Sin pagos pendientes',

    loading: 'Cargando...',
    yes: 'Sí',
    no: 'No',

    // Shopify
    syncToShopify: 'Sync Shopify',
    syncing: 'Sincronizando...',
    liveOnShopify: 'En línea',
    approveAndSync: 'Aprobar + Shopify',
    resync: 'Resync',
    resyncSuccess: 'Producto resincronizado con Shopify',
    resyncError: 'Error de resincronización',
    remove: 'Retirar',
    removeSuccess: 'Producto retirado de Shopify',
    removeError: 'Error al retirar',
  },
};

function StatusBadge({ status, L }) {
  const styles = {
    pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  };

  const labels = {
    pending: L.statusPending,
    approved: L.statusApproved,
    rejected: L.statusRejected,
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}

export default function AdminStore() {
  const { user, userRole, loading: authLoading } = useAuth();
  const { lang } = useI18n();
  const L = useMemo(() => STRINGS[lang] || STRINGS.fr, [lang]);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('pending');
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [stats, setStats] = useState({
    pending: 0, approved: 0, rejected: 0,
    platformRevenue: 0, artistRevenue: 0, totalSales: 0, liveProducts: 0
  });

  // Sales data
  const [sales, setSales] = useState([]);
  const [artistPayouts, setArtistPayouts] = useState([]);

  // Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, submission: null });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [syncingId, setSyncingId] = useState(null);

  // Audio player
  const [playingAudio, setPlayingAudio] = useState(null);

  // Products (for Shopify sync status)
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (!authLoading && (!user || userRole !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, userRole, authLoading, router]);

  useEffect(() => {
    if (user && userRole === 'admin') {
      loadSubmissions();
      loadProducts();
      loadSalesData();
    }
  }, [user, userRole]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('store_products')
        .select('id, user_id, track_title, artist_name, shopify_product_id, status, price, product_type, cover_image_url, track_file_url')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);

      // Count live products
      const liveCount = data?.filter(p => p.status === 'live' && p.shopify_product_id).length || 0;
      setStats(prev => ({ ...prev, liveProducts: liveCount }));
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadSalesData = async () => {
    try {
      // Load all sales with product info (without profiles join due to RLS)
      const { data: salesData, error: salesError } = await supabase
        .from('store_sales')
        .select(`
          *,
          store_products (
            track_title,
            artist_name
          )
        `)
        .order('order_date', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Calculate totals
      const totalSalesCount = salesData?.length || 0;
      const platformRevenue = salesData?.reduce((sum, s) => sum + (s.revenue_platform || 0), 0) || 0;
      const artistRevenue = salesData?.reduce((sum, s) => sum + (s.revenue_artist || 0), 0) || 0;

      setStats(prev => ({
        ...prev,
        totalSales: totalSalesCount,
        platformRevenue,
        artistRevenue
      }));

      // Calculate artist payouts (group by user_id)
      const payoutsByArtist = {};
      salesData?.forEach(sale => {
        const artistId = sale.user_id;
        if (!payoutsByArtist[artistId]) {
          payoutsByArtist[artistId] = {
            user_id: artistId,
            artist_name: sale.store_products?.artist_name || 'Unknown',
            email: null,
            totalRevenue: 0,
            salesCount: 0,
            sales: []
          };
        }
        payoutsByArtist[artistId].totalRevenue += sale.revenue_artist || 0;
        payoutsByArtist[artistId].salesCount += 1;
        payoutsByArtist[artistId].sales.push(sale);
      });

      setArtistPayouts(Object.values(payoutsByArtist).sort((a, b) => b.totalRevenue - a.totalRevenue));
    } catch (error) {
      console.error('Error loading sales data:', error);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);

      // Calculate stats
      const pending = data?.filter(s => s.status === 'pending').length || 0;
      const approved = data?.filter(s => s.status === 'approved').length || 0;
      const rejected = data?.filter(s => s.status === 'rejected').length || 0;

      setStats(prev => ({ ...prev, pending, approved, rejected }));
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission, syncShopify = false) => {
    setProcessing(true);
    try {
      // Update submission status
      const { error: updateError } = await supabase
        .from('store_submissions')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (updateError) throw updateError;

      // Create store product (initially without Dropbox URLs)
      const { data: productData, error: productError } = await supabase
        .from('store_products')
        .insert({
          user_id: submission.user_id,
          track_title: submission.track_title,
          artist_name: submission.artist_name,
          price: submission.requested_price,
          product_type: submission.product_type,
          cover_image_url: null, // Will be updated after Dropbox upload
          track_file_url: null,  // Will be updated after Dropbox upload
          status: 'approved',
        })
        .select()
        .single();

      if (productError) throw productError;

      // Link the submission to the created product
      await supabase
        .from('store_submissions')
        .update({ store_product_id: productData.id })
        .eq('id', submission.id);

      // Upload files to Dropbox (in store-approval/{artist_name}/ folder)
      if (submission.audio_file_url || submission.cover_image_url) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;

          console.log('Uploading files to Dropbox...', {
            audio: submission.audio_file_url,
            cover: submission.cover_image_url,
          });

          const dropboxResponse = await fetch(
            `${SUPABASE_FUNCTIONS_URL}/dropbox-upload-store`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                store_product_id: productData.id,
                artist_name: submission.artist_name,
                track_title: submission.track_title,
                audio_file_url: submission.audio_file_url,
                cover_image_url: submission.cover_image_url,
              }),
            }
          );

          const dropboxResult = await dropboxResponse.json();
          console.log('Dropbox upload result:', dropboxResult);

          if (!dropboxResponse.ok) {
            console.error('Dropbox upload failed:', dropboxResult.error);
          } else {
            // Reload product data with Dropbox URLs
            const { data: updatedProduct } = await supabase
              .from('store_products')
              .select('*')
              .eq('id', productData.id)
              .single();

            if (updatedProduct) {
              Object.assign(productData, updatedProduct);
            }
          }
        } catch (dropboxError) {
          console.error('Dropbox upload error:', dropboxError);
          // Don't fail the approval if Dropbox upload fails
        }
      }

      // Optionally sync to Shopify immediately
      if (syncShopify && productData) {
        await syncToShopify(productData);
      }

      setMessage({ type: 'success', text: L.approveSuccess });
      loadSubmissions();
      loadProducts();
    } catch (error) {
      console.error('Error approving:', error);
      setMessage({ type: 'error', text: L.error + ': ' + error.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const syncToShopify = async (product) => {
    if (!product || !product.id) {
      setMessage({ type: 'error', text: L.syncError + ': Product not found' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSyncingId(product.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      // Validate required fields
      if (!product.track_title || !product.artist_name || !product.price) {
        console.error('Missing product data:', product);
        throw new Error('Missing required product data (title, artist, or price)');
      }

      console.log('Syncing product to Shopify:', {
        id: product.id,
        track_title: product.track_title,
        artist_name: product.artist_name,
        price: product.price,
        product_type: product.product_type,
        cover_image_url: product.cover_image_url,
        track_file_url: product.track_file_url,
      });

      const response = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/shopify-create-product`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_product_id: product.id,
            track_title: product.track_title,
            artist_name: product.artist_name,
            price: product.price,
            currency: 'CAD',
            product_type: product.product_type || 'single',
            cover_image_url: product.cover_image_url,
            track_file_url: product.track_file_url,
          }),
        }
      );

      const result = await response.json();
      console.log('Shopify sync response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result?.error || `Shopify sync failed (${response.status})`);
      }

      setMessage({ type: 'success', text: L.syncSuccess });
      loadProducts();
    } catch (error) {
      console.error('Error syncing to Shopify:', error);
      setMessage({ type: 'error', text: L.syncError + ': ' + error.message });
    } finally {
      setSyncingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const resyncToShopify = async (product) => {
    if (!product || !product.id || !product.shopify_product_id) {
      setMessage({ type: 'error', text: L.resyncError + ': Product not found' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSyncingId(product.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      console.log('Resyncing product:', {
        id: product.id,
        shopify_product_id: product.shopify_product_id
      });

      // Step 1: Delete the existing Shopify product
      const deleteResponse = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/shopify-delete-product`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_product_id: product.id,
            shopify_product_id: product.shopify_product_id,
          }),
        }
      );

      const deleteResult = await deleteResponse.json();
      console.log('Delete response:', { status: deleteResponse.status, result: deleteResult });

      if (!deleteResponse.ok) {
        throw new Error(deleteResult?.error || `Delete failed (${deleteResponse.status})`);
      }

      // Reload products to get the updated status
      await loadProducts();

      // Step 2: Get the updated product (now with status approved)
      const { data: updatedProduct } = await supabase
        .from('store_products')
        .select('*')
        .eq('id', product.id)
        .single();

      if (!updatedProduct) {
        throw new Error('Product not found after delete');
      }

      // Step 3: Recreate the product on Shopify
      await syncToShopify(updatedProduct);

      setMessage({ type: 'success', text: L.resyncSuccess });
    } catch (error) {
      console.error('Error resyncing to Shopify:', error);
      setMessage({ type: 'error', text: L.resyncError + ': ' + error.message });
      setSyncingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const removeFromShopify = async (product) => {
    if (!product || !product.id || !product.shopify_product_id) {
      setMessage({ type: 'error', text: L.removeError + ': Product not found' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setSyncingId(product.id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) {
        throw new Error('No auth token');
      }

      console.log('Removing product from Shopify:', {
        id: product.id,
        shopify_product_id: product.shopify_product_id
      });

      // Delete the Shopify product (this also resets status to 'approved')
      const deleteResponse = await fetch(
        `${SUPABASE_FUNCTIONS_URL}/shopify-delete-product`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            store_product_id: product.id,
            shopify_product_id: product.shopify_product_id,
          }),
        }
      );

      const deleteResult = await deleteResponse.json();
      console.log('Delete response:', { status: deleteResponse.status, result: deleteResult });

      if (!deleteResponse.ok) {
        throw new Error(deleteResult?.error || `Delete failed (${deleteResponse.status})`);
      }

      setMessage({ type: 'success', text: L.removeSuccess });
      loadProducts();
    } catch (error) {
      console.error('Error removing from Shopify:', error);
      setMessage({ type: 'error', text: L.removeError + ': ' + error.message });
    } finally {
      setSyncingId(null);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.submission) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('store_submissions')
        .update({
          status: 'rejected',
          admin_comment: rejectReason.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', rejectModal.submission.id);

      if (error) throw error;

      setMessage({ type: 'success', text: L.rejectSuccess });
      setRejectModal({ open: false, submission: null });
      setRejectReason('');
      loadSubmissions();
    } catch (error) {
      console.error('Error rejecting:', error);
      setMessage({ type: 'error', text: L.error + ': ' + error.message });
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const toggleAudio = (url) => {
    if (playingAudio === url) {
      setPlayingAudio(null);
    } else {
      setPlayingAudio(url);
    }
  };

  const filteredSubmissions = useMemo(() => {
    if (activeTab === 'all') return submissions;
    return submissions.filter(s => s.status === activeTab);
  }, [submissions, activeTab]);

  // Helper to find product for a submission
  const getProductForSubmission = (submission) => {
    // First check if submission has a linked store_product_id
    if (submission.store_product_id) {
      return products.find(p => p.id === submission.store_product_id);
    }
    // Fallback to matching by title/artist/user
    return products.find(p =>
      p.track_title === submission.track_title &&
      p.artist_name === submission.artist_name &&
      p.user_id === submission.user_id
    );
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

  if (authLoading || !user || userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212]">
        {authLoading ? (
          <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
        ) : (
          <p className="text-red-600 dark:text-red-400">{L.accessDenied}</p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      <Seo lang={lang} title={L.title} description={L.description} path="/admin/store" type="website" />

      {/* Header */}
      <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 inline-block"
          >
            {L.back}
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{L.title}</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Stats - Row 1: Submissions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalPending}</p>
            <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalApproved}</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{stats.approved}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalRejected}</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.liveProducts}</p>
            <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400 mt-1">{stats.liveProducts}</p>
          </div>
        </div>

        {/* Stats - Row 2: Revenue */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalSales}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">{stats.totalSales}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalRevenue}</p>
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400 mt-1">{formatCurrency(stats.platformRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.artistPayouts}</p>
            <p className="text-2xl font-semibold text-green-600 dark:text-green-400 mt-1">{formatCurrency(stats.artistRevenue)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalOwed}</p>
            <p className="text-2xl font-semibold text-orange-600 dark:text-orange-400 mt-1">{formatCurrency(stats.artistRevenue)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {['pending', 'approved', 'rejected', 'all', 'sales', 'payouts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {L[`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`]}
              {['pending', 'approved', 'rejected'].includes(tab) && (
                <span className="ml-1 text-xs">
                  ({submissions.filter(s => s.status === tab).length})
                </span>
              )}
              {tab === 'sales' && <span className="ml-1 text-xs">({sales.length})</span>}
              {tab === 'payouts' && <span className="ml-1 text-xs">({artistPayouts.length})</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-red-600 rounded-full"></div>
          </div>
        ) : activeTab === 'sales' ? (
          /* Sales Tab */
          sales.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <p className="text-gray-900 dark:text-white font-medium">{L.noSales}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.noSalesDesc}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.order}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.product}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.quantity}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.gross}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.artistShare}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.platformShare}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.country}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.date}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-mono">
                          #{sale.shopify_order_id?.slice(-8)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.store_products?.track_title || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {sale.store_products?.artist_name || 'Unknown'}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {sale.quantity}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {formatCurrency(sale.revenue_gross)}
                        </td>
                        <td className="px-6 py-4 text-sm text-green-600 dark:text-green-400">
                          {formatCurrency(sale.revenue_artist)}
                        </td>
                        <td className="px-6 py-4 text-sm text-blue-600 dark:text-blue-400">
                          {formatCurrency(sale.revenue_platform)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {sale.customer_country || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(sale.order_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : activeTab === 'payouts' ? (
          /* Payouts Tab */
          artistPayouts.length === 0 ? (
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
              <p className="text-gray-900 dark:text-white font-medium">{L.noPendingPayouts}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {artistPayouts.map((payout) => (
                <div
                  key={payout.user_id}
                  className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {payout.artist_name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{payout.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{L.totalOwed}</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(payout.totalRevenue)}
                      </p>
                      <p className="text-xs text-gray-400">{payout.salesCount} {L.totalSales.toLowerCase()}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                      {L.payoutPending}
                    </span>
                    <button
                      onClick={() => {
                        // TODO: Implement mark as paid functionality
                        setMessage({ type: 'success', text: 'Payout marked as paid (demo)' });
                        setTimeout(() => setMessage(null), 3000);
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      {L.markPaid}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : filteredSubmissions.length === 0 ? (
          /* Submissions Tab (default) - Empty State */
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-gray-900 dark:text-white font-medium">{L.noSubmissions}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{L.noSubmissionsDesc}</p>
          </div>
        ) : (
          /* Submissions Tab (default) - Table */
          <div className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.track}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.price}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.type}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.rights}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.date}</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{L.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {sub.cover_image_url && (
                            <img src={sub.cover_image_url} alt="" className="w-12 h-12 rounded object-cover" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.track_title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{sub.artist_name}</p>
                            <StatusBadge status={sub.status} L={L} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {formatCurrency(sub.requested_price)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {sub.product_type}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${sub.rights_confirmed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {sub.rights_confirmed ? L.yes : L.no}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(sub.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {sub.audio_file_url && (
                            <button
                              onClick={() => toggleAudio(sub.audio_file_url)}
                              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title={L.listen}
                            >
                              {playingAudio === sub.audio_file_url ? (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M8 5v14l11-7z"/>
                                </svg>
                              )}
                            </button>
                          )}
                          {sub.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(sub, false)}
                                disabled={processing}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {L.approve}
                              </button>
                              <button
                                onClick={() => handleApprove(sub, true)}
                                disabled={processing}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors"
                                title={L.approveAndSync}
                              >
                                {L.approveAndSync}
                              </button>
                              <button
                                onClick={() => setRejectModal({ open: true, submission: sub })}
                                disabled={processing}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {L.reject}
                              </button>
                            </>
                          )}
                          {sub.status === 'approved' && (() => {
                            const product = getProductForSubmission(sub);
                            if (!product) return null;
                            if (product.shopify_product_id) {
                              return (
                                <>
                                  <span className="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    {L.liveOnShopify}
                                  </span>
                                  <button
                                    onClick={() => resyncToShopify(product)}
                                    disabled={syncingId === product.id}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg disabled:opacity-50 transition-colors"
                                  >
                                    {syncingId === product.id ? L.syncing : L.resync}
                                  </button>
                                  <button
                                    onClick={() => removeFromShopify(product)}
                                    disabled={syncingId === product.id}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 transition-colors"
                                  >
                                    {syncingId === product.id ? L.syncing : L.remove}
                                  </button>
                                </>
                              );
                            }
                            return (
                              <button
                                onClick={() => syncToShopify(product)}
                                disabled={syncingId === product.id}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {syncingId === product.id ? L.syncing : L.syncToShopify}
                              </button>
                            );
                          })()}
                          {sub.artist_message && (
                            <span
                              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-help"
                              title={sub.artist_message}
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audio Player */}
        {playingAudio && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-4 z-50">
            <audio
              src={playingAudio}
              controls
              autoPlay
              onEnded={() => setPlayingAudio(null)}
              className="w-80"
            />
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {L.rejectTitle}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {rejectModal.submission?.track_title} - {rejectModal.submission?.artist_name}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {L.rejectReason}
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={L.rejectPlaceholder}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRejectModal({ open: false, submission: null });
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  {L.cancel}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                >
                  {processing ? '...' : L.confirm}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
