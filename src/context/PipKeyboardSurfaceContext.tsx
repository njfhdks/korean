import { createContext, useContext } from 'react'

/** Document PiP 포털 여부 — 키보드 리스너가 올바른 window에 붙도록 WordleGame이 구독 */
export const PipKeyboardSurfaceKeyContext = createContext(0)

export function usePipKeyboardSurfaceKey(): number {
  return useContext(PipKeyboardSurfaceKeyContext)
}
