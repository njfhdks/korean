export type Locale = 'ko' | 'en'

/** 브라우저/앱 언어 → 한국어 우선, 그 외 영어 */
export function detectDeviceLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const list = [...(navigator.languages ?? []), navigator.language]
  for (const raw of list) {
    const low = raw.toLowerCase()
    if (low.startsWith('ko')) return 'ko'
  }
  return 'en'
}

const S = {
  tabDaily: { ko: '데일리', en: 'Daily' },
  tabWordMap: { ko: '워드맵', en: 'Word Map' },
  streak: { ko: '연속', en: 'Streak' },
  best: { ko: '최고', en: 'Best' },
  dailyLengthBefore: { ko: '오늘의 길이 ', en: "Today's length: " },
  dailyLengthAfter: { ko: ' 글자', en: ' letters' },
  dailyDoneToday: {
    ko: '오늘 데일리는 이미 진행했어요. 내일 다시 도전해 보세요.',
    en: "You've already played today's daily. Come back tomorrow!",
  },
  play: { ko: '플레이', en: 'Play' },
  continue: { ko: '이어하기', en: 'Continue' },
  dailyToolbar: { ko: '데일리 · {len}글자', en: 'Daily · {len} letters' },
  ariaHomeHub: { ko: '허브로', en: 'Home' },
  ariaThemeLight: { ko: '라이트 모드로 전환', en: 'Switch to light mode' },
  ariaThemeDark: { ko: '다크 모드로 전환', en: 'Switch to dark mode' },
  ariaPrevMonth: { ko: '이전 달', en: 'Previous month' },
  ariaNextMonth: { ko: '다음 달', en: 'Next month' },
  adLabel: { ko: '광고', en: 'AD' },
  fillLetters: { ko: '글자를 모두 채우세요', en: 'Fill all letters first' },
  lettersOnly: { ko: '영문만 입력할 수 있어요', en: 'Letters only' },
  notInList: { ko: '단어 목록에 없어요', en: 'Not in word list' },
  dictError: {
    ko: '단어를 확인하지 못했어요. 다시 시도해 주세요.',
    en: 'Could not verify word. Please try again.',
  },
  confirmLeaveGame: {
    ko: '진행 중인 게임이 있습니다. 허브로 나가시겠습니까?',
    en: 'A game is in progress. Leave for the hub?',
  },
  winMessage: { ko: '정답: {word}', en: 'You got it: {word}' },
  answerLabel: { ko: '정답', en: 'Answer' },
  loseHint: {
    ko: '재도전으로 같은 조건에서 새 단어를 받거나, 홈으로 나갈 수 있어요.',
    en: 'Retry for a new word under the same rules, or go home.',
  },
  retry: { ko: '재도전', en: 'Retry' },
  home: { ko: '홈', en: 'Home' },
  noAttemptsLeft: {
    ko: '오늘 남은 도전이 없습니다',
    en: 'No daily attempts left',
  },
  checking: { ko: '확인 중…', en: 'Checking…' },
  enter: { ko: '입력', en: 'Enter' },
  verifyingDict: {
    ko: '사전으로 확인하는 중…',
    en: 'Verifying with dictionary…',
  },
  typeNForEnter: {
    ko: '{n}글자를 입력하면 입력 버튼이 켜져요',
    en: 'Type {n} letters to enable Enter',
  },
  outOfGuesses: { ko: '기회를 모두 썼어요', en: "You're out of guesses" },
  watchAdHint: {
    ko: '광고를 보면 +3회를 더 받을 수 있어요. (최대 9회)',
    en: 'Watch an ad for +3 more tries (up to 9 total).',
  },
  watchAd: { ko: '광고 보기 (+3)', en: 'Watch ad (+3)' },
  endWithoutAd: { ko: '광고 없이 끝내기', en: 'End without ad' },
  randomEndless: {
    ko: '도트 맵 전부 + 미러 + 인버트를 클리어했습니다. 랜덤 맵이 이어집니다. 새 도트 맵은 추후 업데이트로 더해질 수 있어요.',
    en: 'All dot maps, mirror, and invert cleared. Random maps continue. More dot maps may arrive in a future update.',
  },
  progress: { ko: '진행', en: 'Progress' },
  mapOrdinal: { ko: '맵', en: 'Map' },
  playStage: { ko: '플레이 (스테이지 {n})', en: 'Play (Stage {n})' },
  prev: { ko: '이전', en: 'Prev' },
  next: { ko: '다음', en: 'Next' },
  interstitialLoading: { ko: '전면 광고 로딩 중…', en: 'Loading fullscreen ad…' },
  interstitialWait: { ko: '잠시만 기다려 주세요.', en: 'Please wait a moment.' },
  loadingBitmap: { ko: '도트 비트맵 불러오는 중…', en: 'Loading pixel bitmaps…' },
  bitmapManifest: { ko: 'public/bitmap/manifest.json', en: 'public/bitmap/manifest.json' },
  bitmapEmptyTitle: {
    ko: 'bitmap 폴더에 도트 PNG를 넣어 주세요',
    en: 'Add dot PNG files to the bitmap folder',
  },
  bitmapStep1: {
    ko: 'public/bitmap/ 폴더에 도트 PNG를 저장하세요 (1픽셀 = 1칸)',
    en: 'Save dot PNGs in public/bitmap/ (1 pixel = 1 cell).',
  },
  bitmapStep2: {
    ko: '같은 폴더의 manifest.json에 맵 목록을 적으세요.',
    en: 'List your maps in manifest.json in that folder.',
  },
  bitmapEmptyFoot: {
    ko: '빈 칸은 투명, 흰색, 또는 마젠타(#ff00ff) 배경으로 두면 됩니다.',
    en: 'Empty cells: transparent, white, or magenta (#ff00ff) background.',
  },
  adventureWinBonusRule: {
    ko: '스테이지를 연속으로 두 번 클리어하면, 보너스로 스테이지 한 칸이 더 클리어됩니다. (두 판으로 세 칸 진행)',
    en: 'Clear two stages in a row to earn a bonus: one extra stage clears. (Two wins → three stages of progress.)',
  },
  adventureWinBonusLoseReset: {
    ko: '패배하면 연속 클리어 수는 초기화됩니다.',
    en: 'A loss resets your consecutive clear count.',
  },
  adventureWinBonusNext: {
    ko: '다음 클리어 시 보너스 스테이지가 함께 열립니다.',
    en: 'Your next clear will also open a bonus stage.',
  },
  mapToolbar: {
    ko: '스테이지 {n} · {len}글자',
    en: 'Stage {n} · {len} letters',
  },
  mapHeartsAria: { ko: '플레이 하트', en: 'Play hearts' },
  mapHeartsNext: {
    ko: '다음 하트까지 {time}',
    en: 'Next heart in {time}',
  },
  mapHeartsRule: {
    ko: '실패 시 1개 소모',
    en: 'Lose 1 heart per failure',
  },
  mapNoHeartsPlay: {
    ko: '하트가 없어요. 잠시 후 회복되면 다시 플레이할 수 있어요.',
    en: 'No hearts left. Play again after one refills.',
  },
  pipOpen: {
    ko: '작은 창에서 플레이 (Picture-in-Picture)',
    en: 'Play in floating window (Picture-in-Picture)',
  },
  pipClose: { ko: '작은 창 닫기', en: 'Close floating window' },
  pipUnavailable: {
    ko: '이 환경에서는 작은 창을 쓸 수 없어요. Chrome 데스크톱 최신 버전·HTTPS(또는 localhost)에서 시도해 주세요.',
    en: 'Floating window needs Chrome desktop (recent), HTTPS or localhost.',
  },
  pipOpenFailed: {
    ko: '작은 창을 열지 못했어요. 다른 탭에서 열려 있거나 브라우저 설정을 확인해 주세요.',
    en: 'Could not open the floating window. Try again from a user click.',
  },
  wordMasterSuffix: {
    ko: ' · 워드 마스터',
    en: ' · Word Master',
  },
  wordMasterTitle: { ko: '워드 마스터', en: 'Word Master' },
  wordMasterDesc: {
    ko: '모든 단어를 한 번씩 본 뒤부터 6글자 위주로 더 어렵게 이어집니다.',
    en: 'After every word has appeared once, stages skew toward 6 letters.',
  },
  stageAriaCleared: {
    ko: '스테이지 {n} 클리어',
    en: 'Stage {n} cleared',
  },
  stageAriaCurrent: {
    ko: '스테이지 {n} 진행 가능',
    en: 'Stage {n} ready to play',
  },
  stageAriaLocked: {
    ko: '스테이지 {n} 잠금',
    en: 'Stage {n} locked',
  },
  tileTitleLocked: {
    ko: '이전 스테이지를 먼저 클리어하세요',
    en: 'Clear previous stages first',
  },
  tileTitleCurrent: { ko: '다음 플레이 대기', en: 'Next to play' },
  tileTitleDone: { ko: '완료 {n}', en: 'Done {n}' },
  adSlotAria: { ko: '광고 영역', en: 'Advertisement' },
  settings: { ko: '설정', en: 'Settings' },
  settingsClose: { ko: '닫기', en: 'Close' },
  settingsPrivacy: {
    ko: '개인정보 처리방침',
    en: 'Privacy policy',
  },
  settingsAdChoices: {
    ko: '광고·개인정보 맞춤 설정',
    en: 'Ad & privacy choices',
  },
  settingsSfxVolume: {
    ko: '효과음 (초록 타일)',
    en: 'Sound effects (green tiles)',
  },
  settingsSfxMute: { ko: '끔', en: 'Off' },
  adventureMoreMapsLater: {
    ko: '맨 마지막 맵까지 클리어하셨어요. 새 도트 맵은 추후 업데이트로 더해질 예정이에요.',
    en: "You've cleared the final map. More dot maps may arrive in a future update.",
  },
  webAdvLimitTitle: {
    ko: '웹에서는 여기까지 플레이할 수 있어요',
    en: 'Web play limit reached',
  },
  webAdvLimitBody: {
    ko: '구글 플레이·앱 스토어에서 Word Map을 다운로드한 뒤 이어서 플레이해 보세요!',
    en: 'Download Word Map from Google Play or the App Store to keep playing!',
  },
  webAdvPlayStore: { ko: 'Google Play', en: 'Google Play' },
  webAdvAppStore: { ko: 'App Store', en: 'App Store' },
  privacyBack: { ko: '앱으로 돌아가기', en: 'Back to app' },
  privacyPageTitle: {
    ko: '개인정보 처리방침',
    en: 'Privacy Policy',
  },
  privacyEffective: {
    ko: '시행일: 2026년 4월 6일',
    en: 'Effective: April 6, 2026',
  },
} as const

export type I18nKey = keyof typeof S

export function t(
  locale: Locale,
  key: I18nKey,
  vars?: Record<string, string | number>,
): string {
  let out: string = S[key][locale]
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      out = out.replaceAll(`{${k}}`, String(v))
    }
  }
  return out
}
