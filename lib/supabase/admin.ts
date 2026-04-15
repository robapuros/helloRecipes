import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client using the service role key.
 * Use ONLY in server-side code that can't use cookies (e.g. generateStaticParams, import scripts).
 * Never expose this in client-side code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
    },
  )
}
