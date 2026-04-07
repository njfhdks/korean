import type { Locale } from '../lib/i18n'

export type PrivacySection = { heading: string; paragraphs: string[] }

const KO: PrivacySection[] = [
  {
    heading: '총칙',
    paragraphs: [
      'WordMap(이하 “앱”)은 이용자의 개인정보를 중요하게 여기며, 「개인정보 보호법」 등 대한민국 관련 법령 및 2026년 기준 앱·광고 생태계의 통상적인 준수 관행을 바탕으로 본 처리방침을 안내합니다.',
      '본 방침은 앱을 설치·이용하는 시점부터 적용됩니다.',
    ],
  },
  {
    heading: '수집하는 항목',
    paragraphs: [
      '앱 자체는 회원가입을 요구하지 않으며, 별도로 이름·이메일·전화번호 등 식별 가능한 계정 정보를 수집하지 않습니다. 다만 광고·분석 목적으로 다음 정보가 기기 또는 네트워크를 통해 처리될 수 있습니다.',
    ],
  },
  {
    heading: '항목 상세',
    paragraphs: [
      '• 광고·분석 식별자: 기기 광고 ID(예: Google 광고 ID / GAID, iOS의 경우 광고 식별자 등, OS 정책에 따라 제공되는 범위 내)',
      '• IP 주소: 광고 게재·사기 방지·측정·대략적 지역(국가·광역 단위 등) 관련 처리에 활용될 수 있습니다.',
      '• 앱·기기 관련 정보: OS 버전, 앱 버전, 언어 설정, 화면 크기 등 광고 SDK가 통상 수집하는 기술 정보',
      '앱은 “정밀 위치( GPS )” 권한을 요청하지 않습니다. 다만 Google AdMob 등 광고 SDK는 IP 주소 등을 이용해 대략적인 지역 정보를 파악할 수 있으며, 이는 광고 맞춤·측정·규정 준수 목적에 부합하는 범위에서 이루어질 수 있습니다.',
    ],
  },
  {
    heading: '제3자 제공 및 처리 위탁',
    paragraphs: [
      '광고 표시를 위해 Google LLC의 Google Mobile Ads SDK(AdMob)가 이용자 기기에서 정보를 수집·처리할 수 있습니다. AdMob의 처리 방식은 Google의 개인정보처리방침 및 광고 정책을 따릅니다.',
      '웹 브라우저로 서비스를 이용하는 경우, Google AdSense 등을 통해 광고가 게재될 수 있으며, 이 과정에서 쿠키·광고 식별자·IP 등이 처리될 수 있습니다.',
      '그 밖에 법령에 의거하거나 이용자 동의가 있는 경우에 한해 추가 제공이 있을 수 있습니다.',
    ],
  },
  {
    heading: '이용 목적',
    paragraphs: [
      '• 맞춤형 또는 비맞춤형 광고의 게재 및 측정',
      '• 부정 이용 방지, 서비스 품질 개선, 통계 분석',
    ],
  },
  {
    heading: '이용자의 권리',
    paragraphs: [
      '이용자는 관련 법령이 정하는 바에 따라 개인정보 열람·정정·삭제·처리정지 등을 요청할 수 있습니다.',
      '광고 맞춤에 대한 동의 또는 선택(비맞춤 광고 등)은 기기의 광고 ID 재설정·추적 제한 설정, 앱 내 “설정”의 광고·개인정보 관련 메뉴(UMP 개인정보 옵션), 또는 운영자에게 문의를 통해 조정할 수 있습니다. 유럽경제지역(EEA)·영국 등에서는 앱 실행 시 표시되는 동의창(UMP)에서 선택을 변경할 수 있습니다.',
    ],
  },
  {
    heading: '보관 및 파기',
    paragraphs: [
      '앱이 직접 저장하는 정보는 서비스 제공에 필요한 최소한에 그칩니다. 광고 SDK가 생성·보관하는 데이터의 보관 기간은 각 제공자의 정책에 따릅니다.',
    ],
  },
  {
    heading: '아동',
    paragraphs: [
      '앱은 아동을 주 이용 대상으로 설계하지 않았습니다. 아동 관련 개인정보 처리에 대한 특별한 정책이 필요한 경우 관련 법령을 준수합니다.',
    ],
  },
  {
    heading: '처리방침 변경',
    paragraphs: [
      '법령·서비스 변경에 따라 본 방침을 개정할 수 있으며, 중요한 변경 시 앱 공지 또는 화면 안내 등 합리적인 방법으로 고지합니다.',
    ],
  },
]

const EN: PrivacySection[] = [
  {
    heading: 'Overview',
    paragraphs: [
      'WordMap (“the App”) respects your privacy. This Privacy Policy describes our practices in line with applicable laws and common 2026 expectations for mobile apps that show ads.',
      'It applies from the moment you install or use the App.',
    ],
  },
  {
    heading: 'What we collect',
    paragraphs: [
      'The App does not require sign-up and does not intentionally collect your name, email, or phone number. For advertising and measurement, however, the following may be processed via your device or network:',
    ],
  },
  {
    heading: 'Details',
    paragraphs: [
      '• Advertising / analytics identifiers: device advertising IDs (e.g. Google Advertising ID on Android; Identifier for Advertisers where applicable on iOS, subject to OS policies).',
      '• IP address: may be used for ad delivery, fraud prevention, analytics, and coarse location (e.g. region or country).',
      '• Technical data: OS version, app version, language, display size, and similar data commonly collected by ad SDKs.',
      'We do not request precise (GPS) location permission. Google AdMob and related services may still derive approximate location from IP and similar signals for ads, measurement, and compliance.',
    ],
  },
  {
    heading: 'Third parties',
    paragraphs: [
      'We use Google’s Google Mobile Ads SDK (AdMob), which may collect and process information on your device. Google’s policies govern that processing.',
      'If you use the web version, ads may be served through Google AdSense (or similar), which may process cookies, ad identifiers, IP addresses, and related signals.',
      'Other sharing occurs only where required by law or with your consent.',
    ],
  },
  {
    heading: 'Purposes',
    paragraphs: [
      '• Serving and measuring personalized or non-personalized ads.',
      '• Fraud prevention, service improvement, and analytics.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Depending on your region, you may have rights to access, correct, delete, or restrict processing of personal data.',
      'You can reset advertising IDs, use OS tracking controls, open in-app ad privacy options (User Messaging Platform), or contact us to exercise your choices. In the EEA/UK, the UMP consent dialog lets you update choices.',
    ],
  },
  {
    heading: 'Retention',
    paragraphs: [
      'Data the App stores locally is kept to a minimum. Retention for data handled by ad partners follows their policies.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'The App is not directed primarily to children. Where child-specific rules apply, we follow applicable law.',
    ],
  },
  {
    heading: 'Changes',
    paragraphs: [
      'We may update this Policy. Material changes will be communicated through the App or other reasonable means.',
    ],
  },
]

export function getPrivacySections(locale: Locale): PrivacySection[] {
  return locale === 'ko' ? KO : EN
}
