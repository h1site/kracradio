import Channel from '../../../pages-components/Channel';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

const channelInfo = {
  kracradio: {
    title: 'KracRadio Main',
    description: 'The main KracRadio channel featuring the best indie, alternative, and electronic music 24/7.',
    image: '/channels/kracradio.webp',
  },
  ebm_industrial: {
    title: 'EBM & Industrial',
    description: 'Dark electronic beats, industrial sounds, and EBM classics. The underground pulse of KracRadio.',
    image: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=1200&h=630&fit=crop',
  },
  electro: {
    title: 'Electro',
    description: 'Electronic music from synthwave to techno. Pure electronic vibes on KracRadio.',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=630&fit=crop',
  },
  francophonie: {
    title: 'Francophonie',
    description: 'French-language music from Quebec, France, and beyond. Discover francophone artists on KracRadio.',
    image: 'https://images.unsplash.com/photo-1549834125-82d3c48159a3?w=1200&h=630&fit=crop',
  },
  jazz: {
    title: 'Jazz',
    description: 'Smooth jazz, bebop, and contemporary jazz. Relax with jazz on KracRadio.',
    image: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&h=630&fit=crop',
  },
  metal: {
    title: 'Metal',
    description: 'Heavy metal, death metal, black metal, and more. The heaviest sounds on KracRadio.',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&h=630&fit=crop',
  },
  rock: {
    title: 'Rock',
    description: 'Classic rock, indie rock, alternative rock, and punk. Rock out with KracRadio.',
    image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&h=630&fit=crop',
  },
};

export async function generateMetadata({ params }) {
  const { key } = await params;
  const channel = channelInfo[key] || {
    title: 'Radio Channel',
    description: 'Listen to music on KracRadio.',
    image: '/icon.png',
  };

  return {
    title: `${channel.title} | KracRadio`,
    description: channel.description,
    openGraph: {
      type: 'music.radio_station',
      url: `${siteUrl}/channel/${key}`,
      title: `${channel.title} | KracRadio`,
      description: channel.description,
      images: [{
        url: channel.image,
        width: 1200,
        height: 630,
        alt: channel.title,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${channel.title} | KracRadio`,
      description: channel.description,
      images: [channel.image],
    },
  };
}

export default function ChannelPage() {
  return <Channel />;
}
