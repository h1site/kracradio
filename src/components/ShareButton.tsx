"use client";
import React from 'react';
import { Share2 } from 'lucide-react';

interface ShareData {
  title?: string;
  artist?: string;
  url?: string;
  text?: string;
}

interface ShareButtonProps {
  shareData: ShareData;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'icon' | 'button' | 'text';
  onShare?: (shareData: ShareData) => void;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  shareData,
  className = "",
  size = 'md',
  variant = 'icon',
  onShare
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5', 
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const generateShareText = () => {
    const { title, artist, url = 'https://radiomontreal.com', text } = shareData;
    
    if (text) return text;
    
    if (title && artist) {
      return `🎵 J'écoute "${title}" par ${artist} sur Radio Montréal ! ${url}`;
    }
    
    if (title) {
      return `🎵 En écoute sur Radio Montréal : ${title} ${url}`;
    }
    
    return `🎵 J'écoute Radio Montréal en direct ! ${url}`;
  };

  const handleShare = async () => {
    const shareText = generateShareText();
    const finalShareData = {
      ...shareData,
      text: shareText
    };

    // Callback personnalisé
    onShare?.(finalShareData);

    try {
      // Web Share API (mobile/moderne)
      if (navigator.share) {
        await navigator.share({
          title: shareData.title || 'Radio Montréal',
          text: shareText,
          url: shareData.url
        });
        return;
      }

      // Fallback: Clipboard API
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        
        // Notification temporaire
        const notification = document.createElement('div');
        notification.textContent = 'Lien copié !';
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] transition-opacity';
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
        }, 2000);
        
        return;
      }

      // Fallback final: prompt
      prompt('Copiez ce lien pour partager :', shareText);
      
    } catch (error) {
      console.error('Erreur lors du partage:', error);
    }
  };

  if (variant === 'text') {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors ${className}`}
      >
        <Share2 className={sizeClasses[size]} />
        <span>Partager</span>
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        onClick={handleShare}
        className={`inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors ${className}`}
      >
        <Share2 className={sizeClasses[size]} />
        <span>Partager</span>
      </button>
    );
  }

  // Variant 'icon' (par défaut)
  return (
    <button
      onClick={handleShare}
      className={`
        ${buttonSizeClasses[size]} hover:bg-gray-200 rounded-full transition-colors group
        ${className}
      `}
      title="Partager ce titre"
      aria-label="Partager"
    >
      <Share2 className={`${sizeClasses[size]} group-hover:text-blue-500`} />
    </button>
  );
};

export default ShareButton;