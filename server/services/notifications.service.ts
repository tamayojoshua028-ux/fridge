import type { SupabaseClient } from '@supabase/supabase-js'

import { getFreshnessStatus, mapNotificationRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'
import { getHouseholdContext } from '../utils/context'

export const listNotifications = async (
  supabase: SupabaseClient,
  userId: string,
  filter: string,
) => {
  const { householdId } = await getHouseholdContext(supabase, userId)

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (filter !== 'all') {
    query = query.eq('type', filter)
  }

  const { data, error } = await query
  if (error) throw new HttpError(500, error.message)
  return (data ?? []).map(mapNotificationRow)
}

export const unreadCount = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('household_id', householdId)
    .is('read_at', null)

  if (error) throw new HttpError(500, error.message)
  return { unreadCount: count ?? 0 }
}

export const markNotificationRead = async (supabase: SupabaseClient, userId: string, id: string) => {
  await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) throw new HttpError(500, error.message)
  return mapNotificationRow(data)
}

export const markAllNotificationsRead = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const { error, count } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('household_id', householdId)
    .is('read_at', null)

  if (error) throw new HttpError(500, error.message)
  return { updated: count ?? 0 }
}

export const removeNotification = async (supabase: SupabaseClient, userId: string, id: string) => {
  await getHouseholdContext(supabase, userId)
  const { error } = await supabase.from('notifications').delete().eq('id', id)
  if (error) throw new HttpError(500, error.message)
  return { id }
}

export const createNotification = async (
  supabase: SupabaseClient,
  payload: {
    householdId: string
    type: 'expiry' | 'recipe' | 'grocery' | 'report' | 'stock' | 'system'
    title: string
    body: string
    entityType?: string
    entityId?: string
    userId?: string | null
    dedupeKey?: string | null
    metadata?: Record<string, unknown>
  },
) => {
  const styleMap = {
    expiry: { icon: '⚠️', color: '#FEF3C7' },
    recipe: { icon: '👨‍🍳', color: '#D1FAE5' },
    grocery: { icon: '🛒', color: '#EFF6FF' },
    report: { icon: '📊', color: '#EDE9FE' },
    stock: { icon: '📦', color: '#FEE2E2' },
    system: { icon: '✨', color: '#D1FAE5' },
  }

  const style = styleMap[payload.type]
  const notificationPayload = {
    household_id: payload.householdId,
    user_id: payload.userId ?? null,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    icon: style.icon,
    color: style.color,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
    dedupe_key: payload.dedupeKey ?? null,
  }

  if (payload.dedupeKey) {
    const existing = await supabase
      .from('notifications')
      .select('id')
      .eq('household_id', payload.householdId)
      .eq('dedupe_key', payload.dedupeKey)
      .maybeSingle()

    if (existing.error) throw new HttpError(500, existing.error.message)

    if (existing.data?.id) {
      const { error } = await supabase
        .from('notifications')
        .update({
          ...notificationPayload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.data.id)

      if (error) throw new HttpError(500, error.message)
      return
    }
  }

  const { error } = await supabase.from('notifications').insert(notificationPayload)
  if (error) throw new HttpError(500, error.message)
}

export const syncInventoryNotifications = async (
  supabase: SupabaseClient,
  payload: {
    householdId: string
    item: {
      id: string
      name: string
      qty: number
      lowStockThreshold?: number | null
      exp: string
    }
  },
) => {
  const status = getFreshnessStatus(payload.item.exp)

  if (status === 'expired') {
    await createNotification(supabase, {
      householdId: payload.householdId,
      type: 'expiry',
      title: `${payload.item.name} has expired`,
      body: `Your ${payload.item.name} has reached its expiration date. Review it or mark it as consumed.`,
      entityType: 'inventory_item',
      entityId: payload.item.id,
      dedupeKey: `inventory-expiry:${payload.item.id}:expired`,
    })
  } else if (status === 'expiring') {
    await createNotification(supabase, {
      householdId: payload.householdId,
      type: 'expiry',
      title: `${payload.item.name} expires soon`,
      body: `Your ${payload.item.name} is close to expiring. Plan to use it in the next couple of days.`,
      entityType: 'inventory_item',
      entityId: payload.item.id,
      dedupeKey: `inventory-expiry:${payload.item.id}:expiring`,
    })
  }

  if (payload.item.lowStockThreshold !== null && payload.item.lowStockThreshold !== undefined && payload.item.qty <= payload.item.lowStockThreshold) {
    await createNotification(supabase, {
      householdId: payload.householdId,
      type: 'stock',
      title: `Low stock: ${payload.item.name}`,
      body: `You are almost out of ${payload.item.name}. Consider adding it to the grocery list.`,
      entityType: 'inventory_item',
      entityId: payload.item.id,
      dedupeKey: `inventory-low-stock:${payload.item.id}`,
    })
  }
}
