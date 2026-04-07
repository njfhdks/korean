import { useEffect, useMemo, useState } from 'react'
import {
  ADVENTURE_DEMO,
  syllablesForAdventureStage,
  type AdventureBitmapSpec,
} from '../data/adventureBitmap'
import { loadAdventure, saveAdventureProgress } from '../storage/gameStorage'
import { JamoWordleGame } from './JamoWordleGame'
import { Map as MapIcon } from 'lucide-react'

function isCleared(cleared: readonly number[], idx: number) {
  return cleared.includes(idx)
}

type Props = {
  spec?: AdventureBitmapSpec
}

export function AdventureMapView({ spec = ADVENTURE_DEMO }: Props) {
  const progress = useMemo(() => loadAdventure(spec.id), [spec.id])
  const [cleared, setCleared] = useState<number[]>(progress.cleared)

  useEffect(() => {
    setCleared(loadAdventure(spec.id).cleared)
  }, [spec.id])
  const [gameKey, setGameKey] = useState(0)
  const [activeStage, setActiveStage] = useState<number | null>(null)

  const total = spec.stageOrder.length
  const syllables = useMemo(() => {
    if (activeStage === null) return 2 as const
    return syllablesForAdventureStage(activeStage, total)
  }, [activeStage, total])

  const persist = (next: number[]) => {
    setCleared(next)
    saveAdventureProgress({ mapId: spec.id, cleared: next })
  }

  const openStage = (stageIndex: number) => {
    setActiveStage(stageIndex)
    setGameKey((k) => k + 1)
  }

  const onWinStage = () => {
    if (activeStage === null) return
    console.log('[전면 광고] 어드벤처 스테이지 클리어 — 실제 앱에서는 전면 광고 표시')
    const stage = activeStage
    const next = cleared.includes(stage)
      ? cleared
      : [...cleared, stage].sort((a, b) => a - b)
    persist(next)
    window.setTimeout(() => setActiveStage(null), 2200)
  }

  const nextUncleared = Array.from({ length: total }, (_, i) => i).find(
    (i) => !isCleared(cleared, i),
  ) ?? -1

  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <div className="flex items-center gap-2 text-slate-200">
        <MapIcon className="h-5 w-5 text-sky-400" aria-hidden />
        <h2 className="text-lg font-bold">{spec.name}</h2>
        <span className="text-sm text-slate-500">
          {cleared.length}/{total} 클리어
        </span>
      </div>

      <div
        className="overflow-x-auto rounded-2xl bg-slate-900 p-3 shadow-inner ring-1 ring-slate-700"
        style={{ touchAction: 'manipulation' }}
      >
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${spec.cols}, minmax(0, 1fr))`,
          }}
        >
          {spec.mask.flatMap((row, r) =>
            row.map((cell, c) => {
              const stageIndex = spec.stageOrder.findIndex(
                (p) => p.row === r && p.col === c,
              )
              if (cell === 0) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="aspect-square min-w-[14px] opacity-0 sm:min-w-[18px]"
                  />
                )
              }
              const done = isCleared(cleared, stageIndex)
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  title={`스테이지 ${stageIndex + 1}`}
                  onClick={() => openStage(stageIndex)}
                  className={`aspect-square min-w-[14px] rounded-md text-[9px] font-bold transition sm:min-w-[18px] sm:text-[10px] ${
                    done
                      ? 'bg-sky-400 text-slate-900 shadow'
                      : 'bg-slate-700 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-600'
                  }`}
                >
                  {stageIndex + 1}
                </button>
              )
            }),
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500">
        스테이지를 누르면 해당 칸의 퍼즐이 시작됩니다. 진행할수록 긴 단어가
        출제됩니다. 실패 시 같은 길이의 새 단어로 바뀝니다.
      </p>

      {nextUncleared >= 0 && (
        <button
          type="button"
          onClick={() => openStage(nextUncleared)}
          className="rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-sky-500/20"
        >
          다음 스테이지 ({nextUncleared + 1}번) 바로가기
        </button>
      )}

      {cleared.length === total && (
        <div className="rounded-2xl border-2 border-sky-500/50 bg-sky-950/60 p-4 text-center ring-1 ring-sky-400/20">
          <p className="text-lg font-bold text-sky-300">비트맵 완성!</p>
          <p className="mt-1 text-sm text-slate-400">
            모든 스테이지를 클리어해 그림이 채워졌습니다.
          </p>
        </div>
      )}

      {activeStage !== null && (
        <div className="rounded-2xl border border-slate-700 bg-slate-900/90 p-3 shadow-xl ring-1 ring-sky-500/10">
          <p className="mb-2 text-center text-sm font-semibold text-sky-200">
            스테이지 {activeStage + 1} · {syllables}음절
          </p>
          <JamoWordleGame
            key={`${activeStage}-${gameKey}`}
            gameKey={`${activeStage}-${gameKey}`}
            syllables={syllables}
            onWin={onWinStage}
            allowRewardAd
            onLose={() => setGameKey((k) => k + 1)}
          />
        </div>
      )}
    </div>
  )
}
