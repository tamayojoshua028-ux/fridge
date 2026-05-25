import { createClient } from '@supabase/supabase-js'

import { serverEnv } from '../config/env'

export const authSupabase = createClient(serverEnv.SUPABASE_URL, serverEnv.SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

const dataAccessKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY ?? serverEnv.SUPABASE_ANON_KEY

export const createUserScopedClient = (_accessToken: string) =>
  createClient(serverEnv.SUPABASE_URL, dataAccessKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
