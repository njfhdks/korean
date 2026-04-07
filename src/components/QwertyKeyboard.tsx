const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

type Props = {
  onKey: (letter: string) => void
  onEnter: () => void
  onBackspace: () => void
  disabled?: boolean
  /** Enter only works when word is complete (same as main Enter button). */
  canSubmit?: boolean
  letterHints?: Partial<Record<string, 'correct' | 'present' | 'absent'>>
}

export function QwertyKeyboard({
  onKey,
  onEnter,
  onBackspace,
  disabled,
  canSubmit = true,
  letterHints,
}: Props) {
  const keyCls = (ch: string) => {
    const h = letterHints?.[ch]
    const base =
      'min-h-[42px] min-w-[8px] flex-1 rounded-[8px] px-0.5 text-[18px] font-normal uppercase transition sm:min-h-[46px] sm:text-[20px] '
    if (h === 'correct') {
      return base + 'bg-[#34C759] text-white dark:bg-[#30D158]'
    }
    if (h === 'present') {
      return base + 'bg-[#FFD60A] text-[#000000] dark:bg-[#FFD60A] dark:text-black'
    }
    if (h === 'absent') {
      return (
        base +
        'bg-[#6b7280] font-semibold text-white dark:bg-[#1f2937] dark:text-white dark:ring-1 dark:ring-white/10'
      )
    }
    return (
      base +
      'border border-white/65 bg-white/75 text-[#111827] backdrop-blur-md active:bg-white/90 dark:border-white/20 dark:bg-white/22 dark:text-white dark:active:bg-white/30'
    )
  }

  const enterDisabled = disabled || !canSubmit

  return (
    <div className="flex w-full max-w-xl flex-col gap-2 px-0.5">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1">
          {row.map((k) => (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => onKey(k)}
              className={keyCls(k)}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div className="mt-0.5 flex gap-2">
        <button
          type="button"
          disabled={enterDisabled}
          onClick={onEnter}
          className={`min-h-[42px] flex-[1.15] rounded-[8px] border border-white/30 text-[15px] font-semibold backdrop-blur-md sm:min-h-[46px] sm:text-[16px] ${
            enterDisabled
              ? 'cursor-not-allowed border-white/20 bg-white/25 text-[#a1a1aa] dark:bg-white/5 dark:text-white/35'
              : 'border-[#007AFF]/40 bg-[#007AFF] text-white shadow-md active:bg-[#0066D6] dark:border-[#0A84FF]/50 dark:bg-[#0A84FF] dark:active:bg-[#0076E4]'
          }`}
        >
          Enter
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={onBackspace}
          className="min-h-[42px] flex-1 rounded-[8px] border border-white/45 bg-white/40 text-[15px] font-semibold text-[#000000] backdrop-blur-md active:bg-white/55 sm:min-h-[46px] dark:border-white/12 dark:bg-white/15 dark:text-white dark:active:bg-white/25"
        >
          ⌫
        </button>
      </div>
    </div>
  )
}
