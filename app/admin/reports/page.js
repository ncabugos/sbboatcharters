import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminAuth';
import AdminNav from '../AdminNav';
import ReportsManager from './ReportsManager';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Channel Report', robots: { index: false } };

export default async function ReportsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Channel Report</h1>
      <AdminNav />
      <ReportsManager />
    </div>
  );
}
