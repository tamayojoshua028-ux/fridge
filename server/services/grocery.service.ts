import type { SupabaseClient } from '@supabase/supabase-js'

import { logActivity } from './activity.service'
import { createNotification } from './notifications.service'
import { getHouseholdContext } from '../utils/context'
import { mapGroceryRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const grocerySelect = `
  id,
  list_id,
  household_id,
  category_id,
  name,
  quantity,
  unit,
  priority,
  notes,
  is_checked,
  created_at,
  updated_at,
  inventory_categories(name)
`

const ensureDefaultList = async (supabase: SupabaseClient, householdId: string, userId: string) => {
  const existing = await supabase
    .from('grocery_lists')
    .select('*')
    .eq('household_id', householdId)
    .eq('is_default', true)
    .limit(1)
    .maybeSingle()

  if (existing.data) return existing.data

  const created = await supabase
    .from('grocery_lists')
    .insert({
      household_id: householdId,
      name: 'Weekly Grocery List',
      is_default: true,
      created_by: userId,
    })
    .select('*')
    .single()

  if (created.error) throw new HttpError(500, created.error.message)
  return created.data
}

const loadGroceryState = async (supabase: SupabaseClient, householdId: string, userId: string) => {
  const list = await ensureDefaultList(supabase, householdId, userId)
  const itemsResult = await supabase
    .from('grocery_items')
    .select(grocerySelect)
    .eq('list_id', list.id)
    .order('created_at', { ascending: true })

  if (itemsResult.error) throw new HttpError(500, itemsResult.error.message)

  return {
    list: {
      id: list.id,
      householdId: list.household_id,
      name: list.name,
      isDefault: list.is_default,
      createdAt: list.created_at,
      updatedAt: list.updated_at,
    },
    items: (itemsResult.data ?? []).map(mapGroceryRow),
  }
}

const resolveCategoryId = async (supabase: SupabaseClient, householdId: string, categoryName: string) => {
  const result = await supabase
    .from('inventory_categories')
    .select('id')
    .or(`household_id.is.null,household_id.eq.${householdId}`)
    .eq('name', categoryName)
    .limit(1)
    .maybeSingle()

  if (result.error) throw new HttpError(500, result.error.message)
  return result.data?.id ?? null
}

export const getGroceryList = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  return loadGroceryState(supabase, householdId, userId)
}

export const createGrocery = async (supabase: SupabaseClient, userId: string, payload: Record<string, any>) => {
  const context = await getHouseholdContext(supabase, userId)
  const list = await ensureDefaultList(supabase, context.householdId, userId)
  const categoryId = await resolveCategoryId(supabase, context.householdId, payload.cat)

  const { data, error } = await supabase
    .from('grocery_items')
    .insert({
      list_id: list.id,
      household_id: context.householdId,
      category_id: categoryId,
      name: payload.name,
      quantity: payload.qty,
      unit: payload.unit,
      priority: payload.priority,
      notes: payload.notes ?? null,
      is_checked: false,
    })
    .select(grocerySelect)
    .single()

  if (error) throw new HttpError(500, error.message)

  await Promise.all([
    logActivity(supabase, {
      householdId: context.householdId,
      actorUserId: userId,
      actorName: context.actorName,
      action: `Added ${payload.name} to the grocery list`,
      icon: '🛒',
      entityType: 'grocery_item',
      entityId: data.id,
    }),
    createNotification(supabase, {
      householdId: context.householdId,
      type: 'grocery',
      title: `${payload.name} added to grocery list`,
      body: `${payload.name} is ready for the next shopping trip.`,
      entityType: 'grocery_item',
      entityId: data.id,
      dedupeKey: `grocery:${data.id}`,
    }),
  ])

  return mapGroceryRow(data)
}

export const updateGrocery = async (
  supabase: SupabaseClient,
  userId: string,
  id: string,
  payload: Record<string, any>,
) => {
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (payload.qty !== undefined) updates.quantity = payload.qty
  if (payload.checked !== undefined) updates.is_checked = payload.checked
  if (payload.priority !== undefined) updates.priority = payload.priority
  if (payload.notes !== undefined) updates.notes = payload.notes

  const { data, error } = await supabase
    .from('grocery_items')
    .update(updates)
    .eq('id', id)
    .select(grocerySelect)
    .single()

  if (error) throw new HttpError(500, error.message)
  return mapGroceryRow(data)
}

export const toggleGrocery = async (supabase: SupabaseClient, userId: string, id: string) => {
  const current = await supabase.from('grocery_items').select('id, is_checked').eq('id', id).single()
  if (current.error) throw new HttpError(500, current.error.message)

  return updateGrocery(supabase, userId, id, { checked: !current.data.is_checked })
}

export const deleteGrocery = async (supabase: SupabaseClient, userId: string, id: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const current = await supabase.from('grocery_items').select('id, name').eq('id', id).single()
  if (current.error) throw new HttpError(500, current.error.message)

  const { error } = await supabase.from('grocery_items').delete().eq('id', id)
  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Removed ${current.data.name} from the grocery list`,
    icon: '🗑️',
    entityType: 'grocery_item',
    entityId: current.data.id,
  })

  return { id }
}

export const clearPurchased = async (supabase: SupabaseClient, userId: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const list = await ensureDefaultList(supabase, context.householdId, userId)
  const { error } = await supabase.from('grocery_items').delete().eq('list_id', list.id).eq('is_checked', true)
  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: 'Cleared purchased grocery items',
    icon: '🛒',
    entityType: 'grocery_list',
    entityId: list.id,
  })

  return loadGroceryState(supabase, context.householdId, userId)
}

export const resetGrocery = async (supabase: SupabaseClient, userId: string) => {
  const context = await getHouseholdContext(supabase, userId)
  const list = await ensureDefaultList(supabase, context.householdId, userId)
  const { error } = await supabase
    .from('grocery_items')
    .update({ is_checked: false })
    .eq('list_id', list.id)

  if (error) throw new HttpError(500, error.message)
  return loadGroceryState(supabase, context.householdId, userId)
}
