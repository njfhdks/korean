const BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en/'

export type DictionaryLookupResult = 'ok' | 'not_found' | 'error'

/**
 * Free Dictionary API — 200이면 실제 등재 단어, 404면 없음.
 * @see https://dictionaryapi.dev/
 */
export async function lookupEnglishWord(
  word: string,
): Promise<DictionaryLookupResult> {
  const w = word.toLowerCase().trim()
  if (!/^[a-z]+$/.test(w)) return 'not_found'

  const url = `${BASE}${encodeURIComponent(w)}`

  try {
    const res = await fetch(url)
    if (res.status === 404) return 'not_found'
    if (!res.ok) return 'error'
    return 'ok'
  } catch {
    return 'error'
  }
}
