import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const registrationId = url.searchParams.get('registrationId');
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');

    if (!registrationId || !start || !end) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const startDate = new Date(start + 'T00:00:00.000Z');
    const endDate = new Date(end + 'T23:59:59.999Z');

    // Fetch all activities for this person in the date range
    const activities = await prisma.activity.findMany({
      where: {
        registrationId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        category: true,
        createdAt: true,
        attendeeCount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const byDay = new Map<string, Array<{ id: string; category: string; createdAt: string; attendeeCount: number }>>();
    
    for (const activity of activities) {
      const dayKey = activity.createdAt.toISOString().slice(0, 10);
      if (!byDay.has(dayKey)) {
        byDay.set(dayKey, []);
      }
      byDay.get(dayKey)!.push({
        id: activity.id,
        category: activity.category,
        createdAt: activity.createdAt.toISOString(),
        attendeeCount: activity.attendeeCount,
      });
    }

    // Convert to array format
    const result = Array.from(byDay.entries()).map(([day, activities]) => ({
      day,
      activities,
      count: activities.length,
    }));

    return NextResponse.json({ days: result });
  } catch (e: unknown) {
    console.error('Fetch person activities failed:', e);
    const msg = (e as Error)?.message || 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
