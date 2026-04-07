/** 스토어 실제 앱 URL이 있으면 .env에 넣고, 없으면 검색 페이지로 연결 */
export const PLAY_STORE_URL =
  import.meta.env.VITE_PLAY_STORE_URL ||
  'https://play.google.com/store/search?q=Word+Map&c=apps'

export const APP_STORE_URL =
  import.meta.env.VITE_APP_STORE_URL ||
  'https://apps.apple.com/search?term=word%20map'
