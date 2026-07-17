import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const activitySchema = z.object({
  category: z.string().min(1).max(100),
  attendeeCount: z.number().int().min(1),
  createdAt: z.coerce.date(),
  registrationId: z.null(),
});

const schema = z.object({
  activities: z.array(activitySchema).min(1),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const recent = url.searchParams.get('recent');

    if (recent === 'true') {
      // Get recent group activities (where registrationId is null)
      const activities = await prisma.activity.findMany({
        where: { registrationId: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          category: true,
          attendeeCount: true,
          createdAt: true,
        },
      });

      return NextResponse.json({ activities });
    }

    return NextResponse.json({ activities: [] });
  } catch (e: unknown) {
    console.error('Group activity fetch failed:', e);
    const msg = (e as Error)?.message || 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const createdIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const data = parsed.data.activities.map((act) => ({
      deviceId: session.deviceId,
      category: act.category,
      attendeeCount: act.attendeeCount,
      createdAt: act.createdAt,
      createdIp: createdIp || null,
      userAgent: userAgent || null,
      registrationId: null, // Explicitly null for anonymous group events
    }));

    const result = await prisma.activity.createMany({ data });
    return NextResponse.json({ ok: true, count: result.count });
  } catch (e: unknown) {
    console.error('Group activity save failed:', e);
    const msg = (e as Error)?.message || 'Internal Server Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
