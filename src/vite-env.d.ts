/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GitHub Pages: `/저장소이름/` */
  readonly VITE_BASE_PATH?: string
  readonly VITE_PLAY_STORE_URL?: string
  readonly VITE_APP_STORE_URL?: string
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_ADSENSE_SLOT?: string
  readonly VITE_ADSENSE_SLOT_SIDEBAR?: string
  readonly VITE_ADMOB_TESTING?: string
  readonly VITE_ADMOB_UMP_DEBUG_EEA?: string
  readonly VITE_ADMOB_TEST_DEVICE_IDS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
