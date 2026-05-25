import type { SupabaseClient } from '@supabase/supabase-js'

import { logActivity } from './activity.service'
import { syncInventoryNotifications } from './notifications.service'
import { getHouseholdContext } from '../utils/context'
import { getFreshnessStatus, mapInventoryRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const inventorySelect = `
  id,
  household_id,
  category_id,
  name,
  quantity,
  unit,
  storage_location,
  expiration_date,
  freshness_status,
  shelf_label,
  notes,
  image_path,
  is_favorite,
  low_stock_threshold,
  created_at,
  updated_at,
  inventory_categories(name, emoji)
`

const categoryEmojiMap: Record<string, string> = {
  Dairy: '🥛',
  Fruits: '🍎',
  Veggies: '🥬',
  Protein: '🍗',
  Grains: '🌾',
  Condiments: '🫙',
  Bakery: '🍞',
  Beverages: '🧃',
  Other: '📦',
}

const attachSignedImageUrls = async (supabase: SupabaseClient, rows: Record<string, any>[]) => {
  return Promise.all(
    rows.map(async (row) => {
      if (!row.image_path) return row
      const { data } = await supabase.storage.from('inventory-images').createSignedUrl(row.image_path, 60 * 60)
      return {
        ...row,
        image_url: data?.signedUrl ?? null,
      }
    }),
  )
}

const resolveCategoryId = async (supabase: SupabaseClient, householdId: string, categoryName: string) => {
  const existing = await supabase
    .from('inventory_categories')
    .select('id')
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .eq('name', categoryName)
    .limit(1)
    .maybeSingle()

  if (existing.data?.id) return existing.data.id

  const created = await supabase
    .from('inventory_categories')
    .insert({
      household_id: householdId,
      name: categoryName,
      emoji: categoryEmojiMap[categoryName] ?? '📦',
      color: null,
      is_system: false,
    })
    .select('id')
    .single()

  if (created.error) throw new HttpError(500, created.error.message)
  return created.data.id
}

const buildSummary = (rows: Record<string, any>[]) =>
  rows.reduce(
    (summary, row) => {
      const status = row.freshness_status ?? getFreshnessStatus(row.expiration_date)
      summary.total += 1
      summary[status] += 1
      return summary
    },
    {
      total: 0,
      fresh: 0,
      expiring: 0,
      expired: 0,
    },
  )

export const getInventoryCategories = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('*')
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .order('name')

  if (error) throw new HttpError(500, error.message)
  return data ?? []
}

export const listInventory = async (
  supabase: SupabaseClient,
  userId: string,
  query: {
    search: string
    status: string
    shelf: string
    sort: string
    page: number
    pageSize: number
  },
) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const start = (query.page - 1) * query.pageSize

  let baseQuery = supabase
    .from('inventory_items')
    .select(inventorySelect, { count: 'exact' })
    .eq('household_id', householdId)
    .is('consumed_at', null)

  if (query.search) {
    baseQuery = baseQuery.or(`name.ilike.%${query.search}%,notes.ilike.%${query.search}%`)
  }
  if (query.status !== 'all') {
    baseQuery = baseQuery.eq('freshness_status', query.status)
  }
  if (query.shelf !== 'all_shelf') {
    baseQuery = baseQuery.eq('storage_location', query.shelf)
  }

  if (query.sort === 'exp') {
    baseQuery = baseQuery.order('expiration_date', { ascending: true })
  } else if (query.sort === 'cat') {
    baseQuery = baseQuery.order('category_id', { ascending: true }).order('name', { ascending: true })
  } else {
    baseQuery = baseQuery.order('name', { ascending: true })
  }

  const [{ data, count, error }, summaryResult] = await Promise.all([
    baseQuery.range(start, start + query.pageSize - 1),
    supabase
      .from('inventory_items')
      .select('freshness_status, expiration_date', { count: 'exact' })
      .eq('household_id', householdId)
      .is('consumed_at', null),
  ])

  if (error) throw new HttpError(500, error.message)
  if (summaryResult.error) throw new HttpError(500, summaryResult.error.message)

  const rowsWithUrls = await attachSignedImageUrls(supabase, data ?? [])
  const items = rowsWithUrls.map(mapInventoryRow)
  const summary = buildSummary(summaryResult.data ?? [])

  return {
    items,
    total: count ?? 0,
    page: query.page,
    pageSize: query.pageSize,
    hasMore: start + (data?.length ?? 0) < (count ?? 0),
    summary,
  }
}

