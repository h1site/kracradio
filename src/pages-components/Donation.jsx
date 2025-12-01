'use client';
// src/pages/Donation.jsx
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useI18n } from '../i18n';
import { supabase } from '../lib/supabaseClient';

// PayPal Client ID - à mettre dans .env pour la production
const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'sb'; // 'sb' = sandbox mode

// Paliers de donation prédéfinis
const DONATION_TIERS = [5, 10, 25, 50, 100];

// Fallback campaign config (used if DB not available)
const DEFAULT_CAMPAIGN = {
  goal: 5000,
  title_fr: 'Fonctionnement de la station',
  title_en: 'Station Operations',
  title_es: 'Operaciones de la estación',
};

export default function Donation() {
  const { lang } = useI18n();
  const [campaign, setCampaign] = useState(DEFAULT_CAMPAIGN);
  const [raised, setRaised] = useState(0);
  const [donorCount, setDonorCount] = useState(0);
  const [recentDonors, setRecentDonors] = useState([]);
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [donorName, setDonorName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Charger les stats de donation depuis Supabase via la fonction RPC
  useEffect(() => {
    async function loadDonationStats() {
      try {
        // Appeler la fonction get_campaign_stats
        const { data, error } = await supabase.rpc('get_campaign_stats', {
          p_campaign_id: 'default',
        });

        if (!error && data) {
          setRaised(parseFloat(data.total_raised) || 0);
          setDonorCount(data.donor_count || 0);
          setRecentDonors(data.recent_donors || []);
          if (data.goal) {
            setCampaign((prev) => ({ ...prev, goal: parseFloat(data.goal) }));
          }
        }

        // Charger aussi les infos de la campagne
        const { data: campaignData } = await supabase
          .from('donation_campaigns')
          .select('*')
          .eq('id', 'default')
          .single();

        if (campaignData) {
          setCampaign(campaignData);
        }
      } catch (err) {
        // Si la table n'existe pas encore, utiliser les valeurs par défaut
        console.log('Campaign stats not available:', err);
      }
      setLoading(false);
    }
    loadDonationStats();
  }, []);

  // Calculer le pourcentage
  const percentage = Math.min((raised / campaign.goal) * 100, 100);

  // Get localized campaign title
  const campaignTitle = campaign[`title_${lang}`] || campaign.title_fr || 'Fonctionnement de la station';

  // Gérer la sélection de montant
  const handleAmountSelect = (amount) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomAmount = (value) => {
    const num = value.replace(/[^0-9]/g, '');
    setCustomAmount(num);
    if (num) {
      setSelectedAmount(parseInt(num, 10));
      setIsCustom(true);
    }
  };

  // Montant final pour PayPal
  const getFinalAmount = () => {
    return isCustom && customAmount ? parseInt(customAmount, 10) : selectedAmount;
  };

  // Enregistrer la donation dans Supabase
  const recordDonation = async (paymentDetails) => {
    try {
      const { data, error } = await supabase.from('donations').insert({
        amount: getFinalAmount(),
        donor_name: isAnonymous ? null : donorName || null,
        payment_provider: 'paypal',
        payment_id: paymentDetails.id,
        status: 'completed',
        is_anonymous: isAnonymous,
        campaign_id: 'default',
      });

      if (error) {
        console.error('Error recording donation:', error);
      } else {
        // Recharger les stats
        const { data: stats } = await supabase.rpc('get_campaign_stats', {
          p_campaign_id: 'default',
        });
        if (stats) {
          setRaised(parseFloat(stats.total_raised) || 0);
          setDonorCount(stats.donor_count || 0);
          setRecentDonors(stats.recent_donors || []);
        }
      }
    } catch (err) {
      console.error('Error recording donation:', err);
    }
  };

  // PayPal createOrder callback
  const createOrder = useCallback((data, actions) => {
    const amount = getFinalAmount();
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: amount.toString(),
            currency_code: 'CAD',
          },
          description: `Donation KracRadio - ${campaignTitle}`,
        },
      ],
    });
  }, [selectedAmount, customAmount, isCustom, campaignTitle]);

  // PayPal onApprove callback
  const onApprove = useCallback(async (data, actions) => {
    try {
      const details = await actions.order.capture();
      setPaymentSuccess(true);
      setPaymentError(null);
      await recordDonation(details);
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentError(lang === 'fr' ? 'Erreur lors du paiement' : lang === 'es' ? 'Error en el pago' : 'Payment error');
    }
  }, [donorName, isAnonymous, lang]);

  // PayPal onError callback
  const onError = useCallback((err) => {
    console.error('PayPal error:', err);
    setPaymentError(lang === 'fr' ? 'Erreur PayPal' : lang === 'es' ? 'Error de PayPal' : 'PayPal error');
  }, [lang]);

  const texts = {
    fr: {
      pageTitle: 'Donation - KracRadio',
      pageHeader: 'Soutenez KracRadio',
      pageDescription: 'Aidez-nous à maintenir et améliorer votre station de radio indépendante préférée.',
      goal: 'Objectif',
      raised: 'Collecté',
      donors: 'donateurs',
      selectAmount: 'Choisissez un montant',
      customAmount: 'Montant personnalisé',
      donateNow: 'Faire un don',
      securePayment: 'Paiement sécurisé via PayPal',
      recentDonors: 'Donateurs récents',
      anonymous: 'Anonyme',
      whyDonate: 'Pourquoi donner?',
      reason1: 'Maintenir nos serveurs et équipements',
      reason2: 'Soutenir les artistes indépendants',
      reason3: 'Améliorer la qualité de diffusion',
      reason4: 'Développer de nouvelles fonctionnalités',
      thankYou: 'Merci de votre générosité!',
      everyBitHelps: 'Chaque contribution compte et nous aide à continuer notre mission.',
      yourName: 'Votre nom (optionnel)',
      anonymous: 'Anonyme',
      donateAnonymously: 'Donner anonymement',
      yourDonation: 'Votre don',
      paymentSuccessTitle: 'Merci pour votre don!',
      paymentSuccessMsg: 'Votre contribution a été reçue avec succès.',
      makeAnother: 'Faire un autre don',
    },
    en: {
      pageTitle: 'Donation - KracRadio',
      pageHeader: 'Support KracRadio',
      pageDescription: 'Help us maintain and improve your favorite independent radio station.',
      goal: 'Goal',
      raised: 'Raised',
      donors: 'donors',
      selectAmount: 'Select an amount',
      customAmount: 'Custom amount',
      donateNow: 'Donate Now',
      securePayment: 'Secure payment via PayPal',
      recentDonors: 'Recent Donors',
      anonymous: 'Anonymous',
      whyDonate: 'Why Donate?',
      reason1: 'Maintain our servers and equipment',
      reason2: 'Support independent artists',
      reason3: 'Improve broadcast quality',
      reason4: 'Develop new features',
      thankYou: 'Thank you for your generosity!',
      everyBitHelps: 'Every contribution matters and helps us continue our mission.',
      yourName: 'Your name (optional)',
      anonymous: 'Anonymous',
      donateAnonymously: 'Donate anonymously',
      yourDonation: 'Your donation',
      paymentSuccessTitle: 'Thank you for your donation!',
      paymentSuccessMsg: 'Your contribution has been received successfully.',
      makeAnother: 'Make another donation',
    },
    es: {
      pageTitle: 'Donación - KracRadio',
      pageHeader: 'Apoya KracRadio',
      pageDescription: 'Ayúdanos a mantener y mejorar tu estación de radio independiente favorita.',
      goal: 'Meta',
      raised: 'Recaudado',
      donors: 'donantes',
      selectAmount: 'Selecciona un monto',
      customAmount: 'Monto personalizado',
      donateNow: 'Donar Ahora',
      securePayment: 'Pago seguro via PayPal',
      recentDonors: 'Donantes Recientes',
      anonymous: 'Anónimo',
      whyDonate: '¿Por qué donar?',
      reason1: 'Mantener nuestros servidores y equipos',
      reason2: 'Apoyar artistas independientes',
      reason3: 'Mejorar la calidad de transmisión',
      reason4: 'Desarrollar nuevas funcionalidades',
      thankYou: '¡Gracias por tu generosidad!',
      everyBitHelps: 'Cada contribución cuenta y nos ayuda a continuar nuestra misión.',
      yourName: 'Tu nombre (opcional)',
      anonymous: 'Anónimo',
      donateAnonymously: 'Donar anónimamente',
      yourDonation: 'Tu donación',
      paymentSuccessTitle: '¡Gracias por tu donación!',
      paymentSuccessMsg: 'Tu contribución ha sido recibida con éxito.',
      makeAnother: 'Hacer otra donación',
    },
  };

  const t = texts[lang] || texts.fr;

  return (
    <PayPalScriptProvider
      options={{
        'client-id': PAYPAL_CLIENT_ID,
        currency: 'CAD',
        intent: 'capture',
      }}
    >
      <Head>
        <title>{t.pageTitle}</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-[#1a1a1a] to-black pt-20 pb-32">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              {t.pageHeader}
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              {t.pageDescription}
            </p>
          </div>

          {/* Thermomètre principal */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 mb-8">
            {/* Cause actuelle */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
                {campaignTitle}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-3xl md:text-4xl font-black text-white">
                  ${raised.toLocaleString()}
                </div>
                <div className="text-white/60">
                  {t.raised} {donorCount > 0 && `• ${donorCount} ${t.donors}`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white/80">
                  ${campaign.goal.toLocaleString()}
                </div>
                <div className="text-white/60">{t.goal}</div>
              </div>
            </div>

            {/* Barre de progression (thermomètre) */}
            <div className="relative h-8 bg-white/10 rounded-full overflow-hidden mb-2">
              {/* Graduation marks */}
              <div className="absolute inset-0 flex">
                {[25, 50, 75].map((mark) => (
                  <div
                    key={mark}
                    className="absolute top-0 bottom-0 w-px bg-white/20"
                    style={{ left: `${mark}%` }}
                  />
                ))}
              </div>

              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-500 rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${percentage}%` }}
              >
                {/* Animated shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>

              {/* Percentage label */}
              {percentage > 10 && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 text-white font-bold text-sm"
                  style={{ left: `${Math.min(percentage - 5, 90)}%` }}
                >
                  {Math.round(percentage)}%
                </div>
              )}
            </div>

            {/* Thermometer style indicator */}
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>$0</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Section donation */}
          <div className="grid md:grid-cols-2 gap-8">
            {/* Formulaire de donation */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-6">{t.selectAmount}</h2>

              {/* Montants prédéfinis */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                {DONATION_TIERS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleAmountSelect(amount)}
                    className={`py-3 px-4 rounded-xl font-bold text-lg transition-all ${
                      selectedAmount === amount && !isCustom
                        ? 'bg-red-500 text-white scale-105'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    ${amount}
                  </button>
                ))}
                {/* Custom amount button */}
                <button
                  onClick={() => setIsCustom(true)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                    isCustom
                      ? 'bg-red-500 text-white scale-105'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {t.customAmount}
                </button>
              </div>

              {/* Input montant personnalisé */}
              {isCustom && (
                <div className="mb-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-xl">
                      $
                    </span>
                    <input
                      type="text"
                      value={customAmount}
                      onChange={(e) => handleCustomAmount(e.target.value)}
                      placeholder="0"
                      className="w-full bg-white/10 border border-white/20 rounded-xl py-4 pl-10 pr-4 text-white text-2xl font-bold focus:outline-none focus:border-red-500 transition-colors"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              {/* Nom du donateur */}
              {!paymentSuccess && (
                <div className="mb-4">
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={t.yourName}
                    disabled={isAnonymous}
                    className="w-full bg-white/10 border border-white/20 rounded-xl py-3 px-4 text-white placeholder-white/40 focus:outline-none focus:border-red-500 transition-colors disabled:opacity-50"
                  />
                  <label className="flex items-center gap-2 mt-2 text-white/60 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-red-500 focus:ring-red-500"
                    />
                    {t.donateAnonymously}
                  </label>
                </div>
              )}

              {/* Montant sélectionné */}
              <div className="text-center py-4 mb-4 bg-white/5 rounded-xl">
                <div className="text-white/60 text-sm mb-1">{t.yourDonation}</div>
                <div className="text-4xl font-black text-white">
                  ${isCustom && customAmount ? customAmount : selectedAmount}
                </div>
              </div>

              {/* Success message */}
              {paymentSuccess ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold text-white mb-2">{t.paymentSuccessTitle}</h3>
                  <p className="text-white/70 mb-6">{t.paymentSuccessMsg}</p>
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setDonorName('');
                      setIsAnonymous(false);
                      setSelectedAmount(25);
                      setIsCustom(false);
                      setCustomAmount('');
                    }}
                    className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                  >
                    {t.makeAnother}
                  </button>
                </div>
              ) : (
                <>
                  {/* Error message */}
                  {paymentError && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-center">
                      {paymentError}
                    </div>
                  )}

                  {/* PayPal Buttons Container */}
                  <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 shadow-lg">
                    {/* PayPal Logo Header */}
                    <div className="flex items-center justify-center gap-2 mb-4 pb-3 border-b border-white/10">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#00457C]" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.77.77 0 0 1 .757-.635h6.79c2.25 0 3.834.494 4.708 1.47.812.909 1.06 2.123.735 3.608-.003.015-.006.03-.009.044l-.001.006v.003c-.42 2.15-1.397 3.63-2.904 4.4-1.458.744-3.315.87-4.934.87H8.567l-.83 5.104a.77.77 0 0 1-.758.635H6.07l-.096.593a.641.641 0 0 0 .633.74h.47zm.65-3.995h1.32c1.41 0 2.645-.11 3.675-.65 1.03-.54 1.72-1.57 2.05-3.06.23-1.03.14-1.78-.29-2.23-.52-.55-1.52-.82-2.99-.82H8.62l-1.09 6.76z"/>
                      </svg>
                      <span className="text-white font-semibold text-lg">PayPal</span>
                    </div>

                    {/* PayPal Buttons */}
                    <div className="paypal-buttons-container">
                      <PayPalButtons
                        style={{
                          layout: 'vertical',
                          color: 'gold',
                          shape: 'pill',
                          label: 'donate',
                          height: 55,
                          tagline: false,
                        }}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                        disabled={isCustom && (!customAmount || parseInt(customAmount, 10) < 1)}
                      />
                    </div>

                    {/* Accepted Cards */}
                    <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-white/10">
                      <img src="https://www.paypalobjects.com/webstatic/icon/pp258.png" alt="PayPal" className="h-6" />
                      <div className="flex gap-1">
                        <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                          <span className="text-[10px] font-bold text-blue-600">VISA</span>
                        </div>
                        <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                          <span className="text-[8px] font-bold text-red-500">MC</span>
                        </div>
                        <div className="w-10 h-6 bg-white rounded flex items-center justify-center">
                          <span className="text-[8px] font-bold text-blue-500">AMEX</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sécurité */}
                  <div className="flex items-center justify-center gap-2 mt-4 text-white/50 text-sm">
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
                    </svg>
                    <span>{t.securePayment}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pourquoi donner + Donateurs récents */}
            <div className="space-y-6">
              {/* Pourquoi donner */}
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-4">{t.whyDonate}</h2>
                <ul className="space-y-3">
                  {[t.reason1, t.reason2, t.reason3, t.reason4].map((reason, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/80">
                      <svg
                        viewBox="0 0 24 24"
                        className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                        fill="currentColor"
                      >
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                      </svg>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Donateurs récents */}
              {recentDonors.length > 0 && (
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h2 className="text-xl font-bold text-white mb-4">{t.recentDonors}</h2>
                  <ul className="space-y-3">
                    {recentDonors.map((donor, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 text-sm font-bold">
                              {(donor.donor_name || t.anonymous).charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-white/80">
                            {donor.donor_name || t.anonymous}
                          </span>
                        </div>
                        <span className="text-white font-bold">${donor.amount}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Message de remerciement */}
              <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl border border-red-500/30 p-6 text-center">
                <div className="text-3xl mb-2">❤️</div>
                <h3 className="text-lg font-bold text-white mb-2">{t.thankYou}</h3>
                <p className="text-white/70 text-sm">{t.everyBitHelps}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
