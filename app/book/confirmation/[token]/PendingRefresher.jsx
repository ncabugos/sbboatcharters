'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// While a booking is pending (webhook in flight), re-render the server page
// every few seconds until it flips to confirmed. Gives up after ~2 minutes.
export default function PendingRefresher() {
  const router = useRouter();
  const count = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      count.current += 1;
      if (count.current > 30) {
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 4000);
    return () => clearInterval(id);
  }, [router]);

  return null;
}