export const createInventory = async (supabase: SupabaseClient, userId: string, payload: Record<string, any>) => {
  const context = await getHouseholdContext(supabase, userId)
  const categoryId = await resolveCategoryId(supabase, context.householdId, payload.cat)
  const freshnessStatus = getFreshnessStatus(payload.exp)

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      household_id: context.householdId,
      category_id: categoryId,
      created_by: userId,
      updated_by: userId,
      name: payload.name,
      emoji: categoryEmojiMap[payload.cat] ?? '📦',
      quantity: payload.qty,
      unit: payload.unit,
      storage_location: payload.shelf,
      expiration_date: payload.exp,
      freshness_status: freshnessStatus,
      shelf_label: payload.loc,
      notes: payload.notes ?? null,
      image_path: payload.imagePath ?? null,
      is_favorite: false,
      low_stock_threshold: payload.lowStockThreshold ?? null,
    })
    .select(inventorySelect)
    .single()

  if (error) throw new HttpError(500, error.message)

  await Promise.all([
    logActivity(supabase, {
      householdId: context.householdId,
      actorUserId: userId,
      actorName: context.actorName,
      action: `Added ${payload.name} to inventory`,
      icon: '📦',
      entityType: 'inventory_item',
      entityId: data.id,
    }),
    syncInventoryNotifications(supabase, {
      householdId: context.householdId,
      item: {
        id: data.id,
        name: data.name,
        qty: Number(data.quantity),
        lowStockThreshold: data.low_stock_threshold,
        exp: data.expiration_date,
      },
    }),
  ])

  const withUrl = await attachSignedImageUrls(supabase, [data])
  return mapInventoryRow(withUrl[0])
}

export const updateInventory = async (
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: Record<string, any>,
) => {
  const context = await getHouseholdContext(supabase, userId)
  const categoryId = payload.cat ? await resolveCategoryId(supabase, context.householdId, payload.cat) : undefined

  const updates: Record<string, unknown> = {
    updated_by: userId,
    updated_at: new Date().toISOString(),
  }

  if (payload.name !== undefined) updates.name = payload.name
  if (payload.qty !== undefined) updates.quantity = payload.qty
  if (payload.unit !== undefined) updates.unit = payload.unit
  if (payload.shelf !== undefined) updates.storage_location = payload.shelf
  if (payload.loc !== undefined) updates.shelf_label = payload.loc
  if (payload.notes !== undefined) updates.notes = payload.notes
  if (payload.imagePath !== undefined) updates.image_path = payload.imagePath
  if (payload.lowStockThreshold !== undefined) updates.low_stock_threshold = payload.lowStockThreshold
  if (payload.exp !== undefined) {
    updates.expiration_date = payload.exp
    updates.freshness_status = getFreshnessStatus(payload.exp)
  }
  if (categoryId) {
    updates.category_id = categoryId
    updates.emoji = categoryEmojiMap[payload.cat] ?? '📦'
  }

  const { data, error } = await supabase
    .from('inventory_items')
    .update(updates)
    .eq('id', id)
    .select(inventorySelect)
    .single()

  if (error) throw new HttpError(500, error.message)

  await Promise.all([
    logActivity(supabase, {
      householdId: context.householdId,
      actorUserId: userId,
      actorName: context.actorName,
      action: `Updated ${data.name}`,
      icon: '✏️',
      entityType: 'inventory_item',
      entityId: data.id,
    }),
    syncInventoryNotifications(supabase, {
      householdId: context.householdId,
      item: {
        id: data.id,
        name: data.name,
        qty: Number(data.quantity),
        lowStockThreshold: data.low_stock_threshold,
        exp: data.expiration_date,
      },
    }),
  ])

  const withUrl = await attachSignedImageUrls(supabase, [data])
  return mapInventoryRow(withUrl[0])
}

export const deleteInventory = async (supabase: SupabaseClient, userId: string, id: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const { data: existing, error: existingError } = await supabase
    .from('inventory_items')
    .select('id, name')
    .eq('id', id)
    .single()

  if (existingError) throw new HttpError(500, existingError.message)

  const { error } = await supabase.from('inventory_items').delete().eq('id', id)
  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Deleted ${existing.name}`,
    icon: '🗑️',
    entityType: 'inventory_item',
    entityId: existing.id,
  })

  return { id }
}

export const consumeInventory = async (supabase: SupabaseClient, userId: string, id: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      consumed_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('id', id)
    .select(inventorySelect)
    .single()

  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Marked ${data.name} as consumed`,
    icon: '✅',
    entityType: 'inventory_item',
    entityId: data.id,
  })

  const withUrl = await attachSignedImageUrls(supabase, [data])
  return mapInventoryRow(withUrl[0])
}

export const toggleInventoryFavorite = async (supabase: SupabaseClient, userId: string, id: string) => {
  const { data: current, error: currentError } = await supabase
    .from('inventory_items')
    .select('id, is_favorite')
    .eq('id', id)
    .single()

  if (currentError) throw new HttpError(500, currentError.message)

  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      is_favorite: !current.is_favorite,
      updated_by: userId,
    })
    .eq('id', id)
    .select(inventorySelect)
    .single()

  if (error) throw new HttpError(500, error.message)

  const withUrl = await attachSignedImageUrls(supabase, [data])
  return mapInventoryRow(withUrl[0])
}
