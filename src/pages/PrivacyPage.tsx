import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import { ThemeToggle } from '../components/ThemeToggle'
import { getPrivacySections } from '../data/privacyPolicyCopy'

export function PrivacyPage() {
  const { locale, t } = useI18n()
  const sections = getPrivacySections(locale)

  return (
    <div className="relative z-10 mx-auto min-h-dvh max-w-lg px-4 py-3 pb-16">
      <header className="mb-4 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 rounded-xl py-2 pr-3 text-[15px] font-semibold text-[#007AFF] dark:text-[#0A84FF]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          {t('privacyBack')}
        </Link>
        <ThemeToggle />
      </header>

      <article className="glass-panel px-4 py-5 sm:px-5">
        <h1 className="text-[22px] font-bold tracking-tight text-[#000000] dark:text-white">
          WordMap — {t('privacyPageTitle')}
        </h1>
        <p className="mt-2 text-[13px] text-[#8E8E93]">{t('privacyEffective')}</p>

        <ol className="mt-8 list-none space-y-8 p-0">
          {sections.map((sec, i) => (
            <li key={sec.heading}>
              <h2 className="text-[17px] font-bold text-[#000000] dark:text-white">
                {i + 1}. {sec.heading}
              </h2>
              <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-[#3C3C43] dark:text-[#EBEBF5]">
                {sec.paragraphs.map((p, j) => (
                  <p key={`${i}-${j}`}>{p}</p>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-10 border-t border-white/30 pt-4 text-[12px] text-[#8E8E93] dark:border-white/10">
          © {new Date().getFullYear()} WordMap
        </p>
      </article>
    </div>
  )
}
