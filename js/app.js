/* app.js - antarmuka (menghubungkan HTML dengan modul cipher) */
(function () {
  const { Cipher, Utils, Analysis } = MYSZ;
  const $ = (id) => document.getElementById(id);
  const te = new TextEncoder(), td = new TextDecoder();
  let lastBench = [];

  const opts = () => ({ key: $("key").value, rows: parseInt($("rows").value, 10), rolling: $("mode").value === "rolling" });
  const status = (msg, ok = true) => { $("status").textContent = msg; $("status").className = ok ? "ok" : "err"; };
  const guard = (fn) => async () => { try { await fn(); } catch (e) { status(e.message, false); } };
  const show = (b) => (b >= 33 && b <= 126 ? String.fromCharCode(b) : b === 0 ? "∅" : "·");
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };

  function updateInfo() {
    try {
      const o = opts(), cols = [...o.key].length;
      $("info").textContent = `Kolom = ${cols}, ukuran blok = ${cols * o.rows} byte, urutan kolom awal: ${Cipher.computeOrder(o.key).join(" ")}`;
    } catch (e) { $("info").textContent = ""; }
  }

  function renderTrace(data, o) {
    const box = $("trace");
    box.replaceChildren();
    Cipher.trace(data, o, 3).forEach((t) => {
      const wrap = el("div", "blk");
      wrap.append(el("strong", "", `Blok ${t.index + 1} | kunci ${t.key} | urutan ${t.order.join(" ")}`));
      const table = el("table", "grid");
      const head = el("tr");
      t.order.forEach((n) => head.append(el("th", "", n)));
      table.append(head);
      t.grid.forEach((row) => { const tr = el("tr"); row.forEach((b) => tr.append(el("td", "", show(b)))); table.append(tr); });
      wrap.append(table, el("p", "", "Hasil: " + t.cipher.map(show).join("")));
      box.append(wrap);
    });
  }

  $("encText").onclick = guard(() => {
    const o = opts(), data = te.encode($("plain").value);
    const t0 = performance.now();
    const out = Cipher.encrypt(data, o);
    $("cipher").value = Utils.toHex(out);
    renderTrace(data, o);
    status(`Enkripsi teks selesai (${(performance.now() - t0).toFixed(3)} ms, ${out.length} byte).`);
  });

  $("decText").onclick = guard(() => {
    const out = Cipher.decrypt(Utils.fromHex($("cipher").value), opts());
    $("plain").value = td.decode(out);
    status("Dekripsi teks berhasil, CRC32 cocok.");
  });

  $("encFile").onclick = guard(async () => {
    const f = $("fileIn").files[0];
    if (!f) throw new Error("Pilih file dulu.");
    const o = opts(), data = new Uint8Array(await f.arrayBuffer());
    const t0 = performance.now(); const enc = Cipher.encrypt(data, o);
    const t1 = performance.now(); const back = Cipher.decrypt(enc, o);
    const t2 = performance.now();
    const [h1, h2] = await Promise.all([Utils.sha256(data), Utils.sha256(back)]);
    Utils.download(enc, f.name + ".mysz");
    $("fileResult").textContent =
      `File: ${f.name} (${Utils.formatSize(data.length)})\nEnkripsi: ${(t1 - t0).toFixed(2)} ms | Dekripsi: ${(t2 - t1).toFixed(2)} ms\n` +
      `SHA-256 asli      : ${h1}\nSHA-256 dekripsi  : ${h2}\nHash ${h1 === h2 ? "COCOK ✓" : "TIDAK COCOK ✗"}`;
    status("File terenkripsi diunduh sebagai " + f.name + ".mysz");
  });

  $("decFile").onclick = guard(async () => {
    const f = $("fileIn").files[0];
    if (!f) throw new Error("Pilih file .mysz dulu.");
    const out = Cipher.decrypt(new Uint8Array(await f.arrayBuffer()), opts());
    Utils.download(out, f.name.endsWith(".mysz") ? f.name.slice(0, -5) : f.name + ".dec");
    status("Dekripsi berhasil, CRC32 cocok. File asli diunduh.");
  });

  $("runBench").onclick = guard(async () => {
    const sizes = [10, 100, 512, 1024, 5120].map((k) => k * 1024);
    status("Benchmark berjalan...");
    lastBench = await Analysis.benchmark(sizes, 5, opts(), (i, n) => status(`Benchmark ${i}/${n} ukuran selesai...`));
    const body = $("benchBody"); body.replaceChildren();
    lastBench.forEach((r) => {
      const tr = el("tr");
      [Utils.formatSize(r.size), `${r.encMs.toFixed(2)} ± ${r.encSd.toFixed(2)}`, `${r.decMs.toFixed(2)} ± ${r.decSd.toFixed(2)}`].forEach((t) => tr.append(el("td", "", t)));
      body.append(tr);
    });
    status("Benchmark selesai (rata-rata 5 kali per ukuran).");
  });

  $("copyCsv").onclick = guard(async () => {
    if (!lastBench.length) throw new Error("Jalankan benchmark dulu.");
    await navigator.clipboard.writeText(Analysis.toCSV(lastBench));
    status("CSV disalin ke clipboard.");
  });

  $("runPattern").onclick = guard(() => {
    const r = Analysis.patternTest(opts());
    $("patternResult").textContent = `Data uji: 1 blok yang sama diulang ${r.blocks} kali.\nCiphertext blok berbeda, kunci tetap   : ${r.fixed}\nCiphertext blok berbeda, kunci berputar: ${r.rolling}`;
    status("Uji pola selesai.");
  });

  ["key", "rows"].forEach((id) => ($(id).oninput = updateInfo));
  updateInfo();
})();
