import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/contact/',
  title: 'Contact Us',
  description:
    'Book a private charter, check availability or plan a custom Channel Islands trip with Santa Barbara Boat Charters. Call (805) 722-2282 or send a message.',
});

export default function ContactLayout({ children }) {
  return children;
}
