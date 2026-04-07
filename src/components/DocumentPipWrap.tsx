import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { PictureInPicture2 } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useI18n } from '../context/I18nContext'
import { PipKeyboardSurfaceKeyContext } from '../context/PipKeyboardSurfaceContext'
import { Toast } from './Toast'
import {
  copyStylesToPictureInPictureWindow,
  getPipApi,
  supportsDocumentPictureInPicture,
} from '../lib/documentPip'

type Props = {
  children: ReactNode
}

/**
 * Chrome 등 Document PiP 지원 시 상단에 PiP 토글, 자식 전체를 작은 창으로 포털.
 * 미지원·네이티브 앱은 자식만 그대로 렌더.
 */
export function DocumentPipWrap({ children }: Props) {
  const { t } = useI18n()
  const [pipWindow, setPipWindow] = useState<Window | null>(null)
  const [pipToast, setPipToast] = useState<string | null>(null)
  const pipWindowRef = useRef<Window | null>(null)
  pipWindowRef.current = pipWindow

  useEffect(() => {
    return () => {
      const w = pipWindowRef.current
      if (w && !w.closed) w.close()
    }
  }, [])

  const isNative = Capacitor.isNativePlatform()
  const supported =
    !isNative &&
    supportsDocumentPictureInPicture() &&
    (typeof window === 'undefined' || window.isSecureContext)

  const closePip = useCallback(() => {
    if (pipWindow) {
      pipWindow.close()
      setPipWindow(null)
    }
  }, [pipWindow])

  useEffect(() => {
    if (!pipWindow) return
    const onPageHide = () => setPipWindow(null)
    pipWindow.addEventListener('pagehide', onPageHide)
    return () => pipWindow.removeEventListener('pagehide', onPageHide)
  }, [pipWindow])

  /** 사용자 클릭 직후 동기 구간에서 requestWindow 호출 (제스처 소실 방지) */
  const togglePip = useCallback(() => {
    if (pipWindow) {
      closePip()
      return
    }
    const api = getPipApi()
    if (!api || !window.isSecureContext) {
      setPipToast(t('pipUnavailable'))
      return
    }
    void api
      .requestWindow({ width: 440, height: 720 })
      .then((w) => {
        copyStylesToPictureInPictureWindow(w)
        setPipWindow(w)
        queueMicrotask(() => {
          try {
            w.focus()
          } catch {
            /* ignore */
          }
        })
      })
      .catch(() => {
        setPipToast(t('pipOpenFailed'))
      })
  }, [pipWindow, closePip, t])

  const pipButton = supported ? (
    <button
      type="button"
      onClick={togglePip}
      className="rounded-xl p-2 text-[#007AFF] active:opacity-50 dark:text-[#0A84FF]"
      aria-label={pipWindow ? t('pipClose') : t('pipOpen')}
      title={pipWindow ? t('pipClose') : t('pipOpen')}
    >
      <PictureInPicture2 className="h-[22px] w-[22px]" strokeWidth={2.2} />
    </button>
  ) : null

  const surfaceKey = pipWindow ? 1 : 0

  const body = (
    <PipKeyboardSurfaceKeyContext.Provider value={supported ? surfaceKey : 0}>
      {supported ? (
        <div className="mx-auto flex w-full max-w-lg flex-col gap-3">
          {pipButton ? (
            <div className="flex shrink-0 justify-end">{pipButton}</div>
          ) : null}
          <div className="min-w-0">{children}</div>
        </div>
      ) : (
        children
      )}
    </PipKeyboardSurfaceKeyContext.Provider>
  )

  if (pipWindow) {
    const shell = (
      <>
        <Toast message={pipToast} onDismiss={() => setPipToast(null)} />
        <div className="box-border min-h-dvh w-full min-w-0 bg-[#f2f2f7] p-3 pb-[calc(1rem+env(safe-area-inset-bottom))] dark:bg-[#000000]">
          {body}
        </div>
      </>
    )
    return createPortal(shell, pipWindow.document.body)
  }

  return (
    <>
      <Toast message={pipToast} onDismiss={() => setPipToast(null)} />
      {body}
    </>
  )
}
