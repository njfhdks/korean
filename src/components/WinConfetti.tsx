import { useMemo } from 'react'

const COLORS = [
  '#FF6B6B',
  '#FFD60A',
  '#34C759',
  '#007AFF',
  '#AF52DE',
  '#FF9500',
  '#5AC8FA',
  '#FF375F',
]

type Props = {
  /** true일 때만 파티클 생성 */
  show: boolean
}

export function WinConfetti({ show }: Props) {
  const particles = useMemo(() => {
    if (!show) return []
    return Array.from({ length: 56 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 56 + Math.random() * 0.4
      const speed = 180 + Math.random() * 320
      const tx = Math.cos(angle) * speed + (Math.random() - 0.5) * 80
      const ty = Math.sin(angle) * speed + 120 + Math.random() * 180
      const rot = (Math.random() - 0.5) * 1080
      return {
        id: i,
        tx,
        ty,
        rot,
        delay: Math.random() * 0.12,
        dur: 0.95 + Math.random() * 0.55,
        w: 5 + Math.random() * 7,
        h: 4 + Math.random() * 9,
        color: COLORS[i % COLORS.length]!,
      }
    })
  }, [show])

  if (!show || particles.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[30] overflow-hidden"
      aria-hidden
    >
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece fixed rounded-[1px]"
          style={{
            left: `calc(50% - ${p.w / 2}px)`,
            top: 'min(32vh, 220px)',
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            ['--ctx' as string]: `${p.tx}px`,
            ['--cty' as string]: `${p.ty}px`,
            ['--crot' as string]: `${p.rot}deg`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
          }}
        />
      ))}
    </div>
  )
}
