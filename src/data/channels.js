// src/data/channels.js
import data from './channels.json';

const STREAMS = {
  kracradio:      'https://stream.kracradio.com/listen/kracradio/radio.mp3',
  ebm_industrial: 'https://stream.kracradio.com/listen/ebm_industrial/radio.mp3',
  electro:        'https://stream.kracradio.com/listen/electro/radio.mp3',
  francophonie:   'https://stream.kracradio.com/listen/franco/radio.mp3',
  jazz:           'https://stream.kracradio.com/listen/jazz/radio.mp3',
  metal:          'https://stream.kracradio.com/listen/metal/radio.mp3',
  rock:           'https://stream.kracradio.com/listen/rock/radio.mp3'
};

const APIS = {
  kracradio:      'https://stream.kracradio.com/api/nowplaying/1',
  ebm_industrial: 'https://stream.kracradio.com/api/nowplaying/4',
  electro:        'https://stream.kracradio.com/api/nowplaying/7',
  francophonie:   'https://stream.kracradio.com/api/nowplaying/6',
  jazz:           'https://stream.kracradio.com/api/nowplaying/2',
  metal:          'https://stream.kracradio.com/api/nowplaying/5',
  rock:           'https://stream.kracradio.com/api/nowplaying/8'
};

export const channels = data.map((c) => ({
  ...c,
  streamUrl: STREAMS[c.key],
  apiUrl: APIS[c.key],
}));
