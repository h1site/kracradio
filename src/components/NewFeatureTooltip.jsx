// src/components/NewFeatureTooltip.jsx
import React, { useEffect, useState } from 'react';
import { useI18n } from '../i18n';

export default function NewFeatureTooltip({ targetRef, onClose }) {
  const { t } = useI18n();
  const player = t?.player ?? {};
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!targetRef?.current) return;

    const updatePosition = () => {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 60, // Position above the button
        left: rect.left + rect.width / 2 // Center horizontally
      });
      setVisible(true);
    };

    // Wait a bit for the layout to settle
    const timer = setTimeout(updatePosition, 100);

    // Auto-dismiss after 5 seconds
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000);

    // Update position on resize
    window.addEventListener('resize', updatePosition);

    return () => {
      clearTimeout(timer);
      clearTimeout(dismissTimer);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetRef, onClose]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none animate-bounce-subtle"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)'
      }}
    >
      {/* Speech bubble */}
      <div className="relative bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold text-sm whitespace-nowrap animate-fade-in">
        {player.newFeatureTooltip ?? 'Nouveau lecteur indépendant'}
        {/* Arrow pointing down */}
        <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500" />
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-5px); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
