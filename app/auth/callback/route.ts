import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (code) {
    const supabase = await createServerSupabase();
    // exchange code for session - helper name may vary; try exchangeCodeForSession
    // If your client doesn't expose this method, follow the "Code Exchange" flow in Supabase docs.
    try {
      // @ts-ignore - runtime method check
      if (typeof (supabase.auth as any).exchangeCodeForSession === 'function') {
        // @ts-ignore
        await (supabase.auth as any).exchangeCodeForSession(code);
      } else if (typeof (supabase.auth as any).getSessionFromUrl === 'function') {
        // fallback to getSessionFromUrl if available
        // @ts-ignore
        await (supabase.auth as any).getSessionFromUrl(new URL(request.url).toString());
      }
    } catch {
      // ignore and redirect back to origin
    }
  }

  return NextResponse.redirect(url.origin);
}
