'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './admin.module.css';

const LINKS = [
  { href: '/admin', label: 'Bookings' },
  { href: '/admin/manual', label: 'Add booking' },
  { href: '/admin/blackouts', label: 'Blackout dates' },
  { href: '/admin/gift-cards', label: 'Gift cards' },
  { href: '/admin/reports', label: 'Channel Report' },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className={styles.nav}>
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`${styles.navLink} ${pathname === href ? styles.navActive : ''}`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
