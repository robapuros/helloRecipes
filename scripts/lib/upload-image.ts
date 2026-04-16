import { SupabaseClient } from '@supabase/supabase-js'

const HF_IMAGE_BASE   = 'https://img.hellofresh.com/hellofresh_s3'
const HF_CLOUDFRONT   = 'd3hvwccx09j84u.cloudfront.net'
const BUCKET          = 'Pics'

/**
 * Rewrite a CloudFront URL to the working img.hellofresh.com CDN.
 * CloudFront: https://d3hvwccx09j84u.cloudfront.net/0,0/image/FILE.jpg
 * Working:    https://img.hellofresh.com/hellofresh_s3/image/FILE.jpg
 */
function normaliseImageUrl(url: string): string {
  if (url.includes(HF_CLOUDFRONT)) {
    // Strip the size prefix (/0,0/ or /200,200/ etc.) and rebase to hellofresh CDN
    const path = url.replace(/^https?:\/\/[^/]+\/[\d,]+\//, '/')
    return `${HF_IMAGE_BASE}${path}`
  }
  return url
}

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

  // Build the full source URL
  const rawUrl = imagePath.startsWith('http')
    ? imagePath
    : `${HF_IMAGE_BASE}${imagePath}`

  const sourceUrl = normaliseImageUrl(rawUrl)

  try {
    const response = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HelloRecipes/1.0)' },
      signal: AbortSignal.timeout(20000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return uploadBuffer(
      supabase,
      await response.arrayBuffer(),
      response.headers.get('content-type') ?? 'image/jpeg',
      storagePath,
    )
  } catch (err) {
    console.error(`  ✗ Image upload failed for ${sourceUrl}: ${err}`)
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
