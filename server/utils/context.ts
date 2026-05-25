import type { SupabaseClient } from '@supabase/supabase-js'

import { HttpError } from './app-error'

export interface HouseholdContext {
  householdId: string
  role: 'admin' | 'member'
  actorName: string
}

export const getHouseholdContext = async (supabase: SupabaseClient, userId: string): Promise<HouseholdContext> => {
  const [memberResult, userResult] = await Promise.all([
    supabase
      .from('household_members')
      .select('household_id, role, display_name')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase.from('users').select('full_name').eq('id', userId).single(),
  ])

  if (memberResult.error || !memberResult.data) {
    throw new HttpError(403, 'No active household membership was found for this user.')
  }

  if (userResult.error || !userResult.data) {
    throw new HttpError(404, 'Profile record not found.')
  }

  return {
    householdId: memberResult.data.household_id,
    role: memberResult.data.role,
    actorName: userResult.data.full_name ?? memberResult.data.display_name,
  }
}
