import { NextResponse } from 'next/server';

// Redirect old language-prefixed URLs to root
const LANGUAGE_PREFIXES = ['en', 'fr', 'es'];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check if path starts with a language prefix
  for (const lang of LANGUAGE_PREFIXES) {
    if (pathname.startsWith(`/${lang}/`) || pathname === `/${lang}`) {
      // Remove the language prefix and redirect
      const newPath = pathname.replace(`/${lang}`, '') || '/';
      const url = request.nextUrl.clone();
      url.pathname = newPath;
      return NextResponse.redirect(url, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/(en|fr|es)/:path*',
    '/(en|fr|es)',
  ],
};
