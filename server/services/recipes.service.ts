import type { SupabaseClient } from '@supabase/supabase-js'

import { getHouseholdContext } from '../utils/context'
import { mapRecipeRow } from '../utils/formatters'
import { HttpError } from '../utils/app-error'

const recipeTemplates = [
  {
    name: 'Creamy Chicken Pasta',
    emoji: '🍝',
    time: 25,
    diff: 'Easy',
    cals: 520,
    tags: ['High Protein', 'Quick'],
    required: ['chicken', 'pasta', 'olive oil', 'cheese'],
    steps: [
      'Cook the pasta until al dente.',
      'Sear the chicken with olive oil.',
      'Combine and finish with shredded cheese.',
    ],
  },
  {
    name: 'Berry Yogurt Bowl',
    emoji: '🍓',
    time: 5,
    diff: 'Easy',
    cals: 280,
    tags: ['Healthy', 'Breakfast'],
    required: ['strawberry', 'blueberry', 'yogurt'],
    steps: [
      'Add yogurt to a bowl.',
      'Top with berries.',
      'Serve chilled.',
    ],
  },
  {
    name: 'Veggie Rice Bowl',
    emoji: '🍲',
    time: 20,
    diff: 'Medium',
    cals: 380,
    tags: ['Balanced'],
    required: ['rice', 'spinach', 'tomato'],
    steps: [
      'Cook the rice.',
      'Saute the vegetables.',
      'Combine and season to taste.',
    ],
  },
  {
    name: 'Egg and Toast Stack',
    emoji: '🍳',
    time: 10,
    diff: 'Easy',
    cals: 420,
    tags: ['Breakfast', 'Quick'],
    required: ['egg', 'bread', 'cheese'],
    steps: [
      'Toast the bread.',
      'Cook the eggs your favorite way.',
      'Layer with cheese and serve.',
    ],
  },
]

const buildSuggestions = (itemNames: string[]) => {
  const normalizedNames = itemNames.map((value) => value.toLowerCase())
  const suggestions = recipeTemplates
    .map((template) => {
      const matches = template.required.filter((required) =>
        normalizedNames.some((itemName) => itemName.includes(required)),
      )
      const matchScore = Math.max(35, Math.round((matches.length / template.required.length) * 100))
      return {
        ...template,
        matchScore,
        ingredients: matches.map((match) => {
          const found = itemNames.find((item) => item.toLowerCase().includes(match))
          return found ?? match
        }),
      }
    })
    .sort((left, right) => right.matchScore - left.matchScore)

  if (suggestions.every((recipe) => recipe.matchScore <= 40)) {
    return [
      {
        name: 'Fresh Pantry Bowl',
        emoji: '🥗',
        time: 15,
        diff: 'Easy',
        cals: 340,
        tags: ['Flexible'],
        ingredients: itemNames.slice(0, 4),
        steps: [
          'Prep the freshest ingredients from your kitchen.',
          'Combine them into a simple bowl or skillet meal.',
          'Season to taste and serve immediately.',
        ],
        matchScore: 68,
      },
    ]
  }

  return suggestions.map((recipe) => ({
    ...recipe,
    ingredients: recipe.ingredients,
  }))
}

const recipeSelect = `
  id,
  household_id,
  name,
  emoji,
  cook_time_minutes,
  difficulty,
  calories,
  match_score,
  tags,
  ingredients,
  steps,
  is_saved,
  created_at
`

export const fetchRecipes = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const { data, error } = await supabase
    .from('recipes')
    .select(recipeSelect)
    .eq('household_id', householdId)
    .order('match_score', { ascending: false })

  if (error) throw new HttpError(500, error.message)
  if (data?.length) return data.map(mapRecipeRow)
  return generateRecipes(supabase, userId)
}

export const generateRecipes = async (supabase: SupabaseClient, userId: string) => {
  const { householdId } = await getHouseholdContext(supabase, userId)
  const inventoryResult = await supabase
    .from('inventory_items')
    .select('name')
    .eq('household_id', householdId)
    .is('consumed_at', null)

  if (inventoryResult.error) throw new HttpError(500, inventoryResult.error.message)

  const itemNames = (inventoryResult.data ?? []).map((item) => item.name)
  const suggestions = buildSuggestions(itemNames)

  const { data, error } = await supabase
    .from('recipes')
    .upsert(
      suggestions.map((recipe) => ({
        household_id: householdId,
        created_by: userId,
        name: recipe.name,
        emoji: recipe.emoji,
        cook_time_minutes: recipe.time,
        difficulty: recipe.diff,
        calories: recipe.cals,
        match_score: recipe.matchScore,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        is_saved: false,
        source: 'generated',
      })),
      { onConflict: 'household_id,name' },
    )
    .select(recipeSelect)

  if (error) throw new HttpError(500, error.message)
  return (data ?? []).map(mapRecipeRow).sort((left, right) => right.match - left.match)
}

export const toggleRecipeSaved = async (supabase: SupabaseClient, userId: string, id: string) => {
  await getHouseholdContext(supabase, userId)
  const current = await supabase.from('recipes').select('id, is_saved').eq('id', id).single()
  if (current.error) throw new HttpError(500, current.error.message)

  const { data, error } = await supabase
    .from('recipes')
    .update({ is_saved: !current.data.is_saved })
    .eq('id', id)
    .select(recipeSelect)
    .single()

  if (error) throw new HttpError(500, error.message)
  return mapRecipeRow(data)
}
