import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollReveal from './components/ScrollReveal';

export const metadata = {
  title: {
    default: 'Santa Barbara Boat Charters | Private 6-Passenger Channel Islands Tours',
    template: '%s | Santa Barbara Boat Charters',
  },
  description:
    'Private boat charters in Santa Barbara. Channel Islands tours, sunset cruises, spearfishing, sport fishing & foiling. 20+ years experience. USCG licensed. Book your private 6-passenger adventure today.',
  keywords: [
    'Santa Barbara boat charter',
    'private boat charter Santa Barbara',
    'Channel Islands tour',
    'Santa Barbara sunset cruise',
    'spearfishing Santa Barbara',
    'sport fishing Santa Barbara',
    'Santa Barbara private yacht',
    'Santa Cruz Island boat tour',
  ],
  openGraph: {
    title: 'Santa Barbara Boat Charters | Private Channel Islands Adventures',
    description:
      'Private 6-passenger boat charters in Santa Barbara. Channel Islands tours, sunset cruises, spearfishing & more. Over 20 years of coastal expertise.',
    url: 'https://www.sbboatcharters.com',
    siteName: 'Santa Barbara Boat Charters',
    locale: 'en_US',
    type: 'website',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-channel-islands.jpg', width: 1200, height: 630, alt: 'Santa Barbara Boat Charters — Channel Islands' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Santa Barbara Boat Charters',
    description: 'Private 6-passenger adventures in the Santa Barbara Channel.',
    images: ['https://www.sbboatcharters.com/images/hero-channel-islands.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: 'https://www.sbboatcharters.com',
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
      </body>
    </html>
  );
}
