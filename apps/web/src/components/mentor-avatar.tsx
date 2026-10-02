import { useState } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/format'

export function MentorAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string | null
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(photoUrl) && !failed

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground',
        className,
      )}
    >
      {showPhoto ? (
        <img
          src={photoUrl!}
          alt=""
          className="size-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </div>
  )
}
