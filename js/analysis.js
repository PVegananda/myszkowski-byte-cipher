/* analysis.js - pengujian untuk paper: waktu komputasi & uji pola blok berulang */
(function (g) {
  const M = (g.MYSZ = g.MYSZ || {});
  const { Cipher: C, Utils: U, Format: F } = M;
  const tick = () => new Promise((r) => setTimeout(r, 0));
  const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sd = (a) => Math.sqrt(mean(a.map((x) => (x - mean(a)) ** 2)));

  M.Analysis = {
    async benchmark(sizes, runs, opts, onProgress) {
      const rows = [];
      for (const size of sizes) {
        const data = U.randomBytes(size);
        const e = [], d = [];
        for (let i = 0; i < runs; i++) {
          await tick();
          const t0 = performance.now();
          const enc = C.encrypt(data, opts);
          const t1 = performance.now();
          C.decrypt(enc, opts); // melempar error jika hasil tidak sama dengan aslinya
          const t2 = performance.now();
          e.push(t1 - t0);
          d.push(t2 - t1);
        }
        rows.push({ size, encMs: mean(e), encSd: sd(e), decMs: mean(d), decSd: sd(d) });
        if (onProgress) onProgress(rows.length, sizes.length);
      }
      return rows;
    },

    // Data berisi 1 blok yang diulang n kali: berapa ciphertext blok yang berbeda?
    patternTest(opts, blocks = 300) {
      const bs = [...opts.key].length * opts.rows;
      const one = U.randomBytes(bs);
      const data = new Uint8Array(bs * blocks);
      for (let b = 0; b < blocks; b++) data.set(one, b * bs);
      const unique = (rolling) => {
        const payload = F.unpack(C.encrypt(data, { ...opts, rolling })).payload;
        const set = new Set();
        for (let b = 0; b < blocks; b++) set.add(payload.subarray(b * bs, (b + 1) * bs).join(","));
        return set.size;
      };
      return { blocks, fixed: unique(false), rolling: unique(true) };
    },

    toCSV(rows) {
      return ["ukuran_byte,enkripsi_ms,dekripsi_ms"]
        .concat(rows.map((r) => [r.size, r.encMs.toFixed(3), r.decMs.toFixed(3)].join(",")))
        .join("\n");
    },
  };
})(globalThis);
