import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  type Locale,
  detectDeviceLocale,
  t as translate,
  type I18nKey,
} from '../lib/i18n'

type I18nContextValue = {
  locale: Locale
  t: (key: I18nKey, vars?: Record<string, string | number>) => string
  setLocale: (l: Locale) => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    detectDeviceLocale(),
  )

  useEffect(() => {
    const onChange = () => setLocaleState(detectDeviceLocale())
    window.addEventListener('languagechange', onChange)
    return () => window.removeEventListener('languagechange', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === 'ko' ? 'ko' : 'en'
  }, [locale])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])

  const t = useCallback(
    (key: I18nKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  )

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale],
  )

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  )
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
