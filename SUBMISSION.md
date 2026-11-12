# Submission Information

**Project:** Myszkowski Byte Cipher
**Author:** PVegananda
**License:** MIT

## Links

| Item | URL |
|---|---|
| Live website (application) | https://myszkowski-byte-cipher.pages.dev/ |
| Research article and documentation | https://myszkowski-byte-cipher.pages.dev/paper.html |
| Source code (GitHub) | https://github.com/PVegananda/myszkowski-byte-cipher |
| Reference publication (JIKTEKS) | https://doi.org/10.70404/jikteks.v3i03.322 |

## Tech stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements, ARIA tabs, schema.org JSON-LD) |
| Styling | CSS3, vanilla (custom properties, Grid, Flexbox, `color-mix()`, dark mode, print styles) |
| Logic | JavaScript (ES2020, vanilla, no framework, no dependencies) |
| Browser APIs | Web Crypto (SHA-256), File API, Blob, Clipboard, TextEncoder/TextDecoder, localStorage, IntersectionObserver |
| Testing | Node.js 18+ (built-in `assert`), 12 regression tests: `node tests/test.js` |
| Version control | Git, GitHub |
| Hosting | Cloudflare Pages (static hosting, Wrangler CLI), security headers via `_headers` |
| Documentation | Markdown, DOCX |

## Algorithm

Byte-oriented Myszkowski transposition with an optional rolling-key schedule, an optional reversible low-hex-nibble transform, and a versioned 16-byte `.mysz` container (magic, version, flags, rows, original length, CRC32).

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
node tests/test.js            # run the tests
```

## Important

This is an educational transposition cipher, not authenticated encryption. All processing happens locally in the browser and no network requests are made.
