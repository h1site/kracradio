import Contact from '../../pages-components/Contact';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://kracradio.com';

export const metadata = {
  title: 'Contact Us | KracRadio',
  description: 'Get in touch with the KracRadio team. We\'d love to hear from you about partnerships, music submissions, or general inquiries.',
  openGraph: {
    type: 'website',
    url: `${siteUrl}/contact`,
    title: 'Contact Us | KracRadio',
    description: 'Get in touch with the KracRadio team for partnerships, music submissions, or inquiries.',
    images: [{
      url: 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&h=630&fit=crop',
      width: 1200,
      height: 630,
      alt: 'Contact KracRadio',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us | KracRadio',
    description: 'Get in touch with the KracRadio team.',
    images: ['https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1200&h=630&fit=crop'],
  },
};

export default function ContactPage() { return <Contact />; }
