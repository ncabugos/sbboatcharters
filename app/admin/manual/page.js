import { redirect } from 'next/navigation';
import { isAdminRequest } from '@/lib/adminAuth';
import { sql } from '@/lib/db';
import AdminNav from '../AdminNav';
import ManualBookingForm from './ManualBookingForm';
import styles from '../admin.module.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Admin — Add Booking', robots: { index: false } };

export default async function ManualBookingPage() {
  if (!(await isAdminRequest())) redirect('/admin/login');

  const tours = await sql`
    SELECT t.id, t.name, t.max_party,
           json_agg(json_build_object('id', p.id, 'label', p.label, 'durationMin', p.duration_min)
                    ORDER BY p.sort_order) AS options
    FROM tours t
    JOIN pricing_options p ON p.tour_id = t.id AND p.active
    WHERE t.active
    GROUP BY t.id
    ORDER BY t.sort_order`;

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Add a Booking (Phone)</h1>
      <AdminNav />
      <ManualBookingForm tours={tours} />
    </div>
  );
}
