import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function derive(fullName) {
  if (!fullName) return { firstName: null, lastInitial: null }
  const parts = String(fullName).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: null, lastInitial: null }
  const firstName = parts[0]
  const last = parts[parts.length - 1]
  const lastInitial = last?.[0] || null
  return { firstName, lastInitial }
}

async function main() {
  const regs = await prisma.registration.findMany({
    where: {
      OR: [
        { firstName: null },
        { lastInitial: null },
        { firstName: '' },
        { lastInitial: '' },
      ],
    },
    select: { id: true, fullName: true, firstName: true, lastInitial: true },
  })
  let updated = 0
  for (const r of regs) {
    const { firstName, lastInitial } = derive(r.fullName)
    if (!firstName || !lastInitial) continue
    await prisma.registration.update({
      where: { id: r.id },
      data: { firstName, lastInitial },
    })
    updated++
  }
  console.log(`Backfill complete. Updated: ${updated} of ${regs.length}`)
}

main().catch((e)=>{console.error(e); process.exitCode=1}).finally(async()=>{await prisma.$disconnect()})
