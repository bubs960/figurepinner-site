# Adopt unified SiteHeader across all public pages.
# Anchored string-slice patches (no Edit tool). CRLF preserved: we slice the
# original text and insert ASCII-only replacements; inserted lines use the
# file's own newline flavor. Idempotent: files already importing SiteHeader
# are skipped, so the script can re-run after a partial failure.
import re
import sys

ROOT = r'C:\Users\bubs9\figurepinner-site\src\app'

def read(p):
    with open(p, 'rb') as f:
        return f.read().decode('utf-8')

def write(p, s):
    with open(p, 'wb') as f:
        f.write(s.encode('utf-8'))

def nl_of(text):
    return '\r\n' if '\r\n' in text else '\n'

def insert_after_last_import(text, stmt):
    nl = nl_of(text)
    head = text[:8000]
    # \r?$ — plain $ does not match before \r in CRLF files
    ms = list(re.finditer(r"(?m)^(import [^\r\n]*?|\} from [^\r\n]*?)\r?$", head))
    if ms:
        pos = ms[-1].end()
        return text[:pos] + nl + stmt + text[pos:]
    m = re.search(r"(?m)^'use client'[^\r\n]*?\r?$", head)
    if m:
        pos = m.end()
        return text[:pos] + nl + stmt + text[pos:]
    return stmt + nl + text  # no imports at all (loading skeletons)

def replace_nav_block(text, start_anchor, replacement, end_anchor='</nav>'):
    i = text.index(start_anchor)
    # extend back to start of line so the replacement supplies its own indent
    while i > 0 and text[i-1] in ' \t':
        i -= 1
    j = text.index(end_anchor, i) + len(end_anchor)
    return text[:i] + replacement + text[j:]

def remove_line(text, substr):
    i = text.index(substr)
    a = text.rfind('\n', 0, i) + 1
    b = text.index('\n', i) + 1
    return text[:a] + text[b:]

IMPORT_ALIAS = "import SiteHeader from '@/app/components/SiteHeader'"

done = []
skipped = []

def patch(relpath, fn):
    p = ROOT + relpath
    t = read(p)
    if 'SiteHeader' in t:
        skipped.append(relpath)
        return
    t = fn(t)
    write(p, t)
    done.append(relpath)

# ---- 1. home page.tsx -------------------------------------------------------
def patch_home(t):
    t = insert_after_last_import(t, "import SiteHeader from './components/SiteHeader'")
    t = replace_nav_block(t, '<nav className="fp-home-nav"', '      <SiteHeader />')
    # drop the nav CSS block (.fp-home-nav ... .fp-home-join)
    i = t.index('.fp-home-nav {')
    while i > 0 and t[i-1] in ' \t':
        i -= 1
    j = t.index('color: #09090f !important;')
    j = t.index('}', j) + 1
    j = t.index('\n', j) + 1
    t = t[:i] + t[j:]
    for frag in [
        '.fp-home-nav-links { display: none; }',
        '.fp-home-nav { padding: 0 14px; }',
        '.fp-home-brand span:last-child,',
        '.fp-home-nav-actions a:first-child { display: none; }',
        '.fp-home-join { padding: 8px 10px; }',
    ]:
        t = remove_line(t, frag)
    assert '.fp-home-nav' not in t and '.fp-home-join' not in t and '.fp-home-brand' not in t
    return t
patch(r'\page.tsx', patch_home)

