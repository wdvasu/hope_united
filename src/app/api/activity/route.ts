import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const baseSchema = z.object({
  notes: z.string().max(2000).nullable().optional(),
  at: z.string().transform((s) => new Date(s)),
});

const singleSchema = baseSchema.extend({
  category: z.string().min(1).max(100),
});

const multiSchema = baseSchema.extend({
  categories: z.array(z.string().min(1).max(100)).min(1),
});

const schema = z.union([singleSchema, multiSchema]);

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

  const categories = 'categories' in parsed.data
    ? parsed.data.categories
    : [parsed.data.category];

  // Use createMany for efficiency; does not return records.
  const data = categories.map((c) => ({
    deviceId: session.deviceId,
    category: c,
    createdAt: parsed.data.at,
    createdIp: createdIp || null,
    userAgent: userAgent || null,
  }));
  const result = await prisma.activity.createMany({ data });
  return NextResponse.json({ ok: true, count: result.count });
}
