# Myszkowski Byte Cipher

[![Tests](https://img.shields.io/badge/tests-Node.js%2018%2B-339933?logo=node.js&logoColor=white)](./tests/test.js)
[![License](https://img.shields.io/badge/license-MIT-blue?logo=github)](./LICENSE)
[![Open source](https://img.shields.io/badge/open--source-contributions-welcome-0fa3b1?logo=github)](https://github.com/PVegananda/myszkowski-byte-cipher)

A browser-based research prototype that applies a rolling-key Myszkowski
transposition to bytes. It can process arbitrary byte data, including PDF and
Office files, without assuming that the input is text.

> **Important:** This is an educational transposition cipher, not a replacement
> for AES-GCM, ChaCha20-Poly1305, or another authenticated encryption scheme.
> Do not use it to protect confidential data.

## Features

- Myszkowski column ordering with repeated-key characters handled correctly.
- Optional rolling key: the key rotates once for each block.
- Optional low-hex-nibble transform:
  - add `9` modulo 16; or
  - add binary `0111` (decimal 7) modulo 16.
- A versioned 16-byte header records the mode, row count, original length, and
  CRC32. Header and payload lengths are checked before allocation and decoding.
- Runs locally in a browser with no server-side upload.
- Built-in timing and repeated-block measurements for reproducible paper data.

The nibble transform changes the low four bits of each byte after transposition.
It is reversible obfuscation, not cryptographic confusion: the selected offset
is stored in the header and does not add key material.

## Run locally

Open `index.html` directly, or serve this directory with any static web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The project is also suitable for GitHub Pages
or Cloudflare Pages.

Run the automated tests with Node.js 18 or newer:

```bash
node tests/test.js
```

## Algorithm outline

1. The key is ranked alphabetically; equal characters receive the same rank.
2. Input is split into `key length × rows` byte blocks and zero-padded only in
   the final block.
3. Unique-ranked columns are read top-to-bottom, while equal-ranked columns
   are read row-by-row, as in Myszkowski transposition.
4. With rolling mode, the key rotates left by the block index modulo the key
   length.
5. The optional low-nibble offset is applied modulo 16.
6. Decryption reverses these steps and verifies the original length and CRC32.

## Research limitations

- Transposition preserves byte frequencies and is vulnerable to structural and
  known-plaintext analysis.
- A rolling schedule repeats after the key length in blocks.
- CRC32 detects accidental corruption but is not authentication and is
  vulnerable to intentional modification.
- The header is not encrypted or authenticated.
- The browser implementation is intentionally bounded to a 16 MiB block and a
  32-bit original length for predictable memory use.

These limitations should be stated explicitly in any paper. Security claims
should be limited to reversible transformation, integrity-error detection, and
the measured experimental behavior.

## Project layout

| Path | Purpose |
|---|---|
| `index.html` | Static user interface |
| `css/style.css` | Responsive light/dark styling |
| `js/cipher.js` | Key schedule, transposition, nibble transform |
| `js/format.js` | Versioned `.mysz` header |
| `js/utils.js` | CRC32, hex parsing, SHA-256, downloads |
| `js/analysis.js` | Timing and repeated-block measurements |
| `js/app.js` | Browser event handlers |
| `tests/test.js` | Regression and validation tests |

Contributions and extensions are welcome in the
[public repository](https://github.com/PVegananda/myszkowski-byte-cipher).
