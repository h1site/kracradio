// src/components/CommunityTutorial.jsx
import React, { useState } from 'react';
import { useI18n } from '../i18n';

export default function CommunityTutorial({ onClose }) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const tutorial = t?.community?.tutorial || {};

  const steps = [
    {
      title: tutorial.step1?.title || '🔓 Profil Public ON/OFF',
      description: tutorial.step1?.description || 'Contrôlez la visibilité de votre profil.',
      action: tutorial.step1?.action || "⚠️ Important : Votre profil doit être PUBLIC pour être visible par d'autres !",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: tutorial.step2?.title || '🔗 URL Publique Personnalisée',
      description: tutorial.step2?.description || 'Créez votre nom d\'artiste unique pour avoir une URL personnalisée.',
      action: tutorial.step2?.action || "Dans 'Paramètres', définissez votre 'Nom d'artiste' pour créer votre URL publique unique.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: tutorial.step3?.title || '🎨 Personnalisation du Profil',
      description: tutorial.step3?.description || 'Ajoutez une bannière et une photo de profil pour personnaliser votre page artiste.',
      action: tutorial.step3?.action || "Allez dans l'onglet 'Personnalisation' pour télécharger votre bannière et votre avatar.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.3"/>
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: tutorial.step4?.title || '🎵 Liens Musicaux',
      description: tutorial.step4?.description || 'Ajoutez vos liens Spotify, Bandcamp, SoundCloud, YouTube, et plus encore.',
      action: tutorial.step4?.action || "Dans l'onglet 'Liens musicaux', ajoutez tous vos liens de plateformes musicales.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>
        </svg>
      ),
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    }
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleFinish = () => {
    // Marquer le tutorial comme vu dans localStorage
    localStorage.setItem('kracradio_community_tutorial_seen', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('kracradio_community_tutorial_seen', 'true');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        {/* Header avec gradient */}
        <div className={`bg-gradient-to-r ${currentStepData.color} p-8 text-white text-center`}>
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <h2 className="text-3xl font-extrabold mb-2">
            {currentStep === 0 ? (tutorial.title || '🌐 Guide de votre Communauté') : currentStepData.title}
          </h2>
          {currentStep === 0 && (
            <p className="text-lg opacity-90">
              {tutorial.subtitle || 'Découvrez comment gérer votre profil d\'artiste'}
            </p>
          )}
        </div>

        {/* Contenu */}
        <div className={`p-8 ${currentStepData.bgColor}`}>
          <div className="mb-6">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              {currentStepData.description}
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                💡 {currentStepData.action}
              </p>
            </div>
          </div>

          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep
                    ? 'w-8 bg-gradient-to-r ' + currentStepData.color
                    : idx < currentStep
                    ? 'w-2 bg-gray-400 dark:bg-gray-600'
                    : 'w-2 bg-gray-300 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center gap-4">
            <button
              onClick={handleSkip}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
            >
              {tutorial.skip || 'Passer'}
            </button>

            <div className="flex gap-3">
              {!isFirstStep && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  {tutorial.prev || 'Précédent'}
                </button>
              )}
              <button
                onClick={handleNext}
                className={`px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition bg-gradient-to-r ${currentStepData.color}`}
              >
                {isLastStep ? (tutorial.finish || 'Terminer') : (tutorial.next || 'Suivant')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
