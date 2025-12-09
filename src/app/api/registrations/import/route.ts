import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateUID } from '@/lib/uid';
import * as XLSX from 'xlsx';
import type { Prisma, VeteranStatus, SexualOrientation, Gender, Race, Ethnicity, County } from '@prisma/client';

type Row = Record<string, unknown>;

function pick(obj: Row, keys: string[]): string | undefined {
  const lower: Record<string, unknown> = {};
  for (const k of Object.keys(obj)) lower[k.trim().toLowerCase()] = obj[k];
  for (const k of keys) {
    const v = lower[k.toLowerCase()];
    if (v != null && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

function toYear(input?: string): number | null {
  if (!input) return null;
  const s = input.trim();
  const m4 = s.match(/(^|[^\d])(19|20)\d{2}([^\d]|$)/);
  if (m4) {
    const year = Number(m4[0].replace(/[^\d]/g, ''));
    if (year >= 1900 && year <= 3000) return year;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.getFullYear();
  return null;
}

function toDate(input?: string): Date | null {
  if (!input) return null;
  const d = new Date(input);
  if (!isNaN(d.getTime())) return d;
  return null;
}

function normalize(v?: string): string {
  return (v || '').toString().trim().toLowerCase();
}

function mapVeteran(v?: string): 'YES' | 'NO' | 'REFUSED' {
  const s = normalize(v);
  if (!s) return 'REFUSED';
  if (/(^|\b)(yes|veteran|vet)(\b|$)/i.test(v!)) return 'YES';
  if (/(^|\b)(no|not a veteran|non\-vet|nonvet)(\b|$)/i.test(v!)) return 'NO';
  return 'REFUSED';
}

function mapByTable(v: string | undefined, table: Record<string, string>, fallback: string): string {
  const s = normalize(v);
  const key = s.replace(/[^a-z0-9]+/g, '_');
  return (table[key] as string | undefined) || fallback;
}

const sexualTable: Record<string,string> = {
  heterosexual: 'HETEROSEXUAL',
  gay_lesbian: 'GAY_LESBIAN',
  bisexual: 'BISEXUAL',
  other: 'OTHER',
  refused: 'REFUSED',
};
const genderTable: Record<string,string> = {
  female: 'FEMALE',
  male: 'MALE',
  transgender: 'TRANSGENDER',
  non_binary: 'NON_BINARY',
  nonbinary: 'NON_BINARY',
  other: 'OTHER',
  refused: 'REFUSED',
};
const raceTable: Record<string,string> = {
  white: 'WHITE',
  black_african_american: 'BLACK_AFRICAN_AMERICAN',
  african_american: 'BLACK_AFRICAN_AMERICAN',
  black: 'BLACK_AFRICAN_AMERICAN',
  asian: 'ASIAN',
  american_indian_alaska_native: 'AMERICAN_INDIAN_ALASKA_NATIVE',
  american_indian_or_alaska_native: 'AMERICAN_INDIAN_ALASKA_NATIVE',
  native_hawaiian_pacific_islander: 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER',
  native_hawaiian_or_pacific_islander: 'NATIVE_HAWAIIAN_PACIFIC_ISLANDER',
  other: 'OTHER',
  refused: 'REFUSED',
};
const ethnicityTable: Record<string,string> = {
  hispanic_latino: 'HISPANIC_LATINO',
  hispanic_or_latino: 'HISPANIC_LATINO',
  not_hispanic_latino: 'NOT_HISPANIC_LATINO',
  not_hispanic_or_latino: 'NOT_HISPANIC_LATINO',
  refused: 'REFUSED',
};
const countyTable: Record<string,string> = {
  summit: 'SUMMIT',
  stark: 'STARK',
  portage: 'PORTAGE',
  cuyahoga: 'CUYAHOGA',
  other_oh_county: 'OTHER_OH_COUNTY',
  other: 'OTHER_OH_COUNTY',
  out_of_state: 'OUT_OF_STATE',
  refused: 'REFUSED',
};

export async function POST(req: Request) {
  const session = await getSession();
  // Choose a device to attribute to
  let deviceId = session?.deviceId as string | undefined;
  if (!deviceId) {
    const label = 'Admin Demo Kiosk';
    let device = await prisma.device.findFirst({ where: { label } });
    if (!device) {
      device = await prisma.device.create({ data: { label, secretHash: 'DEMO', active: true } });
    }
    deviceId = device.id;
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'file required' }, { status: 400 });
  const ab = await file.arrayBuffer();
  const buf = Buffer.from(ab);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: Row[] = XLSX.utils.sheet_to_json(ws, { defval: '', raw: false });

  const max = 5000;
  const rows = raw.slice(0, max);

  const results = { total: rows.length, inserted: 0, skipped: 0 };
  const data: Prisma.RegistrationCreateManyInput[] = [];

  for (const r of rows) {
    const fullName = pick(r, ['full name','fullname','name']);
    const zip = pick(r, ['zip','zip code','zipcode']);
    if (!fullName || !zip || !/^\d{5}$/.test(zip)) { results.skipped++; continue; }

    const birth = pick(r, ['date of birth','birthdate','dob','birth date','birthyear','birth year']);
    const birthYear = toYear(birth);
    const veteran = pick(r, ['veteran status','veteran','vet']);
    const sexual = pick(r, ['orientation/identity','sexual orientation','orientation']);
    const gender = pick(r, ['gender']);
    const race = pick(r, ['race']);
    const ethnicity = pick(r, ['ethnicity']);
    const county = pick(r, ['county']);
    const created = pick(r, ['created','created at','created date','timestamp','date']);

    const createdAt = toDate(created) || new Date();

    const sexualEnum = mapByTable(sexual, sexualTable, 'REFUSED') as SexualOrientation;
    const genderEnum = mapByTable(gender, genderTable, 'REFUSED') as Gender;
    const raceEnum = mapByTable(race, raceTable, 'REFUSED') as Race;
    const ethnicityEnum = mapByTable(ethnicity, ethnicityTable, 'REFUSED') as Ethnicity;
    const countyEnum = mapByTable(county, countyTable, 'REFUSED') as County;

    data.push({
      uid: generateUID(),
      deviceId,
      fullName,
      firstName: null,
      lastInitial: null,
      birthYear,
      zipCode: zip,
      veteranStatus: mapVeteran(veteran) as VeteranStatus,
      sexualOrientation: sexualEnum,
      sexualOther: null,
      gender: genderEnum,
      genderOther: null,
      race: raceEnum,
      raceOther: null,
      ethnicity: ethnicityEnum,
      county: countyEnum,
      countyOther: null,
      waiverAgreed: true,
      eSignatureName: null,
      eSignatureImage: null,
      eSignatureAt: createdAt,
      createdAt,
      createdIp: null,
      userAgent: null,
    });
  }

  if (data.length) {
    const chunkSize = 500;
    for (let i=0; i<data.length; i+=chunkSize) {
      const chunk = data.slice(i, i+chunkSize);
      const res = await prisma.registration.createMany({ data: chunk });
      results.inserted += res.count;
    }
  }
  results.skipped += (rows.length - (results.inserted));
  return NextResponse.json(results);
}
