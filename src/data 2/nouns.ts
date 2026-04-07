/**
 * 사전·추첨은 `wordCheck`의 BASIC_NOUNS_100 단일 소스 사용
 */
export {
  BASIC_NOUNS_100,
  wordCheck,
  pickRandomNounFromList as pickRandomNoun,
  countSyllables as syllableLength,
  SKIP_DICTIONARY_VALIDATION,
  assembledMatchesJamo,
} from '../lib/wordCheck'
