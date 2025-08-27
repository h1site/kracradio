'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';

// Type definitions (make sure these match your Header component)
interface ChannelConfig {
  id: string;
  name: string;
  streamUrl: string;
  slug: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export default function Home() {
  // Add state for current channel
  const [currentChannel, setCurrentChannel] = useState<ChannelConfig | null>(null);

  return (
    <div>
      <Header 
        currentChannel={currentChannel}
        setCurrentChannel={setCurrentChannel}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to KRAC RADIO
          </h1>
          {/* Your other content */}
        </div>
      </main>
    </div>
  );
}