# Myszkowski Byte Cipher

## Technical Documentation and Research Notes

**Author:** PVegananda  
**Project:** `PVegananda/myszkowski-byte-cipher`  
**Document status:** Research prototype  
**Updated:** 27 October 2026

---

## Abstract

Myszkowski Byte Cipher is a browser-based implementation of a byte-oriented
Myszkowski transposition experiment. The project extends the classical
Myszkowski transposition method with an optional rolling-key schedule and an
optional reversible low-hex-nibble transform. Unlike a text-only cipher, the
implementation operates on arbitrary byte sequences, allowing experiments with
text, images, PDF files, and Office documents without interpreting their
internal format.

The project is intended for education and reproducible experimentation. It is
not an authenticated encryption scheme and must not be used as a replacement
for AES-GCM, ChaCha20-Poly1305, or another modern cryptographic construction.

## 1. Project identity

| Item | Value |
|---|---|
| Project name | Myszkowski Byte Cipher |
| Author | PVegananda |
| Repository | <https://github.com/PVegananda/myszkowski-byte-cipher> |
| Runtime | Modern web browser; Node.js 18+ for tests |
| Deployment | Static hosting, GitHub Pages, Cloudflare Pages, or local files |
| Input model | Arbitrary `Uint8Array` data |
| Output format | Versioned `.mysz` binary container |
| License | MIT |

## 2. Research motivation

Classical transposition ciphers rearrange symbols without changing their
values. This makes them useful for demonstrating permutation, repeated-key
handling, block processing, and the difference between reversible obfuscation
and cryptographic confidentiality.

This project investigates three practical questions:

1. Can Myszkowski transposition be applied safely to arbitrary bytes rather
   than only alphabetic text?
2. Does rotating the key between blocks reduce identical ciphertext blocks in a
   repeated-data experiment?
3. What is the effect of applying a reversible low-nibble offset after
   transposition?

The implementation provides a browser interface and built-in measurements so
that these questions can be tested without uploading data to a server.

## 3. Scope and non-goals

### Included

- Classical Myszkowski column ordering.
- Equal key characters assigned the same rank.
- Static and rolling key schedules.
- Block-based byte processing.
- Optional low-nibble addition by 9 or by binary `0111` (decimal 7).
- CRC32 error detection.
- SHA-256 comparison in the browser file workflow.
- Header, payload-length, type, and parameter validation.
- Timing and repeated-block experiments.

### Not included

- Secure key derivation.
- Password protection.
- Authenticated encryption.
- Public-key cryptography.
- Protection against an active attacker.
- Confidential metadata.
- A security claim equivalent to modern encryption.

## 4. Architecture

The project is deliberately framework-free. It can be opened as a static
website and consists of the following layers:

| File | Responsibility |
|---|---|
| `index.html` | Accessible interface, language selector, controls, and output areas |
| `css/style.css` | Responsive visual design, dark-mode variables, toast notifications, and file picker |
| `js/utils.js` | Hex conversion, CRC32, SHA-256, random bytes, file download, and size formatting |
| `js/format.js` | Versioned `.mysz` header packing and validation |
| `js/cipher.js` | Key ordering, permutation construction, block transformation, nibble transform |
| `js/analysis.js` | Timing benchmark, repeated-block experiment, and CSV export |
| `js/app.js` | UI event handlers, localization, IP-based language hint, and error presentation |
| `tests/test.js` | Regression, round-trip, validation, and experiment tests |

All cryptographic transformation happens locally in the browser. The optional
language-country lookup is separate from the cipher and does not receive
plaintext, keys, or uploaded files.

## 5. Algorithm specification

### 5.1 Key ranking

Let the key be a sequence of Unicode characters:

```text
LAPTOP
```

The distinct characters are sorted lexicographically and assigned ranks:

```text
L A O P T
2 1 4 5 3
```

Repeated characters receive the same rank. Therefore:

```text
LAPTOP -> 2 1 4 5 3 4
```

