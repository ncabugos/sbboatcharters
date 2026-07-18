import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminAuth';
import AdminNav from './AdminNav';
import BookingsTable from './BookingsTable';
import styles from './admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Bookings', robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Upcoming Bookings</h1>
      <AdminNav />
      <BookingsTable />
    </div>
  );
}
