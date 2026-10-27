/* format.js - encrypted file header (16 bytes)
 * 0-3  : "MYSZ" (marker)    4: version  5: flags (bit0 = rolling key, bits 1-2 = hex offset)
 * 6-7  : jumlah baris       8-11: panjang data asli   12-15: CRC32 data asli */
(function (g) {
  const M = (g.MYSZ = g.MYSZ || {});
  const MAGIC = [0x4d, 0x59, 0x53, 0x5a];
  const HEADER_SIZE = 16;

  M.Format = {
    HEADER_SIZE,
    pack({ rows, rolling, hexOffset = 0, length, crc }, payload) {
      const out = new Uint8Array(HEADER_SIZE + payload.length);
      const v = new DataView(out.buffer);
      MAGIC.forEach((b, i) => (out[i] = b));
      out[4] = 2;
      out[5] = (rolling ? 1 : 0) | (hexOffset === 9 ? 2 : hexOffset === 7 ? 4 : 0);
      v.setUint16(6, rows);
      v.setUint32(8, length);
      v.setUint32(12, crc);
      out.set(payload, HEADER_SIZE);
      return out;
    },
    unpack(bytes) {
      if (bytes.length < HEADER_SIZE || MAGIC.some((b, i) => bytes[i] !== b))
        throw new Error("Bukan file hasil enkripsi aplikasi ini (header tidak dikenali).");
      if (bytes[4] !== 1 && bytes[4] !== 2) throw new Error("Versi format file tidak didukung.");
      if ((bytes[5] & 0xf8) !== 0 || (bytes[5] & 6) === 6)
        throw new Error("Flag header tidak valid.");
      if (bytes[4] === 1 && (bytes[5] & 6) !== 0)
        throw new Error("Legacy header contains unsupported flags.");
      const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return {
        version: bytes[4],
        rolling: (bytes[5] & 1) === 1,
        hexOffset: (bytes[5] & 6) === 2 ? 9 : (bytes[5] & 6) === 4 ? 7 : 0,
        rows: v.getUint16(6),
        length: v.getUint32(8),
        crc: v.getUint32(12),
        payload: bytes.subarray(HEADER_SIZE),
      };
    },
  };
})(globalThis);
