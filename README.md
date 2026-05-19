# KodeMetrik — Code Metric Analyzer (JS & PHP)

Website untuk menganalisis kualitas source code secara **client-side** (kode tidak dikirim ke server) dengan metrik:
- Cyclomatic Complexity (gaya McCabe / decision points)
- Halstead Software Science (operator & operand)
- Maintainability score (heuristic 0..100 berbasis CC + Halstead Volume)

## Cara kerja singkat
1. Input code via Paste / Upload File / Upload Folder.
2. Kode diparse menjadi AST (JS via Babel parser, PHP via `php-parser`).
3. Metrik dihitung **per fungsi** (nested function/closure tidak dihitung ke parent).
4. Hasil disimpan ke `localStorage` (history + latest id), lalu ditampilkan di `/results`.

## Definisi metrik (yang dipakai KodeMetrik)

### 1) Cyclomatic Complexity (CC)
KodeMetrik menghitung CC dengan pendekatan praktik static analysis:

- Base: `CC = 1`
- Lalu ditambah untuk setiap *decision point* yang ditemukan di AST:
  - `if`, loop (`for/while/do-while`), `catch`, ternary `?:`
  - `switch`: +1 untuk setiap `case` yang memiliki `test` (default tidak)
  - `&&` dan `||`: +1 per operator (short-circuit logic)

Ringkasnya: `CC = 1 + Σ(decision points)`

Catatan: “McCabe klasik” juga sering ditulis sebagai `CC = E − N + 2P` (berbasis graph). KodeMetrik memakai pendekatan decision points agar praktis di AST.

### 2) Halstead Software Science
KodeMetrik menggunakan formula inti Halstead dari hasil counting token:

**Notasi**
- `n1`: distinct operators
- `n2`: distinct operands
- `N1`: total operators
- `N2`: total operands
- `n = n1 + n2` (vocabulary)
- `N = N1 + N2` (length)

**Rumus**
- Volume: `V = N × log2(n)`
- Difficulty: `D = (n1/2) × (N2/n2)`
- Effort: `E = D × V`
- Estimated bugs: `B = V / 3000`
- Time to program (sec): `T = E / 18`

**Kenapa hasil bisa beda dengan tool lain/ChatGPT?**
Karena definisi apa yang dihitung sebagai operator/operand bisa berbeda antar implementasi (per bahasa, per AST node). KodeMetrik mendefinisikan operator/operand berbasis node AST yang didukung oleh parser.

### 3) Maintainability (MI) — heuristic KodeMetrik
KodeMetrik menampilkan skor 0..100 (semakin tinggi semakin “mudah dirawat”):

`MI = clamp(100 − 2×CC − 12×log10(1 + V), 0, 100)`

dengan `V` = Halstead Volume.

Catatan: ini **bukan** formula MI klasik (Oman/SEI/varian lain). Dipakai agar konsisten untuk perbandingan relatif antar fungsi di project yang sama.

## Batasan (MVP)
- Analisis berjalan di browser (client-side) → performa tergantung device.
- Limit input: max 5MB total, max 100 file.
- Metrik adalah pendekatan statis berbasis AST → bisa berbeda dari tool lain karena definisi counting/tokenisasi.

## Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000`.

## Referensi (konsep)
- T. J. McCabe, “A Complexity Measure”, *IEEE Transactions on Software Engineering*, 1976.
  - CC (graph): `CC = E − N + 2P`.
- M. H. Halstead, *Elements of Software Science*, 1977.
  - Vocabulary/Length/Volume/Difficulty/Effort.

## Catatan tentang “akurasi”
KodeMetrik akurat terhadap **definisi yang dipakai di repo ini** (lihat `lib/parser/*` dan `lib/metrics/*`), tetapi angka bisa berbeda dari tool lain/ChatGPT karena:
- Definisi decision point CC berbeda (mis. `&&/||` dihitung atau tidak, `switch case` dihitung bagaimana).
- Definisi operator/operand Halstead berbeda per implementasi.
- MI di KodeMetrik adalah heuristic (bukan MI klasik), sehingga tidak apple-to-apple dengan tool lain.
