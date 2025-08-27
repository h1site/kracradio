"use client";
import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

// Types pour les liens de navigation
interface NavLink {
  label: string;
  href: string;
  isActive?: boolean;
}

interface NavigationProps {
  links: NavLink[];
  className?: string;
  onLinkClick?: (href: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  links, 
  className = "",
  onLinkClick 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = (href: string) => {
    setIsMobileMenuOpen(false); // Fermer le menu mobile
    onLinkClick?.(href);
  };

  return (
    <div className={className}>
      {/* Navigation desktop */}
      <nav className="hidden lg:flex space-x-8">
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick(link.href);
            }}
            className={`
              transition-colors font-medium
              ${link.isActive 
                ? 'text-red-500' 
                : 'hover:text-red-500'
              }
            `}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {/* Bouton menu mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors text-black"
        aria-label="Menu"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-50 border-t border-gray-200 z-50">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className={`
                  block py-2 transition-colors font-medium
                  ${link.isActive 
                    ? 'text-red-500' 
                    : 'hover:text-red-500'
                  }
                `}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Navigation;