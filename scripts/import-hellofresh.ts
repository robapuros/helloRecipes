#!/usr/bin/env tsx
/**
 * HelloFresh recipe import script
 *
 * Usage:
 *   npx tsx scripts/import-hellofresh.ts --input ./data/recipes.json
 *   npx tsx scripts/import-hellofresh.ts --url https://www.hellofresh.es/_next/data/BUILDID/recipes.json
 *
 * Required env vars (in .env.local or passed directly):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import pLimit from 'p-limit'
import { parseRecipe } from './lib/parse-recipe'
import { upsertRecipe } from './lib/upsert-recipe'
import type { HFRecipe, HFRecipesResponse } from '../types/hellofresh'

// Load env vars from .env.local if running locally
try {
  const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of envFile.split('\n')) {
    const [key, ...rest] = line.split('=')
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim()
    }
  }
} catch {
  // .env.local not found — assume env vars are already set
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// Parse CLI args
const args = process.argv.slice(2)
const inputFlag = args.indexOf('--input')
const urlFlag = args.indexOf('--url')

async function loadRecipes(): Promise<HFRecipe[]> {
  if (inputFlag !== -1) {
    const filePath = resolve(process.cwd(), args[inputFlag + 1])
    console.log(`📂 Loading recipes from file: ${filePath}`)
    const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as HFRecipesResponse
    return extractRecipes(raw)
  }

  if (urlFlag !== -1) {
    const url = args[urlFlag + 1]
    console.log(`🌐 Fetching recipes from URL: ${url}`)
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`)
    const raw = (await res.json()) as HFRecipesResponse
    return extractRecipes(raw)
  }

  // No args: try to discover the HelloFresh API
  console.log('🔍 No --input or --url provided. Trying to discover the HelloFresh API...')
  return await discoverAndFetch()
}

function extractRecipes(data: HFRecipesResponse): HFRecipe[] {
  // Handle various response shapes
  const candidates = [
    data.recipes,
    data.items,
    data.data?.recipes,
    data.data?.items,
    data.pageProps?.recipes,
    data.pageProps?.items,
    data.pageProps?.savedRecipes,
    // Handle if root is an array
    Array.isArray(data) ? (data as unknown as HFRecipe[]) : undefined,
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      console.log(`✅ Found ${candidate.length} recipes`)
      return candidate
    }
  }

  // Try to find any array of objects with an 'id' and 'name' field
  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0 && value[0]?.id && value[0]?.name) {
      console.log(`✅ Found ${value.length} recipes (auto-detected field)`)
      return value as HFRecipe[]
    }
  }

  console.error('❌ Could not find recipes array in the provided data. Keys found:', Object.keys(data))
  process.exit(1)
}

async function discoverAndFetch(): Promise<HFRecipe[]> {
  // Try to get the current build ID from the HelloFresh site
  const siteRes = await fetch('https://www.hellofresh.es/recipes', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
    signal: AbortSignal.timeout(15000),
  })

  if (!siteRes.ok) {
    console.error('❌ Could not reach hellofresh.es. Please provide --input or --url')
    process.exit(1)
  }

  const html = await siteRes.text()
  const buildIdMatch = html.match(/"buildId":"([^"]+)"/)
  if (!buildIdMatch) {
    console.error('❌ Could not find buildId in hellofresh.es. Please provide --input or --url')
    process.exit(1)
  }

  const buildId = buildIdMatch[1]
  const url = `https://www.hellofresh.es/_next/data/${buildId}/recipes.json`
  console.log(`🔍 Discovered build ID: ${buildId}`)
  console.log(`🌐 Fetching: ${url}`)

  const dataRes = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
    signal: AbortSignal.timeout(30000),
  })

  if (!dataRes.ok) {
    console.error(`❌ Failed to fetch recipes: HTTP ${dataRes.status}`)
    console.error('Please download the JSON manually and use --input ./recipes.json')
    process.exit(1)
  }

  const raw = (await dataRes.json()) as HFRecipesResponse
  return extractRecipes(raw)
}

async function logError(recipe: HFRecipe, errorType: string, errorMessage: string, rawPayload: unknown) {
  await supabase.from('import_errors').insert({
    hf_recipe_id: recipe.id,
    hf_recipe_name: recipe.name ?? null,
    hf_recipe_url: recipe.websiteUrl ?? recipe.canonicalLink ?? null,
    error_type: errorType,
    error_message: errorMessage,
    raw_payload: rawPayload as object,
  })
}

async function main() {
  console.log('\n🍳 HelloRecipes Import Script\n')

  const recipes = await loadRecipes()
  const total = recipes.length
  let imported = 0
  let failed = 0

  // Limit concurrent imports to avoid overwhelming the database
  const limit = pLimit(3)

  console.log(`\n📝 Starting import of ${total} recipes...\n`)

  const tasks = recipes.map((recipe, index) =>
    limit(async () => {
      const label = `[${index + 1}/${total}] ${recipe.name}`
      try {
        const parsed = parseRecipe(recipe)
        const result = await upsertRecipe(supabase, parsed)

        if (result.success) {
          imported++
          console.log(`  ✅ ${label}`)
        } else {
          failed++
          console.error(`  ❌ ${label}: ${result.error}`)
          await logError(recipe, 'upsert_failed', result.error ?? 'Unknown error', recipe)
        }
      } catch (err) {
        failed++
        const message = err instanceof Error ? err.message : String(err)
        console.error(`  ❌ ${label}: ${message}`)
        await logError(recipe, 'parse_failed', message, recipe)
      }

      // Small delay every 10 recipes to avoid rate limiting
      if ((index + 1) % 10 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }),
  )

  await Promise.all(tasks)

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Imported: ${imported}/${total} recipes`)
  if (failed > 0) {
    console.log(`❌ Failed:   ${failed}/${total} recipes`)
    console.log('   → Check the import_errors table in Supabase for details')
    console.log('   → Use the /admin/importaciones page to resolve them manually')
  }
  console.log('─'.repeat(50) + '\n')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
