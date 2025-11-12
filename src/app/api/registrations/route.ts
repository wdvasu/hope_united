import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateUID } from '@/lib/uid';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { VeteranStatus, SexualOrientation, Gender, Race, Ethnicity, County } from '@prisma/client';

const Drug = z.enum([
  'ALCOHOL',
  'OPIOIDS_HEROIN',
  'COCAINE_CRACK',
  'METHAMPHETAMINE',
  'MARIJUANA',
  'OTHER',
  'REFUSED',
]);

const schema = z.object({
  fullName: z.string().min(1),
  zipCode: z.string().regex(/^\d{5}$/),
  veteranStatus: z.enum(['YES', 'NO', 'REFUSED']),
  drugs: z.array(Drug).nonempty(),
  drugOther: z.string().optional().nullable(),
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
  eSignatureName: z.string().min(1),
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

  const r = await prisma.registration.create({
    data: {
      uid,
      deviceId: session.deviceId,
      fullName: parsed.data.fullName,
      zipCode: parsed.data.zipCode,
      veteranStatus: parsed.data.veteranStatus as VeteranStatus,
      drugs: parsed.data.drugs,
      drugOther: parsed.data.drugOther || null,
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
      eSignatureName: parsed.data.eSignatureName,
      eSignatureAt: parsed.data.eSignatureAt,
      createdIp: createdIp || null,
      userAgent: userAgent || null,
    },
  });

  return NextResponse.json({ uid, id: r.id });
}
