<div align="center">
  <img src="./assets/myszkowski-byte-cipher.svg" width="112" alt="Myszkowski Byte Cipher logo">

  <h1>Myszkowski Byte Cipher</h1>

  <p>
    A browser-based research prototype for byte-oriented Myszkowski transposition.
    <br>
    Local processing, rolling keys, and reversible low-nibble experiments.
  </p>

  <p>
    <a href="https://github.com/PVegananda/myszkowski-byte-cipher">
      <img src="https://img.shields.io/badge/repository-public-315BEA?style=for-the-badge&logo=github&logoColor=white" alt="Public repository">
    </a>
    <a href="./tests/test.js">
      <img src="https://img.shields.io/badge/tests-12%20passing-16834B?style=for-the-badge&logo=node.js&logoColor=white" alt="12 tests passing">
    </a>
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-6B4EFF?style=for-the-badge" alt="MIT license">
    </a>
  </p>

  <p>
    <a href="https://github.com/PVegananda/myszkowski-byte-cipher/issues">Issues</a>
    ·
    <a href="https://github.com/PVegananda/myszkowski-byte-cipher">Contribute</a>
    ·
    <a href="./docs/TECHNICAL-DOCUMENTATION.md">Technical documentation</a>
  </p>
</div>

> **Important:** This is an educational transposition cipher, not a replacement
> for AES-GCM, ChaCha20-Poly1305, or another authenticated encryption scheme.
> Do not use it to protect confidential data.

## Overview

Myszkowski Byte Cipher applies a rolling-key Myszkowski transposition to bytes.
It can process arbitrary byte data, including PDF and Office files, without
assuming that the input is text. Everything runs locally in the browser; files
are not uploaded to an application server.

## Features

- Myszkowski column ordering with repeated-key characters handled correctly.
- Optional rolling key: the key rotates once for each block.
- Optional low-hex-nibble transform:
  - add `9` modulo 16; or
  - add binary `0111` (decimal 7) modulo 16.
- A versioned 16-byte header records the mode, row count, original length, and
  CRC32. Header and payload lengths are checked before transformation.
- Browser-based file workflow for arbitrary binary files.
- Built-in timing and repeated-block measurements for reproducible paper data.
- English and Bahasa Indonesia interface with automatic language fallback.

The nibble transform changes the low four bits of each byte after transposition.
It is reversible obfuscation, not cryptographic confusion: the selected offset
is stored in the header and does not add key material.

## Run locally

Open `index.html` directly, or serve this directory with any static web server:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. The project is suitable for GitHub Pages or
Cloudflare Pages.

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

Security claims should be limited to reversible transformation, integrity-error
detection, and measured experimental behavior.

## Project layout

| Path | Purpose |
|---|---|
| `index.html` | Static user interface |
| `css/style.css` | Responsive light/dark styling |
| `js/cipher.js` | Key schedule, transposition, nibble transform |
| `js/format.js` | Versioned `.mysz` header |
| `js/utils.js` | CRC32, hex parsing, SHA-256, downloads |
| `js/analysis.js` | Timing and repeated-block measurements |
| `js/app.js` | Browser event handlers and localization |
| `tests/test.js` | Regression and validation tests |

## Documentation

The complete technical documentation is available in two formats:

- [Technical documentation (Markdown)](./docs/TECHNICAL-DOCUMENTATION.md)
- [Technical documentation (DOCX)](./docs/Myszkowski-Byte-Cipher-Technical-Documentation.docx)

The documentation identifies **PVegananda** as the author and covers the
algorithm, `.mysz` file format, security limitations, threat model,
experimental methodology, reproducibility checklist, and suggested paper
structure.

## License

Released under the [MIT License](./LICENSE). Contributions and extensions are
welcome in the [public repository](https://github.com/PVegananda/myszkowski-byte-cipher).
