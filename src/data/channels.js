// src/data/channels.js
export const channels = [
  {
    key: 'ebm_industrial',
    name: 'EBM Industrial',
    streamUrl: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/4',
    image: '/channels/ebm_industrial.webp',
  },
  {
    key: 'electro',
    name: 'Electro',
    streamUrl: 'https://stream.kracradio.com/listen/electro/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/7',
    image: '/channels/electro.webp',
  },
  {
    key: 'francophonie',
    name: 'Francophonie',
    streamUrl: 'https://stream.kracradio.com/listen/franco/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/6',
    image: '/channels/francophonie.webp',
  },
  {
    key: 'jazz',
    name: 'Jazz',
    streamUrl: 'https://stream.kracradio.com/listen/jazz/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/2',
    image: '/channels/jazz.webp',
  },
  {
    key: 'kracradio',
    name: 'KracRadio',
    streamUrl: 'https://stream.kracradio.com/listen/kracradio/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/1',
    image: '/channels/kracradio.webp',
  },
  {
    key: 'metal',
    name: 'Metal',
    streamUrl: 'https://stream.kracradio.com/listen/metal/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/5',
    image: '/channels/metal.webp',
  },
  {
    key: 'rock',
    name: 'Rock',
    streamUrl: 'https://stream.kracradio.com/listen/rock/radio.mp3',
    apiUrl: 'https://stream.kracradio.com/api/nowplaying/8',
    image: '/channels/rock.webp',
  },
];

export function getChannelByKey(key) {
  return channels.find((c) => c.key === key) || null;
}
