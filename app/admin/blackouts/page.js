import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminAuth';
import AdminNav from '../AdminNav';
import BlackoutsManager from './BlackoutsManager';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Blackout Dates', robots: { index: false } };

export default async function BlackoutsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Blackout Dates</h1>
      <AdminNav />
      <BlackoutsManager />
    </div>
  );
}
