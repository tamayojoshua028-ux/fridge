import type { SupabaseClient } from '@supabase/supabase-js'

import { logActivity } from './activity.service'
import { getHouseholdContext } from '../utils/context'
import { initialsFromName } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const mapMember = (row: Record<string, any>) => ({
  id: row.id,
  userId: row.user_id,
  householdId: row.household_id,
  name: row.display_name,
  email: row.invited_email ?? row.users?.email ?? '',
  role: row.role,
  avatar: initialsFromName(row.display_name),
  status: row.status,
})

export const getProfile = async (supabase: SupabaseClient, userId: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const [profileResult, membersResult] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase
      .from('household_members')
      .select('id, user_id, household_id, invited_email, display_name, role, status, users(email)')
      .eq('household_id', context.householdId)
      .order('created_at', { ascending: true }),
  ])

  if (profileResult.error) throw new HttpError(500, profileResult.error.message)
  if (membersResult.error) throw new HttpError(500, membersResult.error.message)

  const user = profileResult.data
  return {
    id: user.id,
    householdId: context.householdId,
    name: user.full_name,
    email: user.email,
    phone: user.phone,
    plan: user.plan,
    avatarInitials: user.avatar_initials,
    household: (membersResult.data ?? []).map(mapMember),
    joinedAt: user.created_at,
    emailVerified: Boolean(user.email_verified),
  }
}

export const updateProfile = async (
  supabase: SupabaseClient,
  userId: string,
  payload: {
    name: string
    email: string
    phone?: string | null
  },
) => {
  const { data, error } = await supabase
    .from('users')
    .update({
      full_name: payload.name,
      email: payload.email,
      phone: payload.phone ?? null,
      avatar_initials: initialsFromName(payload.name),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select('*')
    .single()

  if (error) throw new HttpError(500, error.message)
  return getProfile(supabase, data.id)
}

export const inviteMember = async (
  supabase: SupabaseClient,
  userId: string,
  payload: {
    name: string
    email: string
    role: 'admin' | 'member'
  },
) => {
  const context = await getHouseholdContext(supabase, userId)
  if (context.role !== 'admin') {
    throw new HttpError(403, 'Only household admins can invite members.')
  }

  const { data, error } = await supabase
    .from('household_members')
    .insert({
      household_id: context.householdId,
      invited_email: payload.email,
      display_name: payload.name,
      role: payload.role,
      status: 'invited',
    })
    .select('id, user_id, household_id, invited_email, display_name, role, status')
    .single()

  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Invited ${payload.name} to the household`,
    icon: '👥',
    entityType: 'household_member',
    entityId: data.id,
  })

  return mapMember(data)
}

export const removeMember = async (supabase: SupabaseClient, userId: string, memberId: string) => {
  const context = await getHouseholdContext(supabase, userId)
  if (context.role !== 'admin') {
    throw new HttpError(403, 'Only household admins can remove members.')
  }

  const current = await supabase
    .from('household_members')
    .select('id, display_name')
    .eq('id', memberId)
    .single()

  if (current.error) throw new HttpError(500, current.error.message)

  const { error } = await supabase.from('household_members').delete().eq('id', memberId)
  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Removed ${current.data.display_name} from the household`,
    icon: '👥',
    entityType: 'household_member',
    entityId: current.data.id,
  })

  return { id: memberId }
}
