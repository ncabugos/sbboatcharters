import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/gallery/',
  title: 'Photos & Videos',
  description:
    'Videos and photos from our Santa Barbara charters: Channel Islands tours, sunset cruises, spearfishing, whale watching and more. Follow along on Instagram.',
  image: '/images/hero-orcas-channel.jpg',
  imageAlt: 'Orcas in the Santa Barbara Channel',
});

export default function GalleryLayout({ children }) {
  return children;
}
