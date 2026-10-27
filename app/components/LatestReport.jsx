import Link from 'next/link';
import { getLatestReport, longDate, reportPath } from '@/lib/reports';
import styles from '../report/report.module.css';

// "On the water this week" line for the tour pages, pointing at the newest
// Channel Report. Renders nothing until one is published.
export default async function LatestReport() {
  const report = await getLatestReport();
  if (!report) return null;
  return (
    <p className={styles.latest}>
      What we are seeing on the water:{' '}
      <Link href={reportPath(report)}>Channel Report, {longDate(report.report_date)}</Link>
    </p>
  );
}