The implementation works on Unicode code points when measuring key length,
rather than splitting a JavaScript string into UTF-16 code units.

### 5.2 Block layout

For a key length `c` and row count `r`, the block size is:

```text
B = c × r bytes
```

Input is divided into blocks of exactly `B` bytes. The final block is padded
with zero bytes if necessary. The original byte length is stored in the header
and used to remove only padding bytes during decryption.

### 5.3 Myszkowski read order

For each rank:

- If the rank occurs once, the corresponding column is read top-to-bottom.
- If the rank occurs more than once, those columns are read left-to-right for
  each row.

The resulting permutation is applied independently to every block.

### 5.4 Rolling-key schedule

In static mode, every block uses the original key.

In rolling mode, block `b` uses the key rotated left by:

```text
b mod c
```

For example:

```text
Block 0: LAPTOP
Block 1: APTOPL
Block 2: PTOPLA
```

The schedule repeats after `c` blocks. It changes block arrangement but does
not provide the unpredictability of a cryptographic keystream.

### 5.5 Low-hex-nibble transform

When enabled, the transform is applied after transposition to every byte:

```text
high_nibble = byte & 0xF0
low_nibble  = byte & 0x0F
new_low     = (low_nibble + offset) mod 16
output      = high_nibble | new_low
```

Supported offsets:

| UI option | Decimal offset | Binary |
|---|---:|---|
| Disabled | 0 | `0000` |
| Add 9 | 9 | `1001` |
| Add binary 0111 | 7 | `0111` |

Decryption uses the additive inverse modulo 16. The offset is recorded in the
header, so it is a transform setting rather than secret key material.

## 6. `.mysz` file format

The container begins with a 16-byte header followed by the transformed payload.
All multi-byte integers use big-endian encoding through `DataView`.

| Bytes | Field | Description |
|---:|---|---|
| 0–3 | Magic | ASCII `MYSZ` |
| 4 | Version | `1` for the original format, `2` for nibble-aware format |
| 5 | Flags | Bit 0 rolling key; bits 1–2 encode nibble offset |
| 6–7 | Rows | Unsigned 16-bit row count |
| 8–11 | Original length | Unsigned 32-bit byte length |
| 12–15 | CRC32 | CRC32 of the original data |
| 16 onward | Payload | Padded and transformed bytes |

Version 2 flag mapping:

| Bits 2–1 | Meaning |
|---|---|
| `00` | Offset 0 |
| `01` | Offset 9 |
| `10` | Offset 7 |
| `11` | Invalid |

The header is not encrypted. It is validated before transformation. Unsupported
versions, unknown flags, inconsistent payload lengths, and impossible
parameters are rejected.

## 7. Integrity and validation

CRC32 is calculated over the original plaintext bytes. During decryption, the
implementation:

1. Validates the magic marker and supported version.
2. Validates flags and legacy-format compatibility.
3. Validates the supplied key and header row count.
4. Checks that payload length is a multiple of the derived block size.
5. Checks that payload length matches the header's original length and padding.
6. Reverses the nibble transform and transposition.
7. Removes padding according to the original length.
8. Compares CRC32 values.

CRC32 detects many accidental errors but is not a cryptographic MAC. An attacker
who can modify the file can deliberately recalculate it.

## 8. Threat model

### The project can demonstrate

- Reversible byte permutation.
- Effects of repeated key characters.
- Effects of block rotation.
- Accidental corruption detection through CRC32.
- Performance changes under different block sizes and input sizes.

### The project does not protect against

- Known-plaintext analysis.
- Chosen-plaintext analysis.
- Frequency analysis.
- Structural analysis of file formats.
- Deliberate ciphertext modification.
- Key guessing or brute force.
- Header inspection.
- Traffic or file-name metadata leakage.

The low-nibble transform does not change this assessment. It changes values
within each byte but is deterministic, reversible, and independent of a secret
key.

## 9. Security gaps and mitigations

