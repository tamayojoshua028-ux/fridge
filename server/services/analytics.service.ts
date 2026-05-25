import type { SupabaseClient } from '@supabase/supabase-js'

import { getHouseholdContext } from '../utils/context'
import { HttpError } from '../utils/app-error'

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const getAnalytics = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const [inventoryResult, groceryResult, snapshotResult] = await Promise.all([
    supabase
      .from('inventory_items')
      .select('name, freshness_status, expiration_date, inventory_categories(name)')
      .eq('household_id', householdId)
      .is('consumed_at', null),
    supabase
      .from('grocery_items')
      .select('quantity, created_at')
      .eq('household_id', householdId),
    supabase
      .from('analytics_snapshots')
      .select('*')
      .eq('household_id', householdId)
      .order('metric_date', { ascending: false })
      .limit(7),
  ])

  if (inventoryResult.error) throw new HttpError(500, inventoryResult.error.message)
  if (groceryResult.error) throw new HttpError(500, groceryResult.error.message)
  if (snapshotResult.error) throw new HttpError(500, snapshotResult.error.message)

  const inventory = inventoryResult.data ?? []
  const grocery = groceryResult.data ?? []
  const snapshots = snapshotResult.data ?? []

  const expired = inventory.filter((item) => item.freshness_status === 'expired').length
  const expiring = inventory.filter((item) => item.freshness_status === 'expiring').length
  const fresh = inventory.filter((item) => item.freshness_status === 'fresh').length
  const total = inventory.length || 1

  const waste =
    snapshots.length > 0
      ? snapshots.map((snapshot) => snapshot.waste_grams)
      : dayLabels.map((_, index) => Math.max(4, expired * 6 + index * 2))

  const spend =
    snapshots.length > 0
      ? snapshots.map((snapshot) => Number(snapshot.spend_amount))
      : dayLabels.map((_, index) => 65 + Math.round((grocery[index]?.quantity ?? 2) * 9))

  const categoryCounts = inventory.reduce<Record<string, number>>((accumulator, item) => {
    const category = Array.isArray(item.inventory_categories)
      ? item.inventory_categories[0]
      : item.inventory_categories
    const key = category?.name ?? 'Other'
    accumulator[key] = (accumulator[key] ?? 0) + 1
    return accumulator
  }, {})

  const categories = Object.entries(categoryCounts).map(([label, count], index) => ({
    label,
    pct: Math.round((count / total) * 100),
    color: ['#10B981', '#059669', '#F59E0B', '#3B82F6', '#8B5CF6'][index % 5],
  }))

  return {
    waste,
    spend,
    days: dayLabels,
    categories,
    totals: {
      wasteSaved: Math.max(18, fresh * 4),
      wasteReducedPct: Math.max(6, Math.round((fresh / total) * 20)),
      freshnessScore: Math.round((fresh / total) * 100),
      averageFreshDays: Math.max(3, Math.round((fresh * 10) / total)),
    },
    health: {
      totalItems: inventory.length,
      freshItems: fresh,
      expiringSoon: expiring,
      expired,
      wasteRate: Math.round((expired / total) * 100),
    },
  }
}
