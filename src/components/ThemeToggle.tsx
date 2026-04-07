import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { applyTheme, getStoredTheme, type ThemeMode } from '../lib/theme'

export function ThemeToggle() {
  const { t } = useI18n()
  const [mode, setMode] = useState<ThemeMode>(() => getStoredTheme())

  const toggle = () => {
    setMode((m) => {
      const next: ThemeMode = m === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      return next
    })
  }

  const isDark = mode === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      className="glass-btn-icon"
      aria-label={isDark ? t('ariaThemeLight') : t('ariaThemeDark')}
    >
      {isDark ? (
        <Sun className="h-[22px] w-[22px]" strokeWidth={2} />
      ) : (
        <Moon className="h-[22px] w-[22px]" strokeWidth={2} />
      )}
    </button>
  )
}
