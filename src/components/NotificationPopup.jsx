// src/components/NotificationPopup.jsx
import React, { useEffect, useState } from 'react';
import { useNotification } from '../context/NotificationContext';

export default function NotificationPopup() {
  const { notification, hideNotification } = useNotification();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      // Trigger animation
      setTimeout(() => setIsVisible(true), 10);

      // Auto-hide animation before removal
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2700);

      return () => clearTimeout(hideTimer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification) return null;

  return (
    <div
      className={`fixed top-[68px] right-[140px] z-[9999] transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      {/* Arrow pointing up to the heart icon in header */}
      <div className="flex justify-center mb-1">
        <svg
          className="w-6 h-6 text-white dark:text-gray-800 drop-shadow-md"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M7 14l5-5 5 5H7z"/>
        </svg>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[200px] max-w-md">
        {/* Icon */}
        <div className={`flex-shrink-0 w-5 h-5 ${
          notification.type === 'song' ? 'text-green-500' :
          notification.type === 'video' ? 'text-blue-500' :
          'text-gray-500'
        }`}>
          {notification.type === 'song' && (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          )}
          {notification.type === 'video' && (
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          )}
        </div>

        {/* Message */}
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {notification.message}
        </p>

        {/* Close button */}
        <button
          onClick={hideNotification}
          className="flex-shrink-0 ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
