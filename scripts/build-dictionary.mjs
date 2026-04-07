/**
 * an-array-of-english-words에서 4~6자 소문자 단어만 추려 public/dictionary.json 생성
 */
import fs from 'fs'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const words = require(join(__dirname, '../node_modules/an-array-of-english-words/index.json'))

const seen = new Set()
const valid = []
for (const w of words) {
  if (typeof w !== 'string') continue
  if (!/^[a-z]+$/.test(w)) continue
  if (w.length < 4 || w.length > 6) continue
  if (seen.has(w)) continue
  seen.add(w)
  valid.push(w)
}
valid.sort()

const out = join(__dirname, '../public/dictionary.json')
fs.mkdirSync(dirname(out), { recursive: true })
fs.writeFileSync(out, JSON.stringify(valid))
console.log('Wrote', valid.length, 'words to public/dictionary.json')
