'use client';

import { useEffect, useState } from 'react';

export default function ArticleClientParts({ articleUserId }) {
  const [readingProgress, setReadingProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const totalHeight = el.scrollHeight - el.clientHeight;
      if (totalHeight > 0) {
        setReadingProgress((el.scrollTop / totalHeight) * 100);
      } else {
        setReadingProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-red-500 z-50 transition-all duration-150"
        style={{ width: `${readingProgress}%` }}
      />
    </>
  );
}
