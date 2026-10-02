import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAR_VALUES = [1, 2, 3, 4, 5] as const

export function StarRatingInput({
  id,
  value,
  onChange,
}: {
  id: string
  value: number | null
  onChange: (value: number) => void
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Overall rating"
      className="flex items-center gap-1"
    >
      {STAR_VALUES.map((star) => {
        const filled = value !== null && star <= value
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            data-testid={`rating-star-${star}`}
            onClick={() => onChange(star)}
            className="rounded p-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Star
              className={cn(
                'size-7 transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-muted-foreground',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}

export function StarRow({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${rating} out of 5 stars`}
    >
      {STAR_VALUES.map((star) => (
        <Star
          key={star}
          className={cn(
            'size-4',
            star <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}

export function RatingSummary({
  averageRating,
  reviewCount,
  className,
}: {
  averageRating: number | null
  reviewCount: number
  className?: string
}) {
  if (averageRating === null || reviewCount === 0) {
    return (
      <span className={cn('text-sm font-medium text-muted-foreground', className)}>
        New
      </span>
    )
  }
  return (
    <span
      className={cn('inline-flex items-center gap-1 text-sm', className)}
      aria-label={`Rated ${averageRating.toFixed(1)} out of 5 from ${reviewCount} reviews`}
    >
      <Star className="size-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold">{averageRating.toFixed(1)}</span>
      <span className="text-muted-foreground">({reviewCount})</span>
    </span>
  )
}
