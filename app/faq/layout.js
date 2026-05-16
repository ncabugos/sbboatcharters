export const metadata = {
  title: 'FAQ | Santa Barbara Boat Charters',
  description:
    'Frequently asked questions about Santa Barbara Boat Charters. Learn about boat capacity, what to bring, cancellation policy, departure location, and more.',
  openGraph: {
    title: 'FAQ | Santa Barbara Boat Charters',
    description: 'Answers to common questions about our private charters — capacity, what to bring, departure location, and booking.',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-channel-islands.jpg', width: 1200, height: 630, alt: 'Santa Barbara Boat Charters' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/hero-channel-islands.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/faq' },
};

export default function FaqLayout({ children }) {
  return children;
}
