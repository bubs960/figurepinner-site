import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { kbMd5 } from '../scripts/lib/kb-md5.mjs'

// 9/20: the index-bar kb_md5 flipped between a git checkout (LF, .gitattributes
// eol=lf) and matcher's Windows write (CRLF), forcing a regen commit after every
// KB sync. The fingerprint must be the same for the same content.
test('kbMd5 is identical for LF and CRLF copies of the same text', () => {
  assert.equal(kbMd5('a\r\nb\r\nc'), kbMd5('a\nb\nc'))
})

test('kbMd5 still changes when the content changes', () => {
  assert.notEqual(kbMd5('a\nb'), kbMd5('a\nc'))
})

test('kbMd5 is 32 uppercase hex chars', () => {
  assert.match(kbMd5('x'), /^[0-9A-F]{32}$/)
})

test('the real slim KB fingerprints the same as LF or CRLF', () => {
  const kb = readFileSync(new URL('../src/data/figures-reference-v2.slim.js', import.meta.url), 'utf8')
  const crlf = kb.replace(/\r?\n/g, '\r\n')
  assert.equal(kbMd5(crlf), kbMd5(kb))
})
