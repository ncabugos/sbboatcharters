import styles from '../components/ServicePage.module.css';
import r from './report.module.css';
import { getPublishedReports } from '@/lib/reports';
import { pageMetadata } from '@/lib/seo';
import { buildBreadcrumbSchema, jsonLdString } from '@/lib/structuredData';
import ReportArticle, { ArchiveList, TripLinks } from './ReportArticle';

// Publishing in /admin/reports refreshes this page at once (revalidatePath);
// the hourly window is only a backstop.
export const revalidate = 3600;

const META = {
  path: '/report/',
  // "Report" is what people search: "santa barbara fishing report", "whale report".
  title: 'Santa Barbara Fishing and Whale Report',
  description:
    'Weekly report from the Santa Barbara Channel: whale sightings, what is biting, lobster and diving, water temperature and open charter dates.',
  image: '/images/hero-channel-islands.jpg',
  imageAlt: 'The Santa Barbara Channel and the Channel Islands',
};

export async function generateMetadata() {
  const reports = await getPublishedReports(1);
  // Until the first report is published there is nothing worth indexing.
  return { ...pageMetadata(META), ...(reports.length ? {} : { robots: { index: false, follow: true } }) };
}

export default async function ReportIndex() {
  const reports = await getPublishedReports();
  const [latest, ...past] = reports;
  const breadcrumbs = {
    '@context': 'https://schema.org',
    ...buildBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Channel Report', path: META.path }]),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }} />
      <section className={styles.hero} style={{ minHeight: 'clamp(340px, 45vh, 520px)' }}>
        <img src="/images/hero-channel-islands.jpg" alt="The Santa Barbara Channel and the Channel Islands" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroImageOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <h1 className={styles.heroTitle}>Santa Barbara Channel Report</h1>
          <p className={styles.heroSubtitle}>
            What we are seeing on the water each week: whales, fishing, diving and conditions in
            the Santa Barbara Channel, from Captain Garrick.
          </p>
        </div>
      </section>

      <section className={`section ${r.page}`}>
        <div className="container container--narrow">
          {latest ? (
            <ReportArticle report={latest} as="h2" linkTitle />
          ) : (
            <p className={r.empty}>The first report is on its way. Check back soon.</p>
          )}
          <TripLinks />
        </div>
      </section>

      {past.length > 0 && (
        <section className={`section ${r.archive}`}>
          <div className="container container--narrow">
            <h2 className="section-title" style={{ textAlign: 'center' }}>Past Reports</h2>
            <ArchiveList reports={past} />
          </div>
        </section>
      )}
    </>
  );
}
