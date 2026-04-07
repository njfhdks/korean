import { Capacitor } from '@capacitor/core'
import {
  AdMob,
  AdmobConsentDebugGeography,
  AdmobConsentStatus,
  type AdmobConsentRequestOptions,
} from '@capacitor-community/admob'

let consentFlowStarted: Promise<void> | null = null

function consentDebugOptions(): AdmobConsentRequestOptions | undefined {
  if (import.meta.env.VITE_ADMOB_UMP_DEBUG_EEA !== 'true') return undefined
  const raw = import.meta.env.VITE_ADMOB_TEST_DEVICE_IDS ?? ''
  const testDeviceIdentifiers = raw
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
  return {
    debugGeography: AdmobConsentDebugGeography.EEA,
    ...(testDeviceIdentifiers.length ? { testDeviceIdentifiers } : {}),
  }
}

/**
 * 네이티브 앱에서만 실행. 순서: AdMob.initialize → (iOS) ATT → UMP requestConsentInfo → 필요 시 showConsentForm.
 * 개인 맞춤 광고 거부 시 일반(비개인화) 광고는 Google Mobile Ads SDK + UMP가 광고 요청에 반영합니다.
 * @see https://support.google.com/admob/answer/10113207
 */
async function runAdMobConsentFlow(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await AdMob.initialize({
      initializeForTesting:
        import.meta.env.DEV && import.meta.env.VITE_ADMOB_TESTING === 'true',
    })
  } catch (e) {
    console.warn('[WordMap][AdMob] initialize failed', e)
    return
  }

  if (Capacitor.getPlatform() === 'ios') {
    try {
      const tracking = await AdMob.trackingAuthorizationStatus()
      if (tracking.status === 'notDetermined') {
        await AdMob.requestTrackingAuthorization()
      }
    } catch {
      /* ATT 생략 가능 */
    }
  }

  try {
    const opts = consentDebugOptions()
    let info = await AdMob.requestConsentInfo(opts)

    if (info.isConsentFormAvailable) {
      const needForm =
        info.status === AdmobConsentStatus.REQUIRED || !info.canRequestAds
      if (needForm) {
        info = await AdMob.showConsentForm()
      }
    }

    await AdMob.requestConsentInfo(opts)
  } catch (e) {
    console.warn('[WordMap][AdMob] UMP consent flow failed', e)
  }
}

/** 앱 기동 시 1회(모듈 단위로 중복 방지). 웹 빌드에서는 no-op. */
export function initAdMobConsentOnce(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return Promise.resolve()
  if (!consentFlowStarted) {
    consentFlowStarted = runAdMobConsentFlow()
  }
  return consentFlowStarted
}

export async function showAdPrivacyOptionsForm(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    await AdMob.showPrivacyOptionsForm()
  } catch (e) {
    console.warn('[WordMap][AdMob] showPrivacyOptionsForm failed', e)
  }
}
