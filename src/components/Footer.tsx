'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin, 
  Radio,
  Heart,
  ExternalLink
} from 'lucide-react';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className = "" }) => {
  const router = useRouter();

  const navigateToHome = () => {
    router.push('/');
  };

  const navigateToSchedule = () => {
    router.push('/horaire');
  };

  // Liens de navigation organisés par catégorie
  const navigationLinks = [
    {
      title: "Navigation",
      links: [
        { label: "Accueil", onClick: navigateToHome },
        { label: "Horaire", onClick: navigateToSchedule },
        { label: "Émissions", href: "#" },
        { label: "Contact", href: "#contact" }
      ]
    },
    {
      title: "Écouter",
      links: [
        { label: "En Direct", href: "#" },
        { label: "Podcasts", href: "#" },
        { label: "Playlists", href: "#" },
        { label: "Archives", href: "#" }
      ]
    },
    {
      title: "Communauté",
      links: [
        { label: "Artistes locaux", href: "#" },
        { label: "Événements", href: "#" },
        { label: "Newsletter", href: "#newsletter" },
        { label: "Partenaires", href: "#" }
      ]
    }
  ];

  // Liens réseaux sociaux
  const socialLinks = [
    { 
      name: "Facebook", 
      icon: Facebook, 
      url: "https://facebook.com/kracradio",
      color: "hover:text-blue-600" 
    },
    { 
      name: "Instagram", 
      icon: Instagram, 
      url: "https://instagram.com/kracradio",
      color: "hover:text-pink-500" 
    },
    { 
      name: "Twitter", 
      icon: Twitter, 
      url: "https://twitter.com/kracradio",
      color: "hover:text-blue-400" 
    },
    { 
      name: "YouTube", 
      icon: Youtube, 
      url: "https://youtube.com/kracradio",
      color: "hover:text-red-500" 
    }
  ];

  // Informations de contact
  const contactInfo = [
    {
      icon: Phone,
      label: "Téléphone",
      value: "+1 (514) 123-4567",
      link: "tel:+15141234567"
    },
    {
      icon: Mail,
      label: "Email",
      value: "info@kracradio.com",
      link: "mailto:info@kracradio.com"
    },
    {
      icon: MapPin,
      label: "Adresse",
      value: "Montréal, QC, Canada",
      link: "https://maps.google.com/?q=Montreal+QC"
    }
  ];

  return (
    <footer className={`bg-gray-900 text-white ${className}`}>
      
      {/* Section principale du footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Colonne 1: Branding et description */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-500 p-2 rounded-lg">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">KRAC RADIO</h3>
                <p className="text-sm text-gray-400">Votre son, notre passion</p>
              </div>
            </div>
            
            <p className="text-gray-400 mb-6 text-sm leading-relaxed">
              KRAC RADIO, votre station radio préférée depuis plus de 10 ans. 
              Musique, actualités, et divertissement 24h/24, 7j/7. 
              Découvrez les talents locaux et internationaux.
            </p>

            {/* Réseaux sociaux */}
            <div className="space-y-3">
              <h4 className="font-semibold text-white text-sm">Suivez-nous</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      p-2 bg-gray-800 rounded-lg transition-all duration-300 
                      hover:bg-gray-700 transform hover:scale-110
                      ${social.color}
                    `}
                    title={`Suivez-nous sur ${social.name}`}
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Colonnes 2-4: Liens de navigation */}
          {navigationLinks.map((section, index) => (
            <div key={index}>
              <h4 className="font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    {link.onClick ? (
                      <button
                        onClick={link.onClick}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm cursor-pointer"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm flex items-center group"
                      >
                        <span>{link.label}</span>
                        {link.href?.startsWith('http') && (
                          <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Section contact */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h4 className="font-semibold text-white mb-4 flex items-center">
                <Phone className="w-4 h-4 mr-2" />
                Contactez-nous
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {contactInfo.map((contact, index) => (
                  <a
                    key={index}
                    href={contact.link}
                    className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"
                  >
                    <contact.icon className="w-4 h-4 text-red-500 group-hover:text-red-400" />
                    <div>
                      <p className="text-xs text-gray-500">{contact.label}</p>
                      <p className="text-sm">{contact.value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Newsletter signup */}
            <div>
              <h4 className="font-semibold text-white mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Newsletter
              </h4>
              <p className="text-gray-400 text-sm mb-3">
                Recevez nos actualités et événements
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 text-sm"
                />
                <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-r-lg transition-colors">
                  <Mail className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barre de copyright */}
      <div className="bg-gray-950 border-t border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>&copy; 2024 KRAC RADIO. Tous droits réservés.</span>
              <span className="text-red-500">•</span>
              <span className="flex items-center">
                Fait avec <Heart className="w-3 h-3 mx-1 text-red-500" fill="currentColor" /> à Montréal
              </span>
            </div>
            
            <div className="flex space-x-6 text-sm">
              <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                Confidentialité
              </a>
              <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                Conditions
              </a>
              <a href="/cookies" className="text-gray-400 hover:text-white transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;