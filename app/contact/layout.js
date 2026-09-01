export const metadata = {
  title: 'Contact Us | Santa Barbara Boat Charters',
  description:
    'Get in touch with Santa Barbara Boat Charters. Book a private charter, ask about availability, or plan your custom Channel Islands adventure. Call (805) 722-2282 or send a message.',
  openGraph: {
    title: 'Contact | Santa Barbara Boat Charters',
    description: 'Reach out to book a private charter or ask about availability. Channel Islands tours, sunset cruises, spearfishing & more.',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-channel-islands.jpg', width: 1200, height: 630, alt: 'Santa Barbara Boat Charters' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/hero-channel-islands.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/contact/' },
};

export default function ContactLayout({ children }) {
  return children;
}
