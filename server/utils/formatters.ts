const DAY_IN_MS = 1000 * 60 * 60 * 24

export const toRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}

export const getFreshnessStatus = (expirationDate: string) => {
  const today = new Date()
  const diffDays = Math.floor((new Date(expirationDate).getTime() - today.getTime()) / DAY_IN_MS)
  if (diffDays < 0) return 'expired'
  if (diffDays <= 2) return 'expiring'
  return 'fresh'
}

export const initialsFromName = (value: string) =>
  value
    .split(/\s+/)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? '')
    .join('')

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

const notificationStyleMap: Record<string, { icon: string; color: string }> = {
  expiry: { icon: '⚠️', color: '#FEF3C7' },
  recipe: { icon: '👨‍🍳', color: '#D1FAE5' },
  grocery: { icon: '🛒', color: '#EFF6FF' },
  report: { icon: '📊', color: '#EDE9FE' },
  stock: { icon: '📦', color: '#FEE2E2' },
  system: { icon: '✨', color: '#D1FAE5' },
}

export const mapInventoryRow = (row: Record<string, any>) => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  emoji: row.inventory_categories?.emoji ?? categoryEmojiMap[row.inventory_categories?.name ?? row.category_name ?? 'Other'] ?? '📦',
  qty: Number(row.quantity),
  unit: row.unit,
  cat: row.inventory_categories?.name ?? row.category_name ?? 'Other',
  categoryId: row.category_id,
  shelf: row.storage_location,
  exp: row.expiration_date,
  status: row.freshness_status ?? getFreshnessStatus(row.expiration_date),
  loc: row.shelf_label,
  fav: Boolean(row.is_favorite),
  notes: row.notes,
  imageUrl: row.image_url ?? null,
  imagePath: row.image_path ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lowStockThreshold: row.low_stock_threshold === null ? null : Number(row.low_stock_threshold),
})

export const mapGroceryRow = (row: Record<string, any>) => ({
  id: row.id,
  listId: row.list_id,
  householdId: row.household_id,
  name: row.name,
  qty: Number(row.quantity),
  unit: row.unit,
  cat: row.inventory_categories?.name ?? row.category_name ?? 'Other',
  checked: Boolean(row.is_checked),
  priority: row.priority,
  notes: row.notes,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

export const mapNotificationRow = (row: Record<string, any>) => {
  const style = notificationStyleMap[row.type] ?? notificationStyleMap.system
  return {
    id: row.id,
    householdId: row.household_id,
    userId: row.user_id,
    type: row.type,
    icon: row.icon ?? style.icon,
    color: row.color ?? style.color,
    title: row.title,
    body: row.body,
    time: toRelativeTime(row.created_at),
    read: Boolean(row.read_at),
    entityId: row.entity_id,
    entityType: row.entity_type,
    createdAt: row.created_at,
    metadata: row.metadata ?? {},
  }
}

export const mapRecipeRow = (row: Record<string, any>) => ({
  id: row.id,
  householdId: row.household_id,
  name: row.name,
  emoji: row.emoji,
  time: row.cook_time_minutes,
  diff: row.difficulty,
  cals: row.calories,
  match: row.match_score,
  tags: row.tags ?? [],
  ingredients: row.ingredients ?? [],
  steps: row.steps ?? [],
  saved: Boolean(row.is_saved),
  createdAt: row.created_at,
})

export const mapActivityRow = (row: Record<string, any>) => ({
  id: row.id,
  householdId: row.household_id,
  icon: row.icon,
  action: row.action,
  actorName: row.actor_name,
  time: toRelativeTime(row.created_at),
  createdAt: row.created_at,
})

export const mapScanRow = (row: Record<string, any>) => ({
  id: row.id,
  imageUrl: row.image_url ?? null,
  status: row.status,
  itemsDetected: Array.isArray(row.detections) ? row.detections.length : 0,
  createdAt: row.created_at,
  detections: Array.isArray(row.detections) ? row.detections : [],
})
