/* ui.js - tabs, key visualisation, drag and drop, copy helpers */
(function () {
  const $ = (id) => document.getElementById(id);
  const notify = (message, ok = true) => {
    const toast = $("status");
    toast.textContent = message;
    toast.className = `toast ${ok ? "ok" : "err"} visible`;
    toast.setAttribute("aria-hidden", "false");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("visible"), 2600);
  };

  /* Tabs (WAI-ARIA tabs pattern with arrow-key navigation) */
  const tabs = [...document.querySelectorAll(".tab")];
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.dataset.pane).hidden = !on;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      select(next);
      next.focus();
    });
  });

  /* Live key ranking chips */
  const viz = $("keyViz");
  const renderKey = () => {
    viz.replaceChildren();
    const key = $("key").value;
    let order;
    try { order = MYSZ.Cipher.computeOrder(key); } catch (error) { return; }
    [...key].forEach((char, i) => {
      const chip = document.createElement("span");
      chip.className = "chip" + (order.filter((n) => n === order[i]).length > 1 ? " repeat" : "");
      const c = document.createElement("b");
      c.textContent = char;
      const r = document.createElement("i");
      r.textContent = order[i];
      chip.append(c, r);
      viz.append(chip);
    });
  };
  $("key").addEventListener("input", renderKey);
  renderKey();

  /* Drag and drop for files */
  const zone = $("dropzone");
  const input = $("fileIn");
  ["dragenter", "dragover"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.add("dragging");
  }));
  ["dragleave", "drop"].forEach((name) => zone.addEventListener(name, (event) => {
    event.preventDefault();
    zone.classList.remove("dragging");
  }));
  zone.addEventListener("drop", (event) => {
    if (!event.dataTransfer.files.length) return;
    input.files = event.dataTransfer.files;
    input.dispatchEvent(new Event("change"));
  });

  /* Copy / clear */
  $("copyCipher").addEventListener("click", async () => {
    const value = $("cipher").value;
    if (!value) return notify("Nothing to copy yet.", false);
    try { await navigator.clipboard.writeText(value); notify("Ciphertext copied."); }
    catch (error) { notify("Could not access the clipboard.", false); }
  });
  $("clearText").addEventListener("click", () => {
    $("plain").value = "";
    $("cipher").value = "";
    $("trace").replaceChildren();
  });
})();
