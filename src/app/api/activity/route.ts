import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const schema = z.object({
  category: z.string().min(1).max(100),
  notes: z.string().max(2000).nullable().optional(),
  at: z.string().transform((s) => new Date(s)),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cookieStore = await cookies();
  const attendee = cookieStore.get('attendee')?.value;
  if (!attendee) return NextResponse.json({ error: 'Attendee login required' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const createdIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  const rec = await prisma.activity.create({
    data: {
      deviceId: session.deviceId,
      category: parsed.data.category,
      createdAt: parsed.data.at,
      createdIp: createdIp || null,
      userAgent: userAgent || null,
    },
  });
  return NextResponse.json({ id: rec.id, createdAt: rec.createdAt });
}
