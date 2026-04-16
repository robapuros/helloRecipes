import { SupabaseClient } from '@supabase/supabase-js'

const HF_IMAGE_BASE = 'https://img.hellofresh.com/hellofresh_s3'
const HF_SITE_BASE  = 'https://www.hellofresh.es'
const BUCKET        = 'recipe-images'

/**
 * Download an image from HelloFresh CDN and upload it to Supabase Storage.
 * Returns the public URL of the uploaded image, or null on failure.
 */
export async function uploadImage(
  supabase: SupabaseClient,
  imagePath: string | null | undefined,
  storagePath: string,
): Promise<string | null> {
  if (!imagePath) return null

  // Build the full source URL — try the CDN first, fall back to site domain
  const sourceUrl = imagePath.startsWith('http')
    ? imagePath
    : `${HF_IMAGE_BASE}${imagePath}`

  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      // Fallback: try the site domain
      const fallbackUrl = `${HF_SITE_BASE}${imagePath}`
      const fallback = await fetch(fallbackUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
        signal: AbortSignal.timeout(15000),
      })
      if (!fallback.ok) {
        throw new Error(`HTTP ${fallback.status} from both CDN and site`)
      }
      return uploadBuffer(supabase, await fallback.arrayBuffer(), fallback.headers.get('content-type') ?? 'image/jpeg', storagePath)
    }

    return uploadBuffer(supabase, await response.arrayBuffer(), response.headers.get('content-type') ?? 'image/jpeg', storagePath)
  } catch (err) {
    console.error(`  ✗ Image upload failed for ${imagePath}: ${err}`)
    return null
  }
}

async function uploadBuffer(
  supabase: SupabaseClient,
  buffer: ArrayBuffer,
  contentType: string,
  storagePath: string,
): Promise<string | null> {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (error) {
    console.error(`  ✗ Supabase Storage upload failed for ${storagePath}: ${error.message}`)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}
