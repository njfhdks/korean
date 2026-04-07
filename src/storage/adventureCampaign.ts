import type { AdventureSpec } from '../data/adventureBitmap'
import {
  invertDisplaySpec,
  mirrorSpec,
} from '../data/adventureBitmap'
import { loadAdv, loadJson, saveJson, keys } from './gameStorage'

export type AdventureCampaignPhase = 'base' | 'mirror' | 'invert' | 'random'

export function loadCampaignPhase(): AdventureCampaignPhase {
  return loadJson<{ phase: AdventureCampaignPhase }>(
    keys.adventureCampaign,
    { phase: 'base' },
  ).phase
}

export function saveCampaignPhase(phase: AdventureCampaignPhase): void {
  saveJson(keys.adventureCampaign, { phase })
}

export function getCatalogForPhase(
  phase: AdventureCampaignPhase,
  base: AdventureSpec[],
): AdventureSpec[] {
  if (phase === 'base') return base
  if (phase === 'mirror') return base.map(mirrorSpec)
  if (phase === 'invert') return base.map(invertDisplaySpec)
  return []
}

export function isTierComplete(catalog: AdventureSpec[]): boolean {
  if (catalog.length === 0) return false
  return catalog.every((s) => {
    const p = loadAdv(s.id)
    return p.cleared.length >= s.stageOrder.length
  })
}

/** 마지막 스테이지 저장 직후 호출 — 티어가 끝났으면 다음 페이즈로 */
export function tryAdvanceCampaignPhase(
  baseCatalog: AdventureSpec[],
): AdventureCampaignPhase | null {
  const phase = loadCampaignPhase()
  if (phase === 'random') return null
  const cat = getCatalogForPhase(phase, baseCatalog)
  if (!isTierComplete(cat)) return null
  const next: AdventureCampaignPhase =
    phase === 'base' ? 'mirror' : phase === 'mirror' ? 'invert' : 'random'
  saveCampaignPhase(next)
  return next
}
