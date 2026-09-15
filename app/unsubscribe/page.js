import Link from 'next/link';
import styles from '../book/book.module.css';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Unsubscribe', robots: { index: false } };

export default async function UnsubscribePage({ searchParams }) {
  const { t = '', done } = await searchParams;
  const valid = /^[0-9a-f]{32}$/.test(t);

  return (
    <section className={styles.hero}>
      <div className="container">
        {done ? (
          <>
            <h1 className={styles.heroTitle}>You&apos;re unsubscribed</h1>
            <p className={styles.heroSubtitle}>
              We won&apos;t send you any more reminder emails. You&apos;ll still get the
              confirmation and receipt for any trip you book.
            </p>
            <p><Link href="/" className="btn btn--primary">Back to the site</Link></p>
          </>
        ) : valid ? (
          <>
            <h1 className={styles.heroTitle}>Unsubscribe</h1>
            <p className={styles.heroSubtitle}>
              Stop reminder emails from SB Boat Charters. Booking confirmations and receipts
              will still be sent.
            </p>
            <form method="post" action={`/api/unsubscribe/?t=${t}`}>
              <button type="submit" className="btn btn--primary">Unsubscribe</button>
            </form>
          </>
        ) : (
          <>
            <h1 className={styles.heroTitle}>This link isn&apos;t valid</h1>
            <p className={styles.heroSubtitle}>
              Reply to any of our emails or call (805) 722-2282 and we&apos;ll take you off the list.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
