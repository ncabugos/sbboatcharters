import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminAuth';
import AdminNav from '../AdminNav';
import GiftCardsTable from './GiftCardsTable';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Gift Cards', robots: { index: false } };

export default async function AdminGiftCardsPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');
  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Gift Cards</h1>
      <AdminNav />
      <GiftCardsTable />
    </div>
  );
}
