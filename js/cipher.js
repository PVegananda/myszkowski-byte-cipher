/* cipher.js - inti algoritma Myszkowski Transposition Cipher + Kunci Berputar
 * Bekerja pada BYTE, sehingga aman untuk file apa pun (.docx, .pdf, dll). */
(function (g) {
  const M = (g.MYSZ = g.MYSZ || {});
  const { Utils: U, Format: F } = M;

  // Nomor urut abjad; huruf kembar mendapat nomor SAMA. LAPTOP -> [2,1,4,5,3,4]
  function computeOrder(key) {
    const chars = [...key];
    const sorted = [...new Set(chars)].sort();
    return chars.map((c) => sorted.indexOf(c) + 1);
  }

  // Geser kunci ke kiri sebanyak n huruf. LAPTOP, 1 -> APTOPL
  function rotateKey(key, n) {
    const chars = [...key];
    const s = n % chars.length;
    return chars.slice(s).concat(chars.slice(0, s)).join("");
  }

  // Urutan baca satu blok: perm[i] = posisi byte sumber untuk ciphertext ke-i
  function buildPermutation(order, rows) {
    const cols = order.length;
    const perm = new Uint32Array(cols * rows);
    let p = 0;
    const ranks = [...new Set(order)].sort((a, b) => a - b);
    for (const rank of ranks) {
      const cs = [];
      order.forEach((o, c) => o === rank && cs.push(c));
      if (cs.length === 1) {
        for (let r = 0; r < rows; r++) perm[p++] = r * cols + cs[0]; // unik: baca ke bawah
      } else {
        for (let r = 0; r < rows; r++) for (const c of cs) perm[p++] = r * cols + c; // kembar: per baris
      }
    }
    return perm;
  }

  function validate(key, rows, dataLength = 0) {
    if (typeof key !== "string") throw new Error("Key must be text.");
    const chars = [...key];
    if (chars.length < 2 || new Set(chars).size < 2)
      throw new Error("Key must contain at least 2 different characters.");
    if (!Number.isInteger(rows) || rows < 1 || rows > 65535)
      throw new Error("Rows must be an integer from 1 to 65535.");
    if (chars.length * rows > 16 * 1024 * 1024)
      throw new Error("The block size is limited to 16 MiB.");
    if (!Number.isSafeInteger(dataLength) || dataLength < 0 || dataLength > 0xffffffff)
      throw new Error("Data is too large for this file format.");
  }

  function validateHexOffset(hexOffset) {
    if (![0, 7, 9].includes(hexOffset)) throw new Error("Hex offset must be 0, 7, or 9.");
  }

  function permProvider(key, rows, rolling) {
    const cols = [...key].length;
    const cache = [];
    return (block) => {
      const shift = rolling ? block % cols : 0;
      return (cache[shift] ||= buildPermutation(computeOrder(rotateKey(key, shift)), rows));
    };
  }

  function transform(data, key, rows, rolling, inverse) {
    const bs = [...key].length * rows;
    const out = new Uint8Array(data.length);
    const permOf = permProvider(key, rows, rolling);
    for (let b = 0; b < data.length / bs; b++) {
      const perm = permOf(b);
      const base = b * bs;
      if (inverse) for (let i = 0; i < bs; i++) out[base + perm[i]] = data[base + i];
      else for (let i = 0; i < bs; i++) out[base + i] = data[base + perm[i]];
    }
    return out;
  }

  function shiftLowNibble(data, offset) {
    if (!offset) return data.slice();
    const out = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) out[i] = (data[i] & 0xf0) | ((data[i] + offset) & 0x0f);
    return out;
  }

  function pad(data, bs) {
    const padded = new Uint8Array(Math.ceil(data.length / bs) * bs); // sisa blok = byte 0
    padded.set(data);
    return padded;
  }

  function encrypt(data, { key, rows = 2, rolling = true, hexOffset = 0 }) {
    if (!(data instanceof Uint8Array)) throw new Error("Input must be a Uint8Array.");
    validate(key, rows, data.length);
    validateHexOffset(hexOffset);
    const bs = [...key].length * rows;
    const transposed = transform(pad(data, bs), key, rows, rolling, false);
    const payload = shiftLowNibble(transposed, hexOffset);
    return F.pack({ rows, rolling, hexOffset, length: data.length, crc: U.crc32(data) }, payload);
  }

  function decrypt(bytes, { key }) {
    if (!(bytes instanceof Uint8Array)) throw new Error("Encrypted data must be a Uint8Array.");
    const h = F.unpack(bytes);
    validate(key, h.rows, h.length);
    const hexOffset = h.version === 1 ? 0 : h.hexOffset;
    const bs = [...key].length * h.rows;
    if (h.payload.length % bs !== 0 || h.payload.length !== Math.ceil(h.length / bs) * bs)
      throw new Error("File length does not match its header.");
    const unshifted = shiftLowNibble(h.payload, (16 - hexOffset) % 16);
    const plain = transform(unshifted, key, h.rows, h.rolling, true);
    if (h.length > plain.length) throw new Error("File rusak.");
    const result = plain.slice(0, h.length);
    if (U.crc32(result) !== h.crc) throw new Error("Kunci salah atau file rusak (CRC32 tidak cocok).");
    return result;
  }

  // Untuk visualisasi: isi tabel dan ciphertext beberapa blok pertama
  function trace(data, { key, rows = 2, rolling = true }, limit = 3) {
    validate(key, rows);
    const cols = [...key].length;
    const bs = cols * rows;
    const padded = pad(data, bs);
    const permOf = permProvider(key, rows, rolling);
    const result = [];
    for (let b = 0; b < Math.min(limit, padded.length / bs); b++) {
      const block = padded.subarray(b * bs, (b + 1) * bs);
      const k = rolling ? rotateKey(key, b % cols) : key;
      const grid = [];
      for (let r = 0; r < rows; r++) grid.push(Array.from(block.subarray(r * cols, (r + 1) * cols)));
      const perm = permOf(b);
      result.push({ index: b, key: k, order: computeOrder(k), grid, cipher: Array.from(perm, (p) => block[p]) });
    }
    return result;
  }

  M.Cipher = { computeOrder, rotateKey, buildPermutation, encrypt, decrypt, trace };
})(globalThis);
