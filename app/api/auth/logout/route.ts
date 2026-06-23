import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Clears the Supabase cookie session.
 */
export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
