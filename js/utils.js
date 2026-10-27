/* utils.js - fungsi bantu: CRC32, hex, SHA-256, unduh file, format ukuran */
(function (g) {
  const M = (g.MYSZ = g.MYSZ || {});

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

  M.Utils = {
    toHex,
    crc32(data) {
      let c = 0xffffffff;
      for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
      return (c ^ 0xffffffff) >>> 0;
    },
    fromHex(str) {
      const clean = str.replace(/[^0-9a-fA-F]/g, "");
      if (clean.length % 2) throw new Error("Panjang hex harus genap.");
      const out = new Uint8Array(clean.length / 2);
      for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
      return out;
    },
    async sha256(bytes) {
      return toHex(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)));
    },
    randomBytes(n) {
      const out = new Uint8Array(n);
      for (let i = 0; i < n; i += 65536) crypto.getRandomValues(out.subarray(i, Math.min(i + 65536, n)));
      return out;
    },
    formatSize(n) {
      if (n < 1024) return n + " B";
      if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
      return (n / 1048576).toFixed(2) + " MB";
    },
    download(bytes, name) {
      const url = URL.createObjectURL(new Blob([bytes]));
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
})(globalThis);
