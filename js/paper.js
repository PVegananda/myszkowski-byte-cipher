/* paper.js - article presentation helpers (independent of the cipher) */
(function () {
  const select = document.getElementById("languageSelect");
  const setLanguage = (lang) => {
    const next = lang === "id" ? "id" : "en";
    document.documentElement.lang = next;
    if (select) select.value = next;
    localStorage.setItem("mysz-language", next);
  };
  setLanguage(localStorage.getItem("mysz-language") || ((navigator.language || "").toLowerCase().startsWith("id") ? "id" : "en"));
  if (select) select.addEventListener("change", (event) => setLanguage(event.target.value));

  const progress = document.getElementById("progress");
  const links = [...document.querySelectorAll(".toc a")];
  const sections = links.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    sections.forEach((s) => io.observe(s));
  }

  const bibtex = `@misc{pvegananda2026myszkowski,
  author = {PVegananda},
  title  = {Myszkowski Byte Cipher: A Byte-Oriented Transposition with Rolling Key},
  year   = {2026},
  url    = {https://myszkowski-byte-cipher.pages.dev/},
  note   = {Research prototype, MIT License}
}`;
  const button = document.getElementById("copyCite");
  if (button) {
    button.addEventListener("click", async () => {
      const toast = document.getElementById("status");
      try {
        await navigator.clipboard.writeText(bibtex);
        toast.textContent = "BibTeX copied to clipboard.";
        toast.className = "toast ok visible";
      } catch (error) {
        toast.textContent = "Could not access the clipboard.";
        toast.className = "toast err visible";
      }
      setTimeout(() => toast.classList.remove("visible"), 3000);
    });
  }
})();
