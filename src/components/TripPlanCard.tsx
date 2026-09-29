export type ChecklistItem = { label: string; done: boolean }

export type TripPlanCardProps = {
  title: string
  startDate?: Date
  endDate?: Date
  weather?: { high: number; summary: string }
  /** Header photo; fades into the card background. */
  imageUrl?: string
  checklist: ChecklistItem[]
}

export function TripPlanCard({
  title,
  startDate,
  endDate,
  weather,
  imageUrl,
  checklist,
}: TripPlanCardProps) {
  return (
    <section className="overflow-hidden rounded-lg bg-white pb-8 text-neutral-900 shadow-elevation-2">
      <header className="relative px-6 pt-5 pb-20">
        {imageUrl && (
          <>
            {/* Photo fills the header and fades out into the card surface. */}
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 size-full object-cover [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
            />
            {/* Light scrim so the title reads over busy photos. */}
            <div className="absolute inset-x-0 top-0 h-44 bg-linear-to-b from-white/80 via-white/50 to-transparent" />
          </>
        )}
        <div className="relative">
          <h2 className="text-3xl leading-tight">{title}</h2>
          {startDate && endDate && (
            <p className="mt-0.5 whitespace-nowrap text-xl">
              {formatDay(startDate)} - {formatDay(endDate)}
            </p>
          )}
          {weather && (
            // drop-shadow (not text-shadow) so the icon gets it too.
            <div className="mt-6 flex items-center gap-6 text-white opacity-80 [filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.7))_drop-shadow(0_4px_12px_rgb(0_0_0/0.6))]">
              <SunIcon className="size-28" />
              <div>
                <p>
                  <span className="text-4xl">{weather.high}</span>{' '}
                  <span className="text-xl">high</span>
                </p>
                <p className="text-2xl">{weather.summary}</p>
              </div>
            </div>
          )}
        </div>
      </header>
      <ul className="space-y-2 px-6">
        {checklist.map((item) => (
          <li key={item.label} className="flex items-center gap-3 text-lg">
            <Checkbox checked={item.done} />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Display-only: completion comes from the trip profile, not user clicks. */
function Checkbox({ checked }: { checked: boolean }) {
  return checked ? (
    <span className="flex size-6 items-center justify-center rounded-sm bg-blue-600 text-white">
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12l5 5 9-10" />
      </svg>
    </span>
  ) : (
    <span className="size-6 rounded-sm border-2 border-neutral-500" />
  )
}

function SunIcon({ className }: { className?: string }) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="20" />
      {rays.map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="10"
          x2="50"
          y2="20"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
    </svg>
  )
}

// "Fri May 20th"
function formatDay(date: Date) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate()
  const suffix =
    day % 10 === 1 && day !== 11
      ? 'st'
      : day % 10 === 2 && day !== 12
        ? 'nd'
        : day % 10 === 3 && day !== 13
          ? 'rd'
          : 'th'
  return `${weekday} ${month} ${day}${suffix}`
}
