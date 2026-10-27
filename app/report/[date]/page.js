import Link from 'next/link';
import { notFound } from 'next/navigation';
import styles from '../../components/ServicePage.module.css';
import r from '../report.module.css';
import { getPublishedReport, getPublishedReports, reportPath, reportTitle } from '@/lib/reports';
import { pageMetadata } from '@/lib/seo';
import { buildBreadcrumbSchema, buildReportSchema, jsonLdString } from '@/lib/structuredData';
import ReportArticle, { ArchiveList, TripLinks } from '../ReportArticle';

// Publishing or editing in /admin/reports refreshes these pages at once; a
// report published after the build renders on its first visit.
export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getPublishedReports()).map((rep) => ({ date: rep.report_date }));
}

function describe(report) {
  const text = report.summary || `Whales, fishing, diving and conditions in the Santa Barbara Channel.`;
  return text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
}

export async function generateMetadata({ params }) {
  const { date } = await params;
  const report = await getPublishedReport(date);
  if (!report) return { title: 'Channel Report', robots: { index: false } };
  return pageMetadata({
    path: reportPath(report),
    title: reportTitle(report),
    description: describe(report),
    image: '/images/hero-channel-islands.jpg',
    imageAlt: 'The Santa Barbara Channel and the Channel Islands',
  });
}

export default async function ReportPage({ params }) {
  const { date } = await params;
  const report = await getPublishedReport(date);
  if (!report) notFound();

  const title = reportTitle(report);
  const path = reportPath(report);
  const others = (await getPublishedReports(6)).filter((x) => x.id !== report.id).slice(0, 5);
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      buildReportSchema({ report, title, path, description: describe(report) }),
      buildBreadcrumbSchema([
        { name: 'Home', path: '/' },
        { name: 'Channel Report', path: '/report/' },
        { name: title, path },
      ]),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(schema) }} />
      <section className={styles.hero} style={{ minHeight: 'clamp(260px, 32vh, 380px)' }}>
        <img src="/images/hero-channel-islands.jpg" alt="" aria-hidden="true" className={styles.heroBgImage} loading="eager" fetchPriority="high" />
        <div className={styles.heroImageOverlay} />
        <div className={`container ${styles.heroContent}`}>
          <p className={styles.heroSubtitle}>
            <Link href="/report/" style={{ color: 'inherit' }}>Santa Barbara Channel Report</Link>
          </p>
        </div>
      </section>

      <section className={`section ${r.page}`}>
        <div className="container container--narrow">
          <ReportArticle report={report} as="h1" />
          <TripLinks />
        </div>
      </section>

      {others.length > 0 && (
        <section className={`section ${r.archive}`}>
          <div className="container container--narrow">
            <h2 className="section-title" style={{ textAlign: 'center' }}>More Reports</h2>
            <ArchiveList reports={others} />
          </div>
        </section>
      )}
    </>
  );
}
