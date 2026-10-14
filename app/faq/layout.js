import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  path: '/faq/',
  title: 'Charter FAQ',
  description:
    'Answers to common questions about our private Santa Barbara charters: group size, what to bring, the cancellation policy, where we meet and more.',
});

export default function FaqLayout({ children }) {
  return children;
}
