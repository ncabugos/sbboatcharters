export const metadata = {
  title: 'Media Gallery | Santa Barbara Boat Charter Adventures',
  description:
    'Watch the latest videos and follow along on Instagram with Santa Barbara Boat Charters. Channel Islands tours, sunset cruises, spearfishing expeditions, whale watching, and more.',
  openGraph: {
    title: 'Media Gallery | Santa Barbara Boat Charters',
    description: 'Videos and photos from our Channel Islands tours, sunset cruises, spearfishing expeditions, and whale watching adventures.',
    images: [{ url: 'https://www.sbboatcharters.com/images/hero-orcas-channel.jpg', width: 1200, height: 630, alt: 'Orcas in the Santa Barbara Channel' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['https://www.sbboatcharters.com/images/hero-orcas-channel.jpg'],
  },
  alternates: { canonical: 'https://www.sbboatcharters.com/gallery' },
};

export default function GalleryLayout({ children }) {
  return children;
}
