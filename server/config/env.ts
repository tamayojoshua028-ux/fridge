import 'dotenv/config'

import { z } from 'zod'

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().url().or(z.literal('')).default(process.env.VITE_SUPABASE_URL ?? ''),
  SUPABASE_ANON_KEY: z.string().min(1).or(z.literal('')).default(process.env.VITE_SUPABASE_ANON_KEY ?? ''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

const parsed = envSchema.parse({
  API_PORT: process.env.API_PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
})

if (!parsed.SUPABASE_URL || !parsed.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables.')
}

export const serverEnv = parsed
