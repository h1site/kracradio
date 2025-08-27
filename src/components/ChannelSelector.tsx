"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Radio, Music, Mic, Headphones, Zap, Disc } from 'lucide-react';

// Types pour les chaînes - Compatible avec ChannelConfig
interface RadioChannel {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  streamUrl?: string;
  apiEndpoint?: string;
  icon?: React.ReactNode;
  color?: string;
  listeners?: number;
  isActive?: boolean;
  order?: number;
}

interface ChannelSelectorProps {
  channels: RadioChannel[];
  currentChannel: RadioChannel;
  onChannelChange: (channel: RadioChannel) => void;
  className?: string;
  variant?: 'dropdown' | 'tabs' | 'slider';
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channels,
  currentChannel,
  onChannelChange,
  className = "",
  variant = 'dropdown'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown si clic à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChannelSelect = async (channel: RadioChannel) => {
    if (channel.id === currentChannel.id || isChanging) return;

    setIsChanging(true);
    setIsOpen(false);
    
    try {
      await onChannelChange(channel);
    } catch (error) {
      console.error('Erreur lors du changement de chaîne:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // Variante Dropdown (recommandée pour le header)
  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Bouton principal */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={isChanging}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
            ${currentChannel.color ? `bg-${currentChannel.color}-50 border-${currentChannel.color}-200` : 'bg-gray-50 border-gray-200'}
            border hover:shadow-md disabled:opacity-50
          `}
        >
          <div className="flex items-center space-x-2">
            {currentChannel.icon || <Radio className="w-4 h-4" />}
            <div className="text-left hidden sm:block">
              <div className="font-medium text-sm">{currentChannel.name}</div>
              <div className="text-xs text-gray-500">{currentChannel.description}</div>
            </div>
            <div className="sm:hidden font-medium text-sm">
              {currentChannel.name}
            </div>
          </div>
          
          {isChanging ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-64">
            <div className="py-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => handleChannelSelect(channel)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors
                    ${channel.id === currentChannel.id ? 'bg-red-50 border-r-2 border-red-500' : ''}
                  `}
                >
                                      <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {channel.icon || <Radio className="w-4 h-4" />}
                      <div>
                        <div className="font-medium">{channel.name}</div>
                        <div className="text-sm text-gray-500">{channel.description}</div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Variante Tabs (pour desktop uniquement)
  if (variant === 'tabs') {
    return (
      <div className={`hidden lg:flex space-x-1 bg-gray-100 p-1 rounded-lg ${className}`}>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelSelect(channel)}
            disabled={isChanging}
            className={`
              px-4 py-2 rounded-md transition-all font-medium text-sm
              ${channel.id === currentChannel.id 
                ? 'bg-white shadow-sm text-red-600' 
                : 'hover:bg-white/50 text-gray-600 hover:text-gray-900'
              }
              disabled:opacity-50
            `}
          >
            <div className="flex items-center space-x-2">
              {channel.icon || <Radio className="w-4 h-4" />}
              <span>{channel.name}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }

  // Variante Slider (pour mobile)
  if (variant === 'slider') {
    return (
      <div className={`flex overflow-x-auto space-x-3 pb-2 ${className}`}>
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => handleChannelSelect(channel)}
            disabled={isChanging}
            className={`
              flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-all
              ${channel.id === currentChannel.id 
                ? 'bg-red-500 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
              disabled:opacity-50
            `}
          >
            {channel.icon || <Radio className="w-4 h-4" />}
            <span className="whitespace-nowrap text-sm font-medium">{channel.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return null;
};

export default ChannelSelector;
