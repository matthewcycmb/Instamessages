"""Extract CAGE_SCRIPT from lib.rs the way rustc lexes it, into cage.js.

rustc ends an r#"..."# raw string at the FIRST quote-hash, whatever follows.
Cutting at '"#;' instead would silently extract a longer script than the one
that actually compiles - which is how a '#3a3a3c' colour string once passed a
clean `node --check` and still broke the build. Any double quote followed by a
hash inside CAGE_SCRIPT, comments included, closes the string.

Run from anywhere:  python3 wrapper/test/extract.py
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
LIB = HERE.parent / 'src-tauri' / 'src' / 'lib.rs'

src = LIB.read_text()
start = src.index('CAGE_SCRIPT')
a = src.index('r#"', start) + 3
b = src.index('"#', a)          # rustc's rule, not '"#;'
(HERE / 'cage.js').write_text(src[a:b])

tail = src[b:b + 3]
if tail != '"#;':
    print(f'FAIL: raw string ends early at offset {b} (found {tail!r}).')
    print('A double quote followed by a hash inside CAGE_SCRIPT closes it.')
    print('Context:', repr(src[max(a, b - 60):b + 10]))
    sys.exit(1)
print(f'extracted {b - a} bytes, raw string terminator intact')
