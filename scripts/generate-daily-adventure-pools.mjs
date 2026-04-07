/**
 * 데일리 전용 730단어(4·5·6글자 균등) + 나머지 어드벤처 전용 풀 생성
 * 실행: node scripts/generate-daily-adventure-pools.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const wl = join(root, 'src/data/word_lists')

const list4 = JSON.parse(readFileSync(join(wl, 'word_list_4.json'), 'utf8'))
const list5 = JSON.parse(readFileSync(join(wl, 'word_list_5.json'), 'utf8'))
const list6 = JSON.parse(readFileSync(join(wl, 'word_list_6.json'), 'utf8'))

function norm(arr) {
  return [...new Set(arr.map((w) => String(w).toLowerCase()).filter((w) => /^[a-z]+$/.test(w)))].sort()
}

/** 리스트에서 n개를 인덱스로 고르게 뽑기 (끝점 포함, 중복 없음) */
function pickEvenly(arr, n) {
  const a = [...arr].sort()
  const N = a.length
  if (n <= 0) return []
  if (n >= N) return a
  const out = []
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (N - 1)) / (n - 1))
    out.push(a[idx])
  }
  return [...new Set(out)]
}

const a4 = norm(list4)
const a5 = norm(list5)
const a6 = norm(list6)

const daily4 = pickEvenly(a4, 244)
const daily5 = pickEvenly(a5, 243)
const daily6 = pickEvenly(a6, 243)

const dailySet = new Set([...daily4, ...daily5, ...daily6])
if (dailySet.size !== 730) {
  console.error('Expected 730 unique daily words, got', dailySet.size)
  process.exit(1)
}

function remainder(full, picked) {
  const p = new Set(picked)
  return full.filter((w) => !p.has(w))
}

const adv4 = remainder(a4, daily4)
const adv5 = remainder(a5, daily5)
const adv6 = remainder(a6, daily6)

const dailyOut = { '4': daily4, '5': daily5, '6': daily6 }
const advOut = { '4': adv4, '5': adv5, '6': adv6 }

writeFileSync(
  join(wl, 'daily_pool.json'),
  JSON.stringify(dailyOut, null, 0) + '\n',
  'utf8',
)
writeFileSync(
  join(wl, 'adventure_pool.json'),
  JSON.stringify(advOut, null, 0) + '\n',
  'utf8',
)

console.log(
  'daily:',
  daily4.length + daily5.length + daily6.length,
  '(4:',
  daily4.length,
  '5:',
  daily5.length,
  '6:',
  daily6.length + ')',
)
console.log(
  'adventure:',
  adv4.length + adv5.length + adv6.length,
  '(4:',
  adv4.length,
  '5:',
  adv5.length,
  '6:',
  adv6.length + ')',
)