# ---- 2. [genre]/page.tsx ------------------------------------------------------
def patch_genre(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    return replace_nav_block(t, '{/* Nav */}', '      <SiteHeader />')
patch(r'\[genre]\page.tsx', patch_genre)

# ---- 3. [genre]/[line]/page.tsx ------------------------------------------------
def patch_line(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    return replace_nav_block(
        t, '{/* ── Nav ── */}',
        '      <SiteHeader crumbs={[{ label: genreName, href: `/${genre}` }, { label: lineName }]} />')
patch(r'\[genre]\[line]\page.tsx', patch_line)

# ---- 4. FigureDetailContent.tsx -------------------------------------------------
def patch_figure(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    nl = nl_of(t)
    repl = nl.join([
        '      <SiteHeader crumbs={[',
        '        { label: prettifySlug(genre), href: `/${genre}` },',
        '        { label: line, href: `/${genre}/${local.product_line}` },',
        '        { label: displayName },',
        '      ]} />',
    ])
    t = replace_nav_block(t, '{/* ── Nav ─', repl)
    t2 = re.sub(r"\r?\nfunction Chevron\(\) \{[\s\S]*?\r?\n\}\r?\n", nl, t, count=1)
    assert t2 != t, 'Chevron removal did not match'
    assert 'Chevron' not in t2, 'Chevron still referenced'
    return t2
patch(r'\figure\[figure_id]\_components\FigureDetailContent.tsx', patch_figure)

# ---- 5. search/page.tsx ----------------------------------------------------------
def patch_search(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    return replace_nav_block(t, '{/* Nav bar — minimal', '      <SiteHeader />')
patch(r'\search\page.tsx', patch_search)

# ---- 6+. simple {/* Nav */} pages -------------------------------------------------
SIMPLE = [
    (r'\guides\page.tsx', '      <SiteHeader />'),
    (r'\guides\[slug]\page.tsx',
     "      <SiteHeader crumbs={[{ label: 'Guides', href: '/guides' }, { label: article.title }]} />"),
    (r'\about\page.tsx', '      <SiteHeader />'),
    (r'\methodology\page.tsx', '      <SiteHeader />'),
    (r'\privacy\page.tsx', '      <SiteHeader />'),
    (r'\terms\page.tsx', '      <SiteHeader />'),
    (r'\scan\page.tsx', '      <SiteHeader />'),
    (r'\not-found.tsx', '      <SiteHeader />'),
    (r'\alerts\unsubscribed\page.tsx', '      <SiteHeader />'),
    (r'\figure\[figure_id]\loading.tsx', '      <SiteHeader />'),
    (r'\[genre]\[line]\[slug]\loading.tsx', '      <SiteHeader />'),
]
def make_simple(repl):
    def fn(t):
        t = insert_after_last_import(t, IMPORT_ALIAS)
        return replace_nav_block(t, '{/* Nav */}', repl)
    return fn
for rel, repl in SIMPLE:
    patch(rel, make_simple(repl))

# ---- [genre]/loading.tsx (different comment) ---------------------------------------
def patch_genre_loading(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    return replace_nav_block(t, '{/* Nav skeleton */}', '      <SiteHeader />')
patch(r'\[genre]\loading.tsx', patch_genre_loading)

# ---- news/page.tsx — ADD header (was headerless) ------------------------------------
def patch_news(t):
    t = insert_after_last_import(t, IMPORT_ALIAS)
    nl = nl_of(t)
    m = re.search(
        r"<main style=\{\{\s*\r?\n\s*background: 'var\(--bg\)', minHeight: '100vh', color: 'var\(--text\)',\s*\r?\n\s*fontFamily: 'var\(--font-body\)',\s*\r?\n\s*\}\}>",
        t)
    if not m:
        raise SystemExit('news main anchor not found')
    return t[:m.end()] + nl + '      <SiteHeader />' + t[m.end():]
patch(r'\news\page.tsx', patch_news)

# ---- verify ---------------------------------------------------------------------------
ok = True
for rel in done + skipped:
    t = read(ROOT + rel)
    if 'SiteHeader' not in t:
        print('MISSING SiteHeader: ' + rel)
        ok = False
    tail = t[-30:].strip()
    if not (tail.endswith('}') or tail.endswith(')') or tail.endswith(';')):
        print('SUSPECT TAIL: ' + rel + ' -> ' + repr(t[-30:]))
        ok = False
print('patched %d, skipped(already) %d, verify %s'
      % (len(done), len(skipped), 'OK' if ok else 'FAILED'))
for rel in done:
    print('  + ' + rel)
sys.exit(0 if ok else 1)
