import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type'); // 'email' typically

  const redirectTo = new URL('/', url);

  if (token_hash && type) {
    const supabase = await createServerSupabase();
    // verifyOtp to exchange token_hash for session
    // @ts-ignore
    const { error } = await supabase.auth.verifyOtp({ type: type as any, token_hash });
    if (!error) {
      return NextResponse.redirect(redirectTo);
    }
  }

  redirectTo.pathname = '/error';
  return NextResponse.redirect(redirectTo);
}
