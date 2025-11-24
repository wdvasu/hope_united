import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const schema = z.object({
  category: z.string().min(1).max(100),
  notes: z.string().max(2000).nullable().optional(),
  at: z.string().transform((s) => new Date(s)),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Placeholder: accept and acknowledge. Storage can be added later.
  return NextResponse.json({ ok: true });
}
