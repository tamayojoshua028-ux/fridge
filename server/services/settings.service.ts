import type { SupabaseClient } from '@supabase/supabase-js'

import { HttpError } from '../utils/app-error'

const defaultSettings = {
  notifications: {
    expiry: true,
    lowStock: true,
    recipes: false,
    weekly: true,
  },
  appearance: {
    darkMode: false,
  },
  privacy: {
    biometric: true,
    analytics: true,
  },
  preferences: {
    language: 'English (US)',
    units: 'metric',
    dateFormat: 'MM/DD/YYYY',
  },
}

export const getSettings = async (supabase: SupabaseClient, userId: string) => {
  const existing = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle()
  if (existing.error) throw new HttpError(500, existing.error.message)

  if (existing.data) {
    return {
      notifications: existing.data.notifications,
      appearance: existing.data.appearance,
      privacy: existing.data.privacy,
      preferences: existing.data.preferences,
    }
  }

  const created = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      notifications: defaultSettings.notifications,
      appearance: defaultSettings.appearance,
      privacy: defaultSettings.privacy,
      preferences: defaultSettings.preferences,
    })
    .select('*')
    .single()

  if (created.error) throw new HttpError(500, created.error.message)

  return {
    notifications: created.data.notifications,
    appearance: created.data.appearance,
    privacy: created.data.privacy,
    preferences: created.data.preferences,
  }
}

export const updateSettings = async (supabase: SupabaseClient, userId: string, payload: Record<string, unknown>) => {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(
      {
        user_id: userId,
        notifications: payload.notifications,
        appearance: payload.appearance,
        privacy: payload.privacy,
        preferences: payload.preferences,
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()

  if (error) throw new HttpError(500, error.message)
  return {
    notifications: data.notifications,
    appearance: data.appearance,
    privacy: data.privacy,
    preferences: data.preferences,
  }
}