| Gap | Impact | Current mitigation | Remaining limitation |
|---|---|---|---|
| Transposition preserves structure | High | Rolling schedule changes block permutations | Still vulnerable to analysis |
| CRC32 is unauthenticated | High | CRC mismatch is reported | Malicious edits can forge CRC |
| Header is visible | Medium | Header is validated strictly | Metadata remains exposed |
| 32-bit length field | Low | Explicit maximum validation | Files above 4 GiB unsupported |
| Large block allocation | Medium | Block size capped at 16 MiB | Browser memory remains finite |
| External IP language lookup | Low | Timeout and local fallback | Country service sees request metadata |
| Unicode key normalization | Medium | Code-point iteration | Visually equivalent keys may differ |

For real confidentiality, replace the transformation with a standard AEAD
construction and derive keys using a password-based KDF such as Argon2id or
scrypt. Do not layer this prototype in front of an AEAD scheme and call the
result secure without analysis.

## 10. User guide

### Browser use

1. Open `index.html`, or serve the project with a static server.
2. Select English or Bahasa Indonesia in the upper-right language control.
3. Enter a key with at least two different characters.
4. Choose rows per block.
5. Select static or rolling key mode.
6. Select the low-nibble setting if the experiment requires it.
7. Use the text or file workflow.
8. Keep the key and selected parameters for decryption.

### Local server

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>.

### Node.js tests

```bash
node tests/test.js
```

The test suite covers key ordering, known vectors, round trips, wrong keys,
invalid files, invalid types, nibble offsets, strict hex input, and repeated
block behavior.

## 11. Experimental methodology

The research panel provides two measurements.

### Timing benchmark

- Input sizes: 10 KiB, 100 KiB, 512 KiB, 1 MiB, and 5 MiB.
- Runs: five encryption/decryption runs per size.
- Output: mean and population standard deviation in milliseconds.
- Data: cryptographically random browser-generated bytes.

For a paper, report browser version, operating system, CPU, memory, JavaScript
engine, key, row count, key schedule, nibble offset, and whether the browser
was throttled.

### Repeated-block test

One random block is repeated 300 times. The test counts distinct ciphertext
blocks:

- Static mode should produce one distinct block for repeated input.
- Rolling mode can produce up to the number of unique schedule positions,
  bounded by key length.

This is evidence of changed block arrangement, not evidence of semantic
security. The result should be presented as an observation of this experiment.

## 12. Reproducibility checklist

For a paper or presentation, record:

- Commit hash.
- Browser and version.
- Operating system and hardware.
- Key and key length.
- Row count.
- Static or rolling schedule.
- Nibble offset.
- Input size and generation method.
- Number of benchmark repetitions.
- Mean, standard deviation, and raw CSV output.
- Whether the run used a local server or file URL.

## 13. Suggested paper structure

1. **Introduction** — motivation and research questions.
2. **Related work** — classical transposition and modern authenticated encryption.
3. **Method** — key ranking, block layout, rolling schedule, and nibble transform.
4. **Implementation** — browser architecture and `.mysz` format.
5. **Experimental design** — hardware, browser, inputs, and measurements.
6. **Results** — timing tables and repeated-block observations.
7. **Security discussion** — structural weaknesses and CRC32 limitations.
8. **Conclusion** — educational value and future work.
9. **Limitations and ethics** — explicit non-production security warning.

## 14. Future work

- Add authenticated encryption as a separate, clearly labeled mode.
- Add Web Crypto API key derivation for a secure comparison baseline.
- Add property-based tests for arbitrary block sizes and Unicode keys.
- Add a downloadable experiment manifest containing environment metadata.
- Add automated accessibility checks and browser integration tests.
- Compare static, rolling, nibble-7, and nibble-9 variants against a baseline.

## 15. License and contribution

The project is released under the MIT License. Contributions are welcome through
the public repository:

<https://github.com/PVegananda/myszkowski-byte-cipher>

Contributors should preserve the security disclaimer, update regression tests,
and document behavioral changes that affect the file format or paper results.

