import { useEffect } from 'react'

type Props = {
  message: string | null
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 2800 }: Props) {
  useEffect(() => {
    if (!message) return
    const t = window.setTimeout(() => onDismiss(), durationMs)
    return () => window.clearTimeout(t)
  }, [message, onDismiss, durationMs])

  if (!message) return null

  return (
    <div
      className="pointer-events-none fixed bottom-24 left-1/2 z-[100] w-[90%] max-w-sm -translate-x-1/2"
      role="status"
    >
      <div className="rounded-[10px] bg-[#1C1C1E]/88 px-4 py-2.5 text-center text-[13px] font-medium text-white shadow-lg backdrop-blur-xl dark:bg-[#EBEBF5]/92 dark:text-[#1C1C1E]">
        {message}
      </div>
    </div>
  )
}
