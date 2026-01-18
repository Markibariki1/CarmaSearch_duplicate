import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/utils/supabase/server';

export async function POST(request: Request) {
  const referer = request.headers.get('referer') || '/';
  
  const form = await request.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Redirect back to the referring page (where the modal was opened)
  return NextResponse.redirect(new URL(referer));
}
