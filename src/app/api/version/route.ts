import { NextResponse } from 'next/server'
import { execSync } from 'node:child_process'

function safe(cmd: string) {
  try { return execSync(cmd, { stdio: ['ignore','pipe','ignore'] }).toString().trim() } catch { return '' }
}

export async function GET() {
  const commit = safe('git rev-parse --short HEAD')
  const branch = safe('git rev-parse --abbrev-ref HEAD')
  const time = new Date().toISOString()
  return NextResponse.json({ commit, branch, time })
}
