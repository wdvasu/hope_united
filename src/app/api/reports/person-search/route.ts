import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const querySchema = z.object({
  query: z.string().min(1).max(100),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  
  const query = parsed.data.query.trim();
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const results = await prisma.registration.findMany({
    where: {
      fullName: {
        contains: query,
        mode: 'insensitive',
      },
    },
    select: {
      id: true,
      fullName: true,
    },
    orderBy: {
      fullName: 'asc',
    },
    take: 10,
  });

  return NextResponse.json({ results });
}
