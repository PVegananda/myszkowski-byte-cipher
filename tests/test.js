// Jalankan: node tests/test.js
const assert = require("assert");
["utils", "format", "cipher", "analysis"].forEach((f) => require("../js/" + f + ".js"));
const { Cipher: C, Format: F, Utils: U } = MYSZ;
const bytes = (s) => new TextEncoder().encode(s);
const text = (b) => new TextDecoder().decode(b);
let n = 0;
const test = (name, fn) => { fn(); console.log("OK  " + name); n++; };

test("urutan kunci LAPTOP = 2 1 4 5 3 4", () => assert.deepStrictEqual(C.computeOrder("LAPTOP"), [2, 1, 4, 5, 3, 4]));
test("kunci digeser: APTOPL = 1 4 5 3 4 2", () => assert.deepStrictEqual(C.computeOrder(C.rotateKey("LAPTOP", 1)), [1, 4, 5, 3, 4, 2]));
test("vektor uji kunci berputar", () => {
  const e = C.encrypt(bytes("SAYAKULIAHDIBUDIDARMAXXX"), { key: "LAPTOP", rows: 2, rolling: true });
  assert.strictEqual(text(F.unpack(e).payload), "AISLKDYUAIAHBRAXIXUDMXDA");
});
test("vektor uji kunci tetap", () => {
  const e = C.encrypt(bytes("SAYAKULIAHDIBUDIDARMAXXX"), { key: "LAPTOP", rows: 2, rolling: false });
  assert.strictEqual(text(F.unpack(e).payload), "AISLKDYUAIAHUMBRDXDAAXIX");
});
test("round-trip berbagai ukuran & mode", () => {
  for (const len of [0, 1, 11, 12, 13, 1000, 65537])
    for (const rolling of [true, false])
      for (const [key, rows] of [["LAPTOP", 2], ["BUKU", 1], ["Pasyah#1", 7]]) {
        const d = U.randomBytes(len);
        assert.deepStrictEqual(C.decrypt(C.encrypt(d, { key, rows, rolling }), { key }), d);
      }
});
test("kunci salah terdeteksi", () => {
  const e = C.encrypt(bytes("rahasia sekali"), { key: "LAPTOP", rows: 2 });
  assert.throws(() => C.decrypt(e, { key: "TOPLAP" }), /CRC32|salah/);
});
test("file bukan hasil enkripsi ditolak", () => assert.throws(() => C.decrypt(bytes("halo dunia, bukan mysz"), { key: "LAPTOP" }), /header/));
test("kunci tidak valid ditolak", () => {
  assert.throws(() => C.encrypt(bytes("a"), { key: "A", rows: 2 }));
  assert.throws(() => C.encrypt(bytes("a"), { key: "AAAA", rows: 2 }));
});
test("uji pola: kunci berputar > kunci tetap", () => {
  const r = MYSZ.Analysis.patternTest({ key: "LAPTOP", rows: 2 }, 60);
  assert.strictEqual(r.fixed, 1);
  assert.ok(r.rolling > 1);
});
console.log(`\n${n} pengujian lulus.`);
