import GiftCardForm from './GiftCardForm';
import styles from '../../book/book.module.css';
import { pageMetadata } from '@/lib/seo';

export const dynamic = 'force-dynamic';

export const metadata = pageMetadata({
  path: '/gift-cards/purchase/',
  title: 'Buy a Gift Card',
  description:
    'Give the gift of a private Santa Barbara boat charter. Gift cards in any amount from $50 to $2,000, delivered instantly by email. They never expire.',
  image: '/images/sunset-cruise.webp',
  imageAlt: 'Santa Barbara boat charter gift card',
});

export default function GiftCardPurchasePage() {
  const stripeReady = Boolean(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_STRIPE_CONNECTED_ACCOUNT_ID
  );
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <span className="section-label" style={{ color: 'var(--color-accent)' }}>Give Adventure</span>
          <h1 className={styles.heroTitle}>Buy a Gift Card</h1>
          <p className={styles.heroSubtitle}>
            Delivered instantly by email. Redeemable on any charter. Never expires.
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container container--narrow">
          <GiftCardForm stripeReady={stripeReady} />
        </div>
      </section>
    </>
  );
}
