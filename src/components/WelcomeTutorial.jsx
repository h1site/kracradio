// src/components/WelcomeTutorial.jsx
import React, { useState } from 'react';
import { useI18n } from '../i18n';

export default function WelcomeTutorial({ onClose }) {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const tutorial = t?.profile?.welcomeTutorial || {};

  const steps = [
    {
      title: tutorial.step0?.title || '❤️ Aimer vos chansons préférées',
      description: tutorial.step0?.description || 'Cliquez sur le cœur pour ajouter une chanson à vos favoris pendant l\'écoute.',
      action: tutorial.step0?.action || "Utilisez le bouton ❤️ dans le lecteur audio pour aimer une chanson. Retrouvez vos favoris dans 'Liked Songs'.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ),
      color: 'from-red-500 to-pink-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: tutorial.step1?.title || '📝 Écrire des articles de blog',
      description: tutorial.step1?.description || 'Partagez vos idées, histoires et actualités musicales avec la communauté.',
      action: tutorial.step1?.action || "Cliquez sur le bouton 'Tableau de bord' puis créez votre premier article.",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 14h-3v3h-2v-3H8v-2h3v-3h2v3h3v2zm-3-7V3.5L18.5 9H13z"/>
        </svg>
      ),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: tutorial.step2?.title || '🎙️ Ajouter des podcasts',
      description: tutorial.step2?.description || 'Diffusez vos émissions audio et développez votre audience.',
      action: tutorial.step2?.action || 'Accédez au tableau de bord et ajoutez votre premier podcast ou importez un flux RSS.',
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
        </svg>
      ),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      title: tutorial.step3?.title || '🌐 Publier votre profil artiste',
      description: tutorial.step3?.description || 'Créez votre présence en ligne et connectez-vous avec d\'autres artistes.',
      action: tutorial.step3?.action || "⚠️ Important : Allez dans 'Ma Communauté' et activez 'Profil public' pour être visible !",
      icon: (
        <svg viewBox="0 0 24 24" className="h-16 w-16" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
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
    localStorage.setItem('kracradio_tutorial_seen', 'true');
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem('kracradio_tutorial_seen', 'true');
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
            {currentStep === 0 ? (tutorial.title || '👋 Bienvenue sur KracRadio !') : currentStepData.title}
          </h2>
          {currentStep === 0 && (
            <p className="text-lg opacity-90">
              {tutorial.subtitle || 'Découvrez comment utiliser votre espace créateur'}
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
