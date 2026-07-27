import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  registrationId: z.string().uuid(),
  oldDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { registrationId, oldDate, newDate } = parsed.data;

    // Calculate the date range for the old date (entire day UTC)
    const oldStart = new Date(oldDate + 'T00:00:00.000Z');
    const oldEnd = new Date(oldDate + 'T23:59:59.999Z');

    // Find all activities for this person on the old date
    const activities = await prisma.activity.findMany({
      where: {
        registrationId,
        createdAt: { gte: oldStart, lte: oldEnd },
      },
      select: { id: true, createdAt: true },
    });

    if (activities.length === 0) {
      return NextResponse.json({ error: 'No activities found for this date' }, { status: 404 });
    }

    // Calculate time offset to preserve time-of-day
    const newDateObj = new Date(newDate + 'T00:00:00.000Z');
    const oldDateObj = new Date(oldDate + 'T00:00:00.000Z');
    const daysDiff = Math.floor((newDateObj.getTime() - oldDateObj.getTime()) / (1000 * 60 * 60 * 24));

    // Update each activity, preserving the time-of-day
    const updates = activities.map(activity => {
      const newCreatedAt = new Date(activity.createdAt);
      newCreatedAt.setDate(newCreatedAt.getDate() + daysDiff);
      
      return prisma.activity.update({
        where: { id: activity.id },
        data: { createdAt: newCreatedAt },
      });
    });

    await prisma.$transaction(updates);

    return NextResponse.json({ ok: true, updated: activities.length });
  } catch (e: unknown) {
    console.error('Bulk update activities failed:', e);
    const msg = (e as Error)?.message || 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
