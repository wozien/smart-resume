import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

const publicPages = new Set(['/login', '/register', '/forgot-password', '/reset-password'])

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const session = getSessionCookie(request)
  if (publicPages.has(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    const login = new URL('/login', request.url)
    login.searchParams.set('from', pathname)
    return NextResponse.redirect(login)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
