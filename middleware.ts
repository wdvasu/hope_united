import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  if (url.pathname === '/activity' && url.searchParams.get('reset') === '1') {
    // Clear attendee cookie BEFORE rendering the page, then redirect to clean URL
    const redirectUrl = new URL('/activity', req.url)
    const res = NextResponse.redirect(redirectUrl)
    try {
      res.cookies.set('attendee', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 })
    } catch {}
    return res
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/activity'],
}
