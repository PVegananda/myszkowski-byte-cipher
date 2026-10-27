/* app.js - browser interface */
(function () {
  const { Cipher, Utils, Analysis } = MYSZ;
  const $ = (id) => document.getElementById(id);
  const te = new TextEncoder(), td = new TextDecoder();
  let lastBench = [];
  let statusTimer;
  let language = "en";
  const messages = {
    en: {
      eyebrow: "RESEARCH PROTOTYPE", heroDescription: "A byte-oriented transposition experiment with a rolling key",
      parametersTitle: "Parameters", parametersDescription: "Configure the key schedule and reversible byte transform.",
      keyLabel: "Key", rowsLabel: "Rows per block", scheduleLabel: "Key schedule", rollingKey: "Rolling key", staticKey: "Static key",
      nibbleLabel: "Low-hex-nibble offset", nibbleOff: "Disabled (classical bytes)", nibbleNine: "Add 9 modulo 16", nibbleSeven: "Add binary 0111 (7) modulo 16",
      textTitle: "Text encryption", textDescription: "Encrypt a message locally in your browser.", plainLabel: "Plaintext", encrypt: "Encrypt", decrypt: "Decrypt", cipherLabel: "Ciphertext (hex)", traceHint: "Non-printable bytes are shown as hexadecimal values. The first three blocks are displayed:",
      fileTitle: "File encryption", fileDescription: "Process files without uploading them to a server.", chooseFile: "Choose a file", fileHint: "PDF, Office files, images, or any binary file", noFile: "No file selected", encryptDownload: "Encrypt and download (.mysz)", decryptDownload: "Decrypt and download",
      researchTitle: "Research measurements", researchDescription: "Collect repeatable timing and pattern observations.", runBenchmark: "Run timing benchmark", copyCsv: "Copy CSV", runPattern: "Run repeated-block test"
    },
    id: {
      eyebrow: "PROTOTIPE RISET", heroDescription: "Eksperimen transposisi berbasis byte dengan kunci berputar",
      parametersTitle: "Parameter", parametersDescription: "Atur jadwal kunci dan transformasi byte yang dapat dibalik.",
      keyLabel: "Kunci", rowsLabel: "Baris per blok", scheduleLabel: "Jadwal kunci", rollingKey: "Kunci berputar", staticKey: "Kunci tetap",
      nibbleLabel: "Offset nibble heksadesimal", nibbleOff: "Nonaktif (byte klasik)", nibbleNine: "Tambah 9 modulo 16", nibbleSeven: "Tambah biner 0111 (7) modulo 16",
      textTitle: "Enkripsi teks", textDescription: "Enkripsi pesan secara lokal di browser.", plainLabel: "Teks asli", encrypt: "Enkripsi", decrypt: "Dekripsi", cipherLabel: "Ciphertext (hex)", traceHint: "Byte yang tidak tercetak ditampilkan sebagai nilai heksadesimal. Tiga blok pertama ditampilkan:",
      fileTitle: "Enkripsi file", fileDescription: "Proses file tanpa mengunggahnya ke server.", chooseFile: "Pilih file", fileHint: "PDF, Office, gambar, atau file biner apa pun", noFile: "Belum ada file dipilih", encryptDownload: "Enkripsi dan unduh (.mysz)", decryptDownload: "Dekripsi dan unduh",
      researchTitle: "Pengukuran riset", researchDescription: "Kumpulkan pengukuran waktu dan pola yang dapat diulang.", runBenchmark: "Jalankan benchmark waktu", copyCsv: "Salin CSV", runPattern: "Jalankan uji blok berulang"
    }
  };
  const translate = (next) => {
    language = messages[next] ? next : "en";
    document.documentElement.lang = language;
    $("languageSelect").value = language;
    document.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = messages[language][node.dataset.i18n];
      if (value === undefined) return;
      if (node.tagName === "LABEL") {
        const control = node.querySelector("input, select, textarea");
        node.firstChild.textContent = value + " ";
        if (control) node.append(control);
      } else node.textContent = value;
    });
    localStorage.setItem("mysz-language", language);
  };
  const detectLanguage = async () => {
    const saved = localStorage.getItem("mysz-language");
    if (saved && messages[saved]) return translate(saved);
    const browserLanguage = (navigator.language || "").toLowerCase().startsWith("id") ? "id" : "en";
    translate(browserLanguage);
    try {
      const response = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(1800) });
      if (!response.ok) return;
      const country = (await response.json()).country_code;
      if (country === "ID") translate("id");
    } catch (error) {
      // IP detection is optional; the browser-language fallback is already active.
    }
  };

  const opts = () => ({ key: $("key").value, rows: parseInt($("rows").value, 10), rolling: $("mode").value === "rolling", hexOffset: parseInt($("hexOffset").value, 10) });
  const status = (msg, ok = true) => {
    const toast = $("status");
    clearTimeout(statusTimer);
    toast.textContent = msg;
    toast.className = `toast ${ok ? "ok" : "err"} visible`;
    toast.setAttribute("aria-hidden", "false");
    statusTimer = setTimeout(() => {
      toast.classList.remove("visible");
      toast.setAttribute("aria-hidden", "true");
    }, ok ? 4200 : 6500);
  };
  const guard = (fn) => async () => { try { await fn(); } catch (e) { status(e instanceof Error ? e.message : "Unexpected error.", false); } };
  const show = (b) => (b >= 33 && b <= 126 ? String.fromCharCode(b) : b === 0 ? "0x00" : "0x" + b.toString(16).padStart(2, "0"));
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
  const fileSize = (n) => Utils.formatSize(n);

  function updateInfo() {
    try {
      const o = opts(), cols = [...o.key].length;
      $("info").textContent = `Columns = ${cols}, block size = ${cols * o.rows} bytes, initial order: ${Cipher.computeOrder(o.key).join(" ")}`;
    } catch (e) { $("info").textContent = ""; }
  }

  function renderTrace(data, o) {
    const box = $("trace");
    box.replaceChildren();
    Cipher.trace(data, o, 3).forEach((t) => {
      const wrap = el("div", "blk");
      wrap.append(el("strong", "", `Block ${t.index + 1} | key ${t.key} | order ${t.order.join(" ")}`));
      const table = el("table", "grid");
      const head = el("tr");
      t.order.forEach((n) => head.append(el("th", "", n)));
      table.append(head);
      t.grid.forEach((row) => { const tr = el("tr"); row.forEach((b) => tr.append(el("td", "", show(b)))); table.append(tr); });
      wrap.append(table, el("p", "", "Output: " + t.cipher.map(show).join("")));
      box.append(wrap);
    });
  }

  $("encText").onclick = guard(() => {
    const o = opts(), data = te.encode($("plain").value);
    const t0 = performance.now();
    const out = Cipher.encrypt(data, o);
    $("cipher").value = Utils.toHex(out);
    renderTrace(data, o);
    status(`Text encrypted (${(performance.now() - t0).toFixed(3)} ms, ${out.length} bytes).`);
  });

  $("decText").onclick = guard(() => {
    const out = Cipher.decrypt(Utils.fromHex($("cipher").value), opts());
    $("plain").value = td.decode(out, { fatal: true });
    status("Text decrypted successfully; CRC32 verified.");
  });

  $("encFile").onclick = guard(async () => {
    const f = $("fileIn").files[0];
    if (!f) throw new Error("Choose a file first.");
    const o = opts(), data = new Uint8Array(await f.arrayBuffer());
    const t0 = performance.now(); const enc = Cipher.encrypt(data, o);
    const t1 = performance.now(); const back = Cipher.decrypt(enc, o);
    const t2 = performance.now();
    const [h1, h2] = await Promise.all([Utils.sha256(data), Utils.sha256(back)]);
    Utils.download(enc, f.name + ".mysz");
    $("fileResult").textContent =
      `File: ${f.name} (${Utils.formatSize(data.length)})\nEncryption: ${(t1 - t0).toFixed(2)} ms | Decryption: ${(t2 - t1).toFixed(2)} ms\n` +
      `SHA-256 original: ${h1}\nSHA-256 decrypted: ${h2}\nHash ${h1 === h2 ? "MATCH" : "MISMATCH"}`;
    status("Encrypted file downloaded as " + f.name + ".mysz");
  });

  $("decFile").onclick = guard(async () => {
    const f = $("fileIn").files[0];
    if (!f) throw new Error("Choose a .mysz file first.");
    const out = Cipher.decrypt(new Uint8Array(await f.arrayBuffer()), opts());
    Utils.download(out, f.name.endsWith(".mysz") ? f.name.slice(0, -5) : f.name + ".dec");
    status("File decrypted; CRC32 verified. Original file downloaded.");
  });

  $("fileIn").onchange = () => {
    const file = $("fileIn").files[0];
    $("fileName").textContent = file ? `${file.name} · ${fileSize(file.size)}` : messages[language].noFile;
  };

  $("runBench").onclick = guard(async () => {
    const sizes = [10, 100, 512, 1024, 5120].map((k) => k * 1024);
    status("Benchmark running...");
    lastBench = await Analysis.benchmark(sizes, 5, opts(), (i, n) => status(`Benchmark ${i}/${n} complete...`));
    const body = $("benchBody"); body.replaceChildren();
    lastBench.forEach((r) => {
      const tr = el("tr");
      [Utils.formatSize(r.size), `${r.encMs.toFixed(2)} ± ${r.encSd.toFixed(2)}`, `${r.decMs.toFixed(2)} ± ${r.decSd.toFixed(2)}`].forEach((t) => tr.append(el("td", "", t)));
      body.append(tr);
    });
    status("Benchmark complete (five runs per size).");
  });

  $("copyCsv").onclick = guard(async () => {
    if (!lastBench.length) throw new Error("Run the benchmark first.");
    await navigator.clipboard.writeText(Analysis.toCSV(lastBench));
    status("CSV copied to clipboard.");
  });

  $("runPattern").onclick = guard(() => {
    const r = Analysis.patternTest(opts());
    $("patternResult").textContent = `Test data: one repeated block, ${r.blocks} repetitions.\nDistinct ciphertext blocks, static key: ${r.fixed}\nDistinct ciphertext blocks, rolling key: ${r.rolling}`;
    status("Repeated-block test complete.");
  });

  ["key", "rows", "hexOffset"].forEach((id) => ($(id).oninput = updateInfo));
  $("languageSelect").onchange = (event) => translate(event.target.value);
  detectLanguage();
  updateInfo();
})();
