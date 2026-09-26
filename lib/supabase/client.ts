/**
 * Browser Supabase client. Publishable key only, so every query it makes is
 * bound by RLS.
 */
'use client';

import { createBrowserClient } from '@supabase/ssr';
import { publicEnv } from '../env';

export function createSupabaseBrowserClient() {
  return createBrowserClient(publicEnv.supabaseUrl, publicEnv.supabaseKey);
}
