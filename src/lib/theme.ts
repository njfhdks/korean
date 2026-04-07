const STORAGE_KEY = 'wordmap:theme'

export type ThemeMode = 'light' | 'dark'

export function getStoredTheme(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {
    /* ignore */
  }
  return 'light'
}

export function applyTheme(mode: ThemeMode): void {
  document.documentElement.classList.toggle('dark', mode === 'dark')
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

/** 앱 부트 시 한 번 호출 (깜빡임 최소화) */
export function initTheme(): void {
  applyTheme(getStoredTheme())
}
