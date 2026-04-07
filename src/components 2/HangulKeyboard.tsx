/** 쌍자음·ㅒ·ㅖ 제외 — 심플 3열 */
const ROWS: string[][] = [
  ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ'],
  ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ'],
  ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ'],
]

type Props = {
  onJamo: (j: string) => void
  onBackspace: () => void
  disabled?: boolean
  lastKey?: string | null
}

export function HangulKeyboard({ onJamo, onBackspace, disabled, lastKey }: Props) {
  return (
    <div className="flex w-full max-w-lg flex-col gap-2 px-1">
      {ROWS.map((row, ri) => (
        <div key={ri} className="flex flex-wrap justify-center gap-1.5">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onJamo(key)}
              className={`min-h-10 min-w-8 rounded-lg text-[15px] font-semibold transition active:scale-95 sm:min-h-11 sm:min-w-9 sm:text-base ${
                lastKey === key
                  ? 'bg-sky-400 text-slate-950 shadow-lg ring-2 ring-sky-200'
                  : 'bg-slate-700 text-slate-100 ring-1 ring-slate-600 hover:bg-slate-600'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        onClick={onBackspace}
        className="mt-1 min-h-11 w-full rounded-xl bg-slate-700 py-2.5 text-sm font-bold text-slate-100 ring-1 ring-slate-600 hover:bg-slate-600 active:scale-[0.99] sm:min-h-12 sm:text-base"
      >
        ← 지우기
      </button>
    </div>
  )
}
