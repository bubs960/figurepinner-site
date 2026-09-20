/**
 * kb-md5.mjs — the KB fingerprint recorded in google-index-bar.generated.json.
 *
 * Line endings are normalised first: .gitattributes forces eol=lf, so a git
 * checkout of the slim KB is LF while matcher's sync_kb.py writes CRLF on
 * Windows. Hashing raw bytes flipped kb_md5 between the two and forced a
 * regen commit after every sync (9/20). Same content, same fingerprint.
 */
import { createHash } from 'node:crypto'

export function kbMd5(text) {
  return createHash('md5').update(text.replace(/\r\n/g, '\n')).digest('hex').toUpperCase()
}
