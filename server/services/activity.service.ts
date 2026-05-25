import type { SupabaseClient } from '@supabase/supabase-js'

export const logActivity = async (
  supabase: SupabaseClient,
  payload: {
    householdId: string
    actorUserId: string
    actorName: string
    action: string
    icon: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, unknown>
  },
) => {
  await supabase.from('household_activity').insert({
    household_id: payload.householdId,
    actor_user_id: payload.actorUserId,
    actor_name: payload.actorName,
    action: payload.action,
    icon: payload.icon,
    entity_type: payload.entityType ?? null,
    entity_id: payload.entityId ?? null,
    metadata: payload.metadata ?? {},
  })
}
