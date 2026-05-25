import type { SupabaseClient } from '@supabase/supabase-js'

import { logActivity } from './activity.service'
import { getHouseholdContext } from '../utils/context'
import { mapInventoryRow, mapScanRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const detectionCatalog = [
  { keywords: ['milk'], name: 'Organic Milk', qty: 1, unit: 'L', cat: 'Dairy', conf: 97, emoji: '🥛' },
  { keywords: ['berry', 'strawberry'], name: 'Strawberries', qty: 1, unit: 'pkg', cat: 'Fruits', conf: 92, emoji: '🍓' },
  { keywords: ['egg'], name: 'Eggs', qty: 6, unit: 'pcs', cat: 'Protein', conf: 94, emoji: '🥚' },
  { keywords: ['bread', 'toast'], name: 'Sourdough Bread', qty: 1, unit: 'loaf', cat: 'Bakery', conf: 89, emoji: '🍞' },
  { keywords: ['tomato'], name: 'Tomatoes', qty: 4, unit: 'pcs', cat: 'Veggies', conf: 91, emoji: '🍅' },
]

const inventoryInsertForScan = (householdId: string, userId: string, item: Record<string, any>) => ({
  household_id: householdId,
  created_by: userId,
  updated_by: userId,
  name: item.name,
  emoji: item.emoji ?? '📦',
  quantity: item.qty,
  unit: item.unit,
  storage_location: item.cat === 'Dairy' || item.cat === 'Protein' ? 'Fridge' : 'Pantry',
  expiration_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10),
  freshness_status: 'fresh',
  shelf_label: item.cat === 'Dairy' || item.cat === 'Protein' ? 'Main shelf' : 'Pantry shelf',
  notes: `Imported from scan with ${item.conf}% confidence`,
  is_favorite: false,
})

export const getScanHistory = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('food_scans')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) throw new HttpError(500, error.message)

  const scans = await Promise.all(
    (data ?? []).map(async (row) => {
      if (!row.image_path) return row
      const { data: signed } = await supabase.storage.from('scan-images').createSignedUrl(row.image_path, 60 * 60)
      return { ...row, image_url: signed?.signedUrl ?? null }
    }),
  )

  return scans.map(mapScanRow)
}

export const analyzeScan = async (
  supabase: SupabaseClient,
  userId: string,
  payload: {
    imagePath: string
    imageUrl?: string | null
    fileName: string
  },
) => {
  const context = await getHouseholdContext(supabase, userId)
  const lowerName = payload.fileName.toLowerCase()
  const detections =
    detectionCatalog
      .filter((item) => item.keywords.some((keyword) => lowerName.includes(keyword)))
      .slice(0, 4)
      .map((item) => ({
        id: crypto.randomUUID(),
        ...item,
      })) ||
    []

  const finalDetections =
    detections.length > 0
      ? detections
      : [
          {
            id: crypto.randomUUID(),
            name: 'Fresh Produce Mix',
            qty: 1,
            unit: 'pkg',
            cat: 'Veggies',
            conf: 76,
            emoji: '🥬',
          },
          {
            id: crypto.randomUUID(),
            name: 'Pantry Staple',
            qty: 1,
            unit: 'can',
            cat: 'Other',
            conf: 71,
            emoji: '📦',
          },
        ]

  const { data, error } = await supabase
    .from('food_scans')
    .insert({
      household_id: context.householdId,
      created_by: userId,
      image_path: payload.imagePath,
      status: 'completed',
      confidence_avg: Math.round(finalDetections.reduce((sum, item) => sum + item.conf, 0) / finalDetections.length),
      detections: finalDetections,
    })
    .select('*')
    .single()

  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Scanned ${finalDetections.length} new items`,
    icon: '📷',
    entityType: 'food_scan',
    entityId: data.id,
  })

  const { data: signedUrl } = await supabase.storage.from('scan-images').createSignedUrl(data.image_path, 60 * 60)
  const scan = mapScanRow({
    ...data,
    image_url: signedUrl?.signedUrl ?? payload.imageUrl ?? null,
  })

  return {
    scan,
    detections: finalDetections,
  }
}

export const saveScanToInventory = async (
  supabase: SupabaseClient,
  userId: string,
  scanId: string,
  payload: {
    items: Record<string, any>[]
  },
) => {
  const context = await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(payload.items.map((item) => inventoryInsertForScan(context.householdId, userId, item)))
    .select(`
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
    `)

  if (error) throw new HttpError(500, error.message)

  await logActivity(supabase, {
    householdId: context.householdId,
    actorUserId: userId,
    actorName: context.actorName,
    action: `Saved ${payload.items.length} scanned items to inventory`,
    icon: '📦',
    entityType: 'food_scan',
    entityId: scanId,
  })

  return (data ?? []).map(mapInventoryRow)
}
