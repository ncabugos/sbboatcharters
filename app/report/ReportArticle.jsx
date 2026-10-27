import Link from 'next/link';
import { SECTIONS, longDate, paragraphs, reportPath, reportTitle } from '@/lib/reportFormat';
import styles from './report.module.css';

// One report. `as` is the title's heading level: h1 on the report's own page,
// h2 when it is the latest report shown on /report/.
export default function ReportArticle({ report, as: Heading = 'h2', linkTitle = false }) {
  const title = reportTitle(report);
  return (
    <article className={styles.article}>
      <Heading className={styles.title}>
        {linkTitle ? <Link href={reportPath(report)} style={{ color: 'inherit', textDecoration: 'none' }}>{title}</Link> : title}
      </Heading>
      <div className={styles.meta}>
        <time dateTime={report.report_date}>{longDate(report.report_date)}</time>
        <span>Santa Barbara Channel</span>
        {report.water_temp && <span className={styles.metaTemp}>Water temperature {report.water_temp}</span>}
      </div>
      {report.summary && <p className={styles.summary}>{report.summary}</p>}
      {SECTIONS.filter((s) => report[s.key]).map((s) => (
        <section key={s.key} className={styles.section}>
          <h3 className={styles.sectionHeading}>{s.heading}</h3>
          <div className={styles.body}>
            {paragraphs(report[s.key]).map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>
      ))}
    </article>
  );
}

const TRIPS = [
  { label: 'Whale Watching', href: '/whale-watching/' },
  { label: 'Fishing Charters', href: '/sport-fishing/' },
  { label: 'Lobster Diving', href: '/lobster-diving/' },
  { label: 'Spearfishing', href: '/spearfishing/' },
  { label: 'Channel Islands Tour', href: '/channel-islands-tour/' },
  { label: 'Sunset Cruises', href: '/coastal-sunset-cruises/' },
];

export function TripLinks() {
  return (
    <nav className={styles.trips} aria-label="Charters">
      <h2 className={styles.tripsHeading}>Get Out on the Water</h2>
      <div className={styles.tripLinks}>
        {TRIPS.map((t) => <Link key={t.href} href={t.href} className={styles.tripLink}>{t.label}</Link>)}
      </div>
    </nav>
  );
}

export function ArchiveList({ reports }) {
  return (
    <ul className={styles.archiveList}>
      {reports.map((r) => (
        <li key={r.id} className={styles.archiveItem}>
          <Link href={reportPath(r)} className={styles.archiveLink}>
            <span className={styles.archiveDate}>{longDate(r.report_date)}</span>
            <span className={styles.archiveSummary}>{r.summary}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
