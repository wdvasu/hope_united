import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const c = await cookies()
  const attendee = c.get('attendee')?.value || null
  return NextResponse.json({ attendee })
}
