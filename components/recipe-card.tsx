import Link from 'next/link'
import Image from 'next/image'
import { Clock, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatTime, timeColor } from '@/lib/utils/time'
import { difficultyLabel, difficultyColor } from '@/lib/utils/difficulty'
import type { RecipeCardData } from '@/types/database.types'
import { cn } from '@/lib/utils'

interface RecipeCardProps {
  recipe: RecipeCardData
}

const TAG_TYPE_PRIORITY = ['meal-type', 'cuisine', 'preference', null]

function topTags(tags: RecipeCardData['tags'], max = 2) {
  return [...tags]
    .sort(
      (a, b) =>
        TAG_TYPE_PRIORITY.indexOf(a.type) - TAG_TYPE_PRIORITY.indexOf(b.type),
    )
    .slice(0, max)
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const tags = topTags(recipe.tags ?? [])

  return (
    <Link
      href={`/recetas/${recipe.slug}`}
      className="group block rounded-2xl overflow-hidden bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border/50"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {recipe.image_url ? (
          <Image
            src={recipe.image_url}
            alt={recipe.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">
            🍽️
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className="text-white font-semibold text-sm tracking-wide">
            Ver receta →
          </span>
        </div>

        {/* Ingredient match badge */}
        {recipe.matchCount != null && recipe.totalCount != null && (
          <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {recipe.matchCount}/{recipe.totalCount} ingredientes
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-base leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {recipe.name}
        </h3>

        {recipe.headline && (
          <p className="text-muted-foreground text-sm line-clamp-1">
            {recipe.headline}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            {/* Time */}
            {recipe.total_time_min && (
              <span
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  timeColor(recipe.total_time_min),
                )}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTime(recipe.total_time_min)}
              </span>
            )}

            {/* Difficulty */}
            {recipe.difficulty !== null && recipe.difficulty !== undefined && (
              <span
                className={cn(
                  'text-xs font-medium',
                  difficultyColor(recipe.difficulty),
                )}
              >
                {difficultyLabel(recipe.difficulty)}
              </span>
            )}
          </div>

          {/* Rating */}
          {recipe.average_rating && recipe.average_rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              {recipe.average_rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {tags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs px-2 py-0.5 rounded-full font-normal"
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
