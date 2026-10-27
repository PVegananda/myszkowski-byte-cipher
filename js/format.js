/* format.js - header file hasil enkripsi (16 byte)
 * 0-3  : "MYSZ" (penanda)   4: versi   5: flag (bit0 = kunci berputar)
 * 6-7  : jumlah baris       8-11: panjang data asli   12-15: CRC32 data asli */
(function (g) {
  const M = (g.MYSZ = g.MYSZ || {});
  const MAGIC = [0x4d, 0x59, 0x53, 0x5a];
  const HEADER_SIZE = 16;

  M.Format = {
    HEADER_SIZE,
    pack({ rows, rolling, length, crc }, payload) {
      const out = new Uint8Array(HEADER_SIZE + payload.length);
      const v = new DataView(out.buffer);
      MAGIC.forEach((b, i) => (out[i] = b));
      out[4] = 1;
      out[5] = rolling ? 1 : 0;
      v.setUint16(6, rows);
      v.setUint32(8, length);
      v.setUint32(12, crc);
      out.set(payload, HEADER_SIZE);
      return out;
    },
    unpack(bytes) {
      if (bytes.length < HEADER_SIZE || MAGIC.some((b, i) => bytes[i] !== b))
        throw new Error("Bukan file hasil enkripsi aplikasi ini (header tidak dikenali).");
      const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      return {
        rolling: (bytes[5] & 1) === 1,
        rows: v.getUint16(6),
        length: v.getUint32(8),
        crc: v.getUint32(12),
        payload: bytes.subarray(HEADER_SIZE),
      };
    },
  };
})(globalThis);
