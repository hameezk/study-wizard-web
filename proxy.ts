/**
 * Next 16 renamed `middleware` to `proxy`; the named export must be `proxy`
 * too. The runtime is Node.js and is not configurable, which suits us — the
 * Supabase SSR client needs it.
 *
 * Its one job is refreshing the auth session cookie on every request, so a
 * server component never renders against an expired token. Route protection
 * lives here as a convenience; the real boundary is the database's RLS plus
 * the backend's own authorization.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_PREFIXES = ['/checkout'];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const cookieDomain = process.env.SESSION_COOKIE_DOMAIN ?? '';
  const domainOpts =
    cookieDomain && !cookieDomain.includes('localhost') ? { domain: cookieDomain } : {};

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, {
              ...options,
              ...domainOpts,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            });
          }
        },
      },
    },
  );

  // getUser() revalidates against Supabase. getSession() only decodes the
  // cookie, so it will happily report a user whose account was deleted.
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  const path = request.nextUrl.pathname;

  if (!user && PROTECTED_PREFIXES.some((p) => path.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = '/signup';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  // Email verification is enforced DOWNSTREAM rather than by blocking signup:
  // Supabase creates the auth row immediately with email_confirmed_at null, so
  // "must verify before the account exists" means no checkout and no dashboard
  // until confirmed. OAuth users arrive pre-confirmed and pass straight through.
  if (user && !user.email_confirmed_at && path.startsWith('/checkout')) {
    const url = request.nextUrl.clone();
    url.pathname = '/verify';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)'],
};
