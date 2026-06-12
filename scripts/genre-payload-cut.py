# S20 genre-page payload cut: first-line-only serialization.
# Anchored slice patches on src/app/[genre]/page.tsx (no Edit tool).
import sys

P = r'C:\Users\bubs9\figurepinner-site\src\app\[genre]\page.tsx'

with open(P, 'rb') as f:
    t = f.read().decode('utf-8')

NL = '\r\n' if '\r\n' in t else '\n'

def cut(text, start_anchor, end_anchor):
    """Remove from start_anchor's line start through end of end_anchor's line."""
    i = text.index(start_anchor)
    while i > 0 and text[i-1] in ' \t':
        i -= 1
    j = text.index(end_anchor, i) + len(end_anchor)
    j = text.index('\n', j) + 1
    return text[:i], text[j:]

# 1. imports
old_imp = "import { getFiguresByFandom, figureUrl, prettyFigureUrl, type KBFigure } from '@/data/kb'"
new_imp = ("import { prettyFigureUrl, type KBFigure } from '@/data/kb'" + NL +
           "import { figuresForGenre, groupAndSortLines, toFigureRow, cardName, MAX_PER_LINE } from '@/lib/genreFigures'")
assert old_imp in t
t = t.replace(old_imp, new_imp, 1)

# 2. drop the local SLUG_TO_FANDOM..figuresForGenre block (now in the lib)
head, tail = cut(t, '// URL slug → KB fandom slug mapping',
                 'return getFiguresByFandom(getFandom(genre))')
# cut() stopped at the return line; also eat the closing brace line
tail = tail[tail.index('\n') + 1:] if tail.lstrip().startswith('}') else tail
t = head + tail

# 3. drop local MAX_PER_LINE (lib provides it)
i = t.index('const MAX_PER_LINE = 60')
a = t.rfind('\n', 0, i) + 1
b = t.index('\n', i) + 1
t = t[:a] + t[b:]

# 4. drop local cardName (lib provides it)
head, tail = cut(t, 'function cardName(f: KBFigure): string {',
                 'return `${base}${variant}`')
tail = tail[tail.index('\n') + 1:] if tail.lstrip().startswith('}') else tail
t = head + tail

# 5. replace buildLineData with the first-line-only version
head, tail = cut(t, '/** Build serialized LineData[] from raw KB figures',
                 'return { lines, totalCount: figures.length }')
tail = tail[tail.index('\n') + 1:] if tail.lstrip().startswith('}') else tail
new_fn = NL.join([
    '/** Build LineData[] from raw KB figures — server-only. Only the first',
    ' *  (default-open) line ships its figure rows; the accordion fetches the',
    ' *  rest from /api/genre-line-figures on open (S20 payload cut — before',
    ' *  this, /wrestling pushed 2,115 cards through the flight payload). */',
    'function buildLineData(figures: KBFigure[]) {',
    '  const groups = groupAndSortLines(figures)',
    '  const lines: LineData[] = groups.map(([slug, group], i) => ({',
    '    slug,',
    '    displayName: formatLineName(slug),',
    '    totalCount:  group.length,',
    '    figureCount: Math.min(group.length, MAX_PER_LINE),',
    '    figures:     i === 0 ? group.slice(0, MAX_PER_LINE).map(toFigureRow) : null,',
    '  }))',
    '  return { lines, groups, totalCount: figures.length }',
    '}',
    '',
])
t = head + new_fn + tail

# 6. destructure groups in the page body
old_call = 'const { lines, totalCount: totalFigures } = buildLineData(figures)'
assert old_call in t
t = t.replace(old_call,
              'const { lines, groups, totalCount: totalFigures } = buildLineData(figures)', 1)

# 7. JSON-LD builds from raw groups now (lines no longer carry every line's rows)
i = t.index('itemListElement: lines.slice(0, 5).flatMap(line =>')
while i > 0 and t[i-1] in ' \t':
    i -= 1
j = t.index('}))', i)
j = t.index('),', j) + len('),')
j = t.index('\n', j) + 1
new_ld = NL.join([
    '    itemListElement: groups.slice(0, 5).flatMap(([, group]) =>',
    '      group.slice(0, 10).map((f, i) => ({',
    "        '@type': 'ListItem',",
    '        position: i + 1,',
    '        url: `https://figurepinner.com${prettyFigureUrl(f)}`,',
    '        name: cardName(f),',
    '      }))',
    '    ),',
    '',
])
t = t[:i] + new_ld + t[j:]

with open(P, 'wb') as f:
    f.write(t.encode('utf-8'))

tail30 = t[-30:].strip()
ok = tail30.endswith('}') or tail30.endswith(')') or tail30.endswith(';')
print('patched, tail ok:', ok)
sys.exit(0 if ok else 1)
