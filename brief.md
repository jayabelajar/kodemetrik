# PROJECT BRIEF — CODE METRIC ANALYZER

## Overview
Code Metric Analyzer adalah website untuk menganalisis kualitas source code menggunakan:
- Cyclomatic Complexity (McCabe)
- Halstead Metrics

Website ini memungkinkan user melakukan analisis kode secara cepat melalui:
1. Copy-paste source code
2. Upload file
3. Upload folder

Fokus awal:
- JavaScript
- PHP

Deployment target:
- Vercel

---

# Objective

Membantu:
- mahasiswa
- developer
- QA engineer
- penulis paper/software testing

untuk:
- mengetahui tingkat kompleksitas kode
- mengukur maintainability
- mendeteksi kode yang sulit diuji
- mendapatkan insight refactor sederhana

---

# Main Features

## 1. Analysis Mode

### A. Paste Source Code
User dapat menempelkan source code langsung ke editor.

### B. Upload File
User dapat upload:
- .js
- .ts (opsional nanti)
- .php

### C. Upload Folder
User dapat upload folder project kecil untuk dianalisis sekaligus.

---

# Metrics

## 1. Cyclomatic Complexity

Menghitung:
- if
- else if
- for
- while
- do while
- switch
- case
- catch
- &&
- ||

Output:
- nilai complexity
- status complexity
- rekomendasi sederhana

Kategori:
- 1–10 → Good
- 11–20 → Medium
- >20 → High Complexity

---

## 2. Halstead Metrics

Menghitung:
- operator unik
- operand unik
- total operator
- total operand

Output:
- vocabulary
- length
- volume
- difficulty
- effort
- estimated bugs

---

# Main Workflow

User membuka website
↓
Pilih mode:
- Paste Code
- Upload File
- Upload Folder
↓
Pilih bahasa:
- JavaScript
- PHP
↓
Klik Analyze
↓
System parsing source code
↓
System menghitung:
- Cyclomatic Complexity
- Halstead Metrics
↓
Result ditampilkan

---

# Output Result

## Summary
- total files
- total functions
- average complexity
- average maintainability

## Detail Per Function
- function name
- cyclomatic score
- halstead score
- status

## Recommendation
Contoh:
- "Function terlalu kompleks"
- "Pisahkan validasi menjadi function terpisah"
- "Kurangi nested conditional"

---

# UI Pages

## 1. Landing Page
Isi:
- hero section
- penjelasan metric
- fitur website
- tombol analyze

## 2. Analyzer Page
Isi:
- mode selector
- upload area
- code editor
- language selector
- analyze button

## 3. Result Section
Isi:
- summary cards
- metric tables
- recommendation cards

---

# Tech Stack

Frontend:
- Next.js
- TypeScript
- Tailwind CSS

Parsing:
- Babel Parser (JavaScript)
- PHP Parser

Hosting:
- Vercel

Optional:
- Monaco Editor
- Shadcn UI

---

# Suggested Architecture

Client:
- upload file/folder
- input code
- render UI

Analyzer Engine:
- parser
- cyclomatic calculator
- halstead calculator

Result Engine:
- scoring
- recommendation
- visualization

---

# Folder Structure

code-metric-analyzer/
│
├── app/
│   ├── page.tsx
│   ├── analyzer/
│   └── api/
│
├── components/
│   ├── CodeEditor.tsx
│   ├── FileUpload.tsx
│   ├── FolderUpload.tsx
│   ├── ResultCard.tsx
│   └── MetricTable.tsx
│
├── lib/
│   ├── parser/
│   ├── metrics/
│   ├── analyzer/
│   └── recommendation/
│
├── types/
│
├── public/
│
└── package.json

---

# MVP Scope

Version 1:
- JavaScript support
- PHP support
- paste code
- upload file
- upload folder
- cyclomatic calculation
- halstead calculation
- simple recommendation
- responsive UI
- deploy to Vercel

---

# Limitation for MVP

- belum support project besar
- belum support multi-language advanced parsing
- belum support authentication
- belum support save history
- belum support export PDF

---

# Future Features

- AI code recommendation
- Maintainability Index
- Cognitive Complexity
- Export PDF
- GitHub repository analysis
- Team dashboard
- History analysis
- Code comparison
- Visualization graph
- CI/CD integration

---

# Vercel Optimization Notes

Karena deployment menggunakan Vercel:
- analisis lebih baik dilakukan client-side
- batasi ukuran upload
- batasi jumlah file
- hindari parsing project terlalu besar

Rekomendasi limit:
- max 5 MB
- max 100 file

---

# Final Goal

Membuat platform lightweight untuk analisis kualitas source code berbasis web yang:
- mudah digunakan
- gratis di-host
- cocok untuk pembelajaran QA/testing
- modern
- scalable untuk pengembangan fitur lanjutan