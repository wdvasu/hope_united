import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUID } from '@/lib/uid';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
// Define local enum string unions to avoid relying on @prisma/client enum exports,
// which can vary across environments/versions.
type VeteranStatus = 'YES' | 'NO' | 'REFUSED';
type SexualOrientation = 'HETEROSEXUAL' | 'GAY_LESBIAN' | 'BISEXUAL' | 'OTHER' | 'REFUSED';
type Gender = 'FEMALE' | 'MALE' | 'TRANSGENDER' | 'NON_BINARY' | 'OTHER' | 'REFUSED';
type Race = 'WHITE' | 'BLACK_AFRICAN_AMERICAN' | 'ASIAN' | 'AMERICAN_INDIAN_ALASKA_NATIVE' | 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER' | 'OTHER' | 'REFUSED';
type Ethnicity = 'HISPANIC_LATINO' | 'NOT_HISPANIC_LATINO' | 'REFUSED';
type County = 'SUMMIT' | 'STARK' | 'PORTAGE' | 'CUYAHOGA' | 'OTHER_OH_COUNTY' | 'OUT_OF_STATE' | 'REFUSED';

const schema = z.object({
  fullName: z.string().min(1),
  firstName: z.string().min(1).optional().nullable(),
  lastInitial: z.string().min(1).max(1).optional().nullable(),
  birthYear: z
    .string()
    .regex(/^\d{4}$/)
    .transform((s) => parseInt(s, 10)),
  zipCode: z.string().regex(/^\d{5}$/),
  veteranStatus: z.enum(['YES', 'NO', 'REFUSED']),
  sexualOrientation: z.enum(['HETEROSEXUAL', 'GAY_LESBIAN', 'BISEXUAL', 'OTHER', 'REFUSED']),
  sexualOther: z.string().optional().nullable(),
  gender: z.enum(['FEMALE', 'MALE', 'TRANSGENDER', 'NON_BINARY', 'OTHER', 'REFUSED']),
  genderOther: z.string().optional().nullable(),
  race: z.enum(['WHITE', 'BLACK_AFRICAN_AMERICAN', 'ASIAN', 'AMERICAN_INDIAN_ALASKA_NATIVE', 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER', 'OTHER', 'REFUSED']),
  raceOther: z.string().optional().nullable(),
  ethnicity: z.enum(['HISPANIC_LATINO', 'NOT_HISPANIC_LATINO', 'REFUSED']),
  county: z.enum(['SUMMIT', 'STARK', 'PORTAGE', 'CUYAHOGA', 'OTHER_OH_COUNTY', 'OUT_OF_STATE', 'REFUSED']),
  countyOther: z.string().optional().nullable(),
  waiverAgreed: z.literal(true),
  eSignatureImage: z.string().min(1),
  eSignatureAt: z.string().transform((s) => new Date(s)),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const uid = generateUID();
  const createdIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || undefined;
  const userAgent = req.headers.get('user-agent') || undefined;

  // Derive firstName and lastInitial from fullName if not supplied
  let firstName: string | null | undefined = parsed.data.firstName ?? null;
  let lastInitial: string | null | undefined = parsed.data.lastInitial ?? null;
  if (!firstName || !lastInitial) {
    const parts = parsed.data.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      firstName = firstName || parts[0];
      const last = parts[parts.length - 1];
      lastInitial = lastInitial || (last ? last[0] : undefined);
    }
  }

  const r = await prisma.registration.create({
    data: {
      uid,
      deviceId: session.deviceId,
      fullName: parsed.data.fullName,
      firstName: firstName ? firstName.trim() : null,
      lastInitial: lastInitial ? lastInitial.trim().slice(0, 1) : null,
      birthYear: parsed.data.birthYear ?? null,
      zipCode: parsed.data.zipCode,
      veteranStatus: parsed.data.veteranStatus as VeteranStatus,
      sexualOrientation: parsed.data.sexualOrientation as SexualOrientation,
      sexualOther: parsed.data.sexualOther || null,
      gender: parsed.data.gender as Gender,
      genderOther: parsed.data.genderOther || null,
      race: parsed.data.race as Race,
      raceOther: parsed.data.raceOther || null,
      ethnicity: parsed.data.ethnicity as Ethnicity,
      county: parsed.data.county as County,
      countyOther: parsed.data.countyOther || null,
      waiverAgreed: true,
      eSignatureName: null,
      eSignatureImage: sanitizeImage(parsed.data.eSignatureImage),
      eSignatureAt: parsed.data.eSignatureAt,
      createdIp: createdIp || null,
      userAgent: userAgent || null,
    },
  });

  return NextResponse.json({ uid, id: r.id });
}

function sanitizeImage(s: string): string {
  // Accept both raw base64 or data URL and normalize to base64 without prefix
  const prefix = 'base64,';
  const idx = s.indexOf(prefix);
  if (idx >= 0) return s.slice(idx + prefix.length);
  return s;
}
