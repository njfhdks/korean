import Hangul from 'hangul-js'
import { hasForbiddenJamoInWord } from './jamoWordle'

/**
 * 개발/테스트용: true로 바꾸면 사전 매칭 없이 조합만 성공하면 제출 허용
 * (배포 전 반드시 false 권장)
 */
export const SKIP_DICTIONARY_VALIDATION = false

/**
 * 국립국어원 기초 어휘 등 참고한 명사 100개
 * 쌍자음(ㄲ,ㄸ,ㅃ,ㅆ,ㅉ) 및 ㅒ,ㅖ 미포함 단어만 선별
 */
export const BASIC_NOUNS_100 = [
  // 2음절 (40)
  '하늘',
  '바다',
  '나무',
  '학교',
  '구름',
  '사과',
  '우유',
  '가방',
  '도로',
  '버스',
  '기차',
  '친구',
  '가족',
  '형제',
  '부모',
  '아침',
  '저녁',
  '여름',
  '겨울',
  '별명',
  '미소',
  '노래',
  '음악',
  '그림',
  '소설',
  '고기',
  '국수',
  '모자',
  '바지',
  '소파',
  '안경',
  '가위',
  '수건',
  '라면',
  '도시',
  '나라',
  '문장',
  '시계',
  '연필',
  '의자',
  // 3음절 (35)
  '도서관',
  '운동장',
  '체육관',
  '컴퓨터',
  '노트북',
  '냉장고',
  '세탁기',
  '자동차',
  '자전거',
  '지하철',
  '비행기',
  '우주선',
  '지구본',
  '한국어',
  '미술관',
  '박물관',
  '식물원',
  '동물원',
  '놀이터',
  '유치원',
  '대학교',
  '병원',
  '약국',
  '서점',
  '문구점',
  '백화점',
  '편의점',
  '오렌지',
  '바나나',
  '토마토',
  '수영복',
  '손수건',
  '목도리',
  '장갑',
  '양말',
  // 4음절 (25)
  '초등학교',
  '고등학교',
  '슈퍼마켓',
  '지하철역',
  '놀이공원',
  '동물병원',
  '한글타자',
  '컴퓨터실',
  '과학실험',
  '수학여행',
  '영어단어',
  '국어사전',
  '독서토론',
  '미술시간',
  '체육대회',
  '방학숙제',
  '겨울방학',
  '여름방학',
  '가을운동',
  '봄나들이',
  '배드민턴',
  '테니스장',
  '오늘저녁',
  '내일아침',
  '아침햇살',
] as const

function nfc(s: string): string {
  return s.normalize('NFC').trim()
}

/** 한글 음절 문자 개수(공백 제외) */
export function countSyllables(word: string): number {
  return [...word.replace(/\s/g, '')].length
}

function buildVerifiedSets() {
  const s2 = new Set<string>()
  const s3 = new Set<string>()
  const s4 = new Set<string>()

  for (const w of BASIC_NOUNS_100) {
    if (hasForbiddenJamoInWord(w)) continue
    const key = nfc(w)
    const n = countSyllables(key)
    if (n === 2) s2.add(key)
    else if (n === 3) s3.add(key)
    else if (n === 4) s4.add(key)
  }
  return { s2, s3, s4 }
}

const { s2: WORD_SET_2, s3: WORD_SET_3, s4: WORD_SET_4 } = buildVerifiedSets()

export function getWordSetForSyllables(syllables: 2 | 3 | 4): Set<string> {
  if (syllables === 2) return WORD_SET_2
  if (syllables === 3) return WORD_SET_3
  return WORD_SET_4
}

/**
 * assemble 결과가 사전에 있는지 — NFC 정규화 후 비교
 */
export function wordCheck(
  assembledRaw: string,
  expectedSyllables: 2 | 3 | 4,
): boolean {
  if (SKIP_DICTIONARY_VALIDATION) return true

  const assembled = nfc(assembledRaw)
  if (!assembled) return false

  if (countSyllables(assembled) !== expectedSyllables) return false

  const set = getWordSetForSyllables(expectedSyllables)
  if (set.has(assembled)) return true

  return false
}

/** assemble 결과와 입력 자모가 역으로 일치하는지(조합 깨짐 방지) */
export function assembledMatchesJamo(
  assembled: string,
  jamoRow: readonly string[],
): boolean {
  let back: string[]
  try {
    back = Hangul.disassemble(assembled) as string[]
  } catch {
    return false
  }
  if (back.length !== jamoRow.length) return false
  for (let i = 0; i < back.length; i++) {
    if (back[i] !== jamoRow[i]) return false
  }
  return true
}

export function pickRandomNounFromList(
  syllables: 2 | 3 | 4,
  exclude?: string,
): string {
  const set = getWordSetForSyllables(syllables)
  let pool = [...set].filter((w) => w !== (exclude ? nfc(exclude) : ''))
  if (!pool.length) pool = [...set]
  return pool[Math.floor(Math.random() * pool.length)]!
}
