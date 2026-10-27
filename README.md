# Myszkowski Rolling-Key Cipher

Pengembangan *Myszkowski Transposition Cipher* (dasar: JIKTEKS Vol. 3 No. 3, 2025).
Pengembangan: **kunci digeser 1 karakter untuk setiap blok** (LAPTOP, APTOPL, PTOPLA, ...),
dan data diproses sebagai **byte** sehingga file .docx/.pdf tidak rusak.

## Cara menjalankan
- Buka `index.html` di browser (klik dua kali), atau
- Deploy folder ini ke Cloudflare Pages / GitHub Pages (tanpa build).
- Uji otomatis: `node tests/test.js` (butuh Node.js 18+).

## Struktur
| File | Fungsi |
|---|---|
| `index.html` | Halaman utama |
| `css/style.css` | Tampilan (mendukung mode gelap) |
| `js/utils.js` | CRC32, hex, SHA-256, unduh file |
| `js/format.js` | Header file hasil enkripsi (16 byte) |
| `js/cipher.js` | **Inti algoritma**: urutan kunci, geser kunci, enkripsi, dekripsi |
| `js/analysis.js` | Benchmark waktu & uji pola blok berulang |
| `js/app.js` | Logika antarmuka |
| `tests/test.js` | 9 pengujian otomatis |

## Cara kerja singkat
1. Urutan kolom = peringkat abjad tiap huruf kunci; huruf kembar bernomor sama (LAPTOP = 2 1 4 5 3 4).
2. Data dipotong per blok (ukuran = panjang kunci x jumlah baris), blok terakhir diisi byte 0.
3. Blok ke-n memakai kunci yang digeser (n-1) huruf. Kolom bernomor unik dibaca ke bawah, kolom bernomor sama dibaca per baris.
4. Header menyimpan jumlah baris, panjang data asli, dan CRC32, sehingga dekripsi memotong pengisi dengan tepat dan mendeteksi kunci salah.

## Batasan (tulis di bagian pembahasan paper)
- Ini cipher klasik: hanya mengubah **posisi** byte, bukan nilainya. Tidak setara AES.
- Kunci berulang setiap `panjang kunci` blok, sehingga pola berkurang tetapi tidak hilang.
- CRC32 hanya pendeteksi kesalahan, bukan tanda tangan digital.
