import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const patchSchema = z.object({
  fullName: z.string().min(1).optional(),
  birthYear: z.number().int().min(1900).max(3000).nullable().optional(),
  zipCode: z.string().regex(/^\d{5}$/).optional(),
  veteranStatus: z.enum(['YES','NO','REFUSED']).optional(),
  sexualOrientation: z.enum(['HETEROSEXUAL','GAY_LESBIAN','BISEXUAL','OTHER','REFUSED']).optional(),
  sexualOther: z.string().nullable().optional(),
  gender: z.enum(['FEMALE','MALE','TRANSGENDER','NON_BINARY','OTHER','REFUSED']).optional(),
  genderOther: z.string().nullable().optional(),
  race: z.enum(['WHITE','BLACK_AFRICAN_AMERICAN','ASIAN','AMERICAN_INDIAN_ALASKA_NATIVE','NATIVE_HAWAIIAN_PACIFIC_ISLANDER','OTHER','REFUSED']).optional(),
  raceOther: z.string().nullable().optional(),
  ethnicity: z.enum(['HISPANIC_LATINO','NOT_HISPANIC_LATINO','REFUSED']).optional(),
  county: z.enum(['SUMMIT','STARK','PORTAGE','CUYAHOGA','OTHER_OH_COUNTY','OUT_OF_STATE','REFUSED']).optional(),
  countyOther: z.string().nullable().optional(),
}).strict();

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  // Normalize coercions
  if (typeof body.birthYear === 'string' && body.birthYear !== '') body.birthYear = Number(body.birthYear);
  if (body.birthYear === '') body.birthYear = null;

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const data: z.infer<typeof patchSchema> = { ...parsed.data };
  // Enforce companion nullings
  if ('sexualOrientation' in data && data.sexualOrientation !== 'OTHER') data.sexualOther = null;
  if ('gender' in data && data.gender !== 'OTHER') data.genderOther = null;
  if ('race' in data && data.race !== 'OTHER') data.raceOther = null;
  if ('county' in data && data.county !== 'OTHER_OH_COUNTY') data.countyOther = null;

  try {
    await prisma.registration.update({ where: { id }, data });
  } catch (e) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
