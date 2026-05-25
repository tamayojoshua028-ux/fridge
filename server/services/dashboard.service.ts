import type { SupabaseClient } from '@supabase/supabase-js'

import { fetchRecipes } from './recipes.service'
import { getHouseholdContext } from '../utils/context'
import { getFreshnessStatus, mapActivityRow, mapInventoryRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const expiringSelect = `
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

export const getDashboardSummary = async (supabase: SupabaseClient, userId: string) => {
  const context = await getHouseholdContext(supabase, userId)

  const [inventoryResult, activityResult, profileResult, recipes] = await Promise.all([
    supabase
      .from('inventory_items')
      .select(expiringSelect)
      .eq('household_id', context.householdId)
      .is('consumed_at', null),
    supabase
      .from('household_activity')
      .select('*')
      .eq('household_id', context.householdId)
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('users').select('full_name').eq('id', userId).single(),
    fetchRecipes(supabase, userId),
  ])

  if (inventoryResult.error) throw new HttpError(500, inventoryResult.error.message)
  if (activityResult.error) throw new HttpError(500, activityResult.error.message)
  if (profileResult.error) throw new HttpError(500, profileResult.error.message)

  const items = (inventoryResult.data ?? []).map((row) =>
    mapInventoryRow({
      ...row,
      freshness_status: row.freshness_status ?? getFreshnessStatus(row.expiration_date),
    }),
  )

  const expiringItems = items
    .filter((item) => item.status !== 'fresh')
    .sort((left, right) => left.exp.localeCompare(right.exp))
    .slice(0, 3)

  const freshnessScore = items.length
    ? Math.round((items.filter((item) => item.status === 'fresh').length / items.length) * 100)
    : 100

  return {
    greetingName: profileResult.data.full_name.split(' ')[0] ?? 'there',
    trackedItems: items.length,
    expiringItems,
    stats: {
      totalItems: items.length,
      expiringSoon: items.filter((item) => item.status === 'expiring').length + items.filter((item) => item.status === 'expired').length,
      freshnessScore,
      savedThisWeek: Math.max(12, items.filter((item) => item.status === 'fresh').length * 3),
    },
    recipes: recipes.slice(0, 3),
    activity: (activityResult.data ?? []).map(mapActivityRow),
  }
}
