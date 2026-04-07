import { useEffect, useId, useRef, useState } from 'react'

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[]
  }
}

type Props = {
  client: string
  slot: string
  /** 게재 형식 (AdSense 단위 설정과 맞출 것) */
  format?: 'auto' | 'horizontal' | 'rectangle' | 'vertical'
  className?: string
}

/**
 * 웹 전용 Google AdSense 표시 단위. `ads.txt`·승인된 게재 위치가 있어야 실제 광고가 나옵니다.
 * @see https://adsense.google.com/
 */
export function WebAdSenseUnit({
  client,
  slot,
  format = 'auto',
  className = '',
}: Props) {
  const uid = useId().replace(/:/g, '')
  const insRef = useRef<HTMLModElement>(null)
  const pushedRef = useRef(false)
  const [scriptReady, setScriptReady] = useState(
    () => !!document.querySelector('script[data-adsense-loader="1"]'),
  )

  useEffect(() => {
    const id = 'adsbygoogle-loader'
    let el = document.getElementById(id) as HTMLScriptElement | null
    if (!el) {
      el = document.createElement('script')
      el.id = id
      el.async = true
      el.dataset.adsenseLoader = '1'
      el.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`
      el.crossOrigin = 'anonymous'
      el.onload = () => setScriptReady(true)
      document.head.appendChild(el)
    } else {
      setScriptReady(true)
    }
  }, [client])

  useEffect(() => {
    if (!scriptReady || !insRef.current || pushedRef.current) return
    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
      pushedRef.current = true
    } catch (e) {
      console.warn('[AdSense] push failed', e)
    }
  }, [scriptReady, client, slot])

  return (
    <ins
      ref={insRef}
      id={`ads-${uid}`}
      className={`adsbygoogle block ${className}`}
      style={{ display: 'block' }}
      data-ad-client={client}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={format === 'auto' ? 'true' : undefined}
    />
  )
}
