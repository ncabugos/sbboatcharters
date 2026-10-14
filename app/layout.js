import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollReveal from './components/ScrollReveal';
import Analytics from './components/Analytics';
import { SITE } from '@/lib/structuredData';
import { SITE_NAME, DEFAULT_OG_IMAGE } from '@/lib/seo';

// Defaults only. Each page sets its own canonical and share tags through
// pageMetadata() in lib/seo.js; nothing here should name a specific URL, or
// pages that forget to override it (the 404 included) inherit the wrong one.
export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Santa Barbara Boat Charters | Private Channel Islands Tours',
    // Short brand so page titles stay near 60 characters in search results.
    template: '%s | SB Boat Charters',
  },
  description:
    'Private boat charters in Santa Barbara. Channel Islands tours, sunset cruises, spearfishing, lobster diving, sport fishing & foiling. 20+ years experience. USCG licensed. Book your private 6-passenger adventure today.',
  keywords: [
    'Santa Barbara boat charter',
    'private boat charter Santa Barbara',
    'Channel Islands tour',
    'Santa Barbara sunset cruise',
    'spearfishing Santa Barbara',
    'lobster diving Santa Barbara',
    'sport fishing Santa Barbara',
    'Santa Barbara private yacht',
    'Santa Cruz Island boat tour',
  ],
  openGraph: {
    siteName: SITE_NAME,
    locale: 'en_US',
    type: 'website',
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/logo-favicon.jpg', type: 'image/jpeg' },
    ],
    shortcut: '/logo-favicon.jpg',
    apple: '/logo-favicon.jpg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#141618',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="geo.region" content="US-CA" />
        <meta name="geo.placename" content="Santa Barbara" />
        <meta name="geo.position" content="34.4048;-119.6932" />
        <meta name="ICBM" content="34.4048, -119.6932" />
      </head>
      <body>
        <Header />
        <ScrollReveal />
        <main>{children}</main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
