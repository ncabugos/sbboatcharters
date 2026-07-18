import { NextResponse } from 'next/server';
import { getMonthAvailability } from '@/lib/availability';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const tour = searchParams.get('tour');
  const month = searchParams.get('month');

  if (!tour || !/^\d{4}-\d{2}$/.test(month || '')) {
    return NextResponse.json({ error: 'tour and month (YYYY-MM) are required' }, { status: 400 });
  }

  try {
    const result = await getMonthAvailability(tour, month);
    if (!result) return NextResponse.json({ error: 'Unknown tour' }, { status: 404 });
    return NextResponse.json({
      month,
      callToBookPhone: result.tour.call_to_book_phone,
      days: result.days,
    });
  } catch (err) {
    console.error('[availability]', err);
    return NextResponse.json({ error: 'Unable to load availability' }, { status: 500 });
  }
}
