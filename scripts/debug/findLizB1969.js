/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const list = await prisma.registration.findMany({
      where: { birthYear: 1969 },
      select: { id: true, fullName: true, firstName: true, lastInitial: true, birthYear: true },
      orderBy: { createdAt: 'asc' },
    });
    const norm = (s) => (s || '').trim().toLowerCase();
    const matches = list.filter((r) => {
      const parts = (r.fullName || '').trim().split(/\s+/);
      const fn = norm(parts[0] || '');
      const last = parts.length ? parts[parts.length - 1] : '';
      const li = norm((last ? last[0] : ''));
      return fn === 'liz' && li === 'b';
    });
    console.log('Total candidates with year=1969:', list.length);
    console.table(list.map(r => ({ id: r.id, fullName: r.fullName, firstName: r.firstName, lastInitial: r.lastInitial })));
    console.log('Matches (liz/b/1969):', matches.length);
    console.table(matches.map(r => ({ id: r.id, fullName: r.fullName, firstName: r.firstName, lastInitial: r.lastInitial })));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
