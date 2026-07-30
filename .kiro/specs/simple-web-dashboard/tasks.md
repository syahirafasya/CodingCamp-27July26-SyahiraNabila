# Implementation Plan: Simple Web Dashboard

## Overview

Implementasi dilakukan dalam satu file `js/app.js` dan satu file `css/style.css` yang direferensikan dari `index.html`. Tidak ada build tools — semua kode adalah Vanilla JavaScript murni dengan namespace IIFE/objek per komponen. Urutan implementasi mengikuti lapisan dependensi: Utils → StorageManager → GreetingWidget → FocusTimer → TodoList → QuickLinks → wiring & HTML → styling → property tests.

---

## Tasks

- [x] 1. Buat struktur file proyek dan scaffolding awal
  - Buat `index.html` dengan struktur HTML5 lengkap: DOCTYPE, `<head>` (charset, viewport, title, link ke `css/style.css`), dan `<body>` dengan placeholder section untuk setiap widget (Greeting, FocusTimer, TodoList, QuickLinks), serta `<script src="js/app.js">` di akhir body
  - Buat file kosong `css/style.css` dan `js/app.js` jika belum ada
  - Di `js/app.js`, buat kerangka IIFE/namespace kosong untuk: `Utils`, `StorageManager`, `GreetingWidget`, `FocusTimer`, `TodoList`, `QuickLinks`, dan blok inisialisasi `DOMContentLoaded`
  - _Requirements: 13.1, 13.2, 13.3, 13.5_

- [x] 2. Implementasi Utils (pure functions)
  - [x] 2.1 Implementasi fungsi `escapeHTML`, `zeroPad`, `formatTime`, `getGreeting`, dan `isValidURL` di dalam namespace `Utils` di `js/app.js`
    - `escapeHTML(str)`: replace `&`, `<`, `>`, `"`, `'` dengan HTML entities
    - `zeroPad(n)`: kembalikan string dua digit (e.g. `5 → "05"`)
    - `formatTime(totalSeconds)`: format detik ke `"MM:SS"` menggunakan `zeroPad`
    - `getGreeting(hour)`: kembalikan `"Selamat Pagi"` (0–11), `"Selamat Siang"` (12–17), `"Selamat Malam"` (18–23)
    - `isValidURL(url)`: kembalikan `true` jika url diawali `"http://"` atau `"https://"`
    - _Requirements: 1.3, 1.4, 1.5, 2.10, 4.4, 9.3, 10.6_

- [x] 3. Implementasi StorageManager
  - [x] 3.1 Implementasi `StorageManager` dengan `KEYS`, `save(key, data)`, dan `load(key)` di `js/app.js`
    - `save`: gunakan `JSON.stringify` + `localStorage.setItem`; tangkap `QuotaExceededError` dan error lain; kembalikan `{success: true}` atau `{success: false, error}`
    - `load`: gunakan `localStorage.getItem` + `JSON.parse`; tangkap JSON parse error; kembalikan `{success: true, data}` atau `{success: false, error, data: null}`
    - Tangani kasus `localStorage` tidak tersedia (private browsing)
    - _Requirements: 8.1, 8.5, 11.1_


- [x] 4. Implementasi GreetingWidget
  - [x] 4.1 Implementasi `GreetingWidget` dengan `elements`, `start()`, `update()`, dan `stop()` di `js/app.js`
    - `update()`: baca `new Date()`, format jam HH:MM:SS (menggunakan `zeroPad`), format tanggal "Hari, DD Bulan YYYY" dengan nama Bahasa Indonesia, panggil `Utils.getGreeting(hour)`, update elemen DOM
    - `start()`: panggil `update()` sekali, lalu set `setInterval(update, 1000)` — simpan id ke `_intervalId`
    - `stop()`: panggil `clearInterval(_intervalId)`
    - Gunakan array nama hari dan bulan Bahasa Indonesia
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 5. Implementasi FocusTimer
  - [x] 5.1 Implementasi `FocusTimer` dengan state, elemen, `init()`, `start()`, `stop()`, `reset()`, `_tick()`, dan `_render()` di `js/app.js`
    - `DURATION = 25 * 60` (1500 detik)
    - `init()`: set `state.remaining = DURATION`, `state.running = false`, bind event listeners untuk ketiga tombol, panggil `_render()`
    - `start()`: set `state.running = true`, set `setInterval(_tick, 1000)`, panggil `_render()`
    - `stop()`: clear interval, set `state.running = false`, panggil `_render()`
    - `reset()`: panggil `stop()`, set `state.remaining = DURATION`, sembunyikan notifikasi, panggil `_render()`
    - `_tick()`: decrement `state.remaining`; jika mencapai 0 → panggil `stop()` dan tampilkan notifikasi selesai; panggil `_render()`
    - `_render()`: update display (`Utils.formatTime(state.remaining)`), disable/enable tombol Start/Stop sesuai `state.running`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

- [x] 6. Implementasi TodoList
  - [x] 6.1 Implementasi `TodoList.init()`, `addTask()`, `toggleTask()`, `render()`, dan `_persist()` di `js/app.js`
    - `init()`: muat dari `StorageManager.load(KEYS.TASKS)`; jika gagal, inisialisasi array kosong + tampilkan error; panggil `render()`
    - `addTask(text)`: trim input, tolak jika whitespace; buat objek Task (`id: crypto.randomUUID()`, `text`, `done: false`, `createdAt: Date.now()`); push ke `tasks`; kosongkan input; panggil `_persist()` dan `render()`
    - `toggleTask(id)`: temukan task by id, flip `done`; panggil `_persist()` dan `render()`
    - `render()`: bangun HTML seluruh list; gunakan `Utils.escapeHTML(task.text)`; tambahkan `text-decoration: line-through` pada task yang `done`; setiap item punya checkbox, teks, tombol Edit, tombol Hapus
    - `_persist()`: panggil `StorageManager.save(KEYS.TASKS, tasks)`; jika gagal, tampilkan pesan error non-blocking
    - Bind event: tombol "Tambah" dan Enter pada input
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 8.1, 8.2, 8.3, 8.4_

  - [x] 6.4 Implementasi `startEdit()`, `saveEdit()`, `cancelEdit()`, dan `deleteTask()` di `TodoList`
    - `startEdit(id)`: ganti tampilan task tersebut menjadi mode edit inline — tampilkan `<input>` berisi teks saat ini + tombol Simpan + tombol Batal
    - `saveEdit(id, newText)`: trim `newText`; jika whitespace, batalkan edit dan tampilkan teks asli; jika valid, update `task.text`, panggil `_persist()` dan `render()`
    - `cancelEdit(id)`: panggil `render()` untuk kembali ke tampilan normal
    - `deleteTask(id)`: tampilkan `confirm()`; jika dikonfirmasi, hapus dari array, panggil `_persist()` dan `render()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.1, 7.2, 7.3_

- [x] 7. Checkpoint — Pastikan semua logika inti berfungsi
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementasi QuickLinks
  - [x] 8.1 Implementasi `QuickLinks.init()`, `addLink()`, `deleteLink()`, `render()`, dan `_persist()` di `js/app.js`
    - `init()`: muat dari `StorageManager.load(KEYS.LINKS)`; jika gagal, inisialisasi array kosong + tampilkan error; panggil `render()`
    - `addLink(label, url)`: validasi via `Utils.isValidURL(url)` dan label non-whitespace; jika tidak valid, tampilkan pesan error inline di bawah input terkait; jika valid, buat objek Link (`id: crypto.randomUUID()`), push ke `links`, kosongkan kedua input, panggil `_persist()` dan `render()`
    - `deleteLink(id)`: hapus dari array, panggil `_persist()` dan `render()`
    - `render()`: tampilkan setiap link sebagai kartu dengan label (escapeHTML) yang dapat diklik (buka di tab baru via `target="_blank"`) dan tombol Hapus; tampilkan pesan "belum ada tautan" jika array kosong; sembunyikan pesan saat ada link
    - `_persist()`: panggil `StorageManager.save(KEYS.LINKS, links)`; jika gagal, tampilkan error non-blocking
    - Bind event: tombol "Simpan"
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 11.1, 11.2, 11.3_

  - [x] 9.1 Tambahkan blok `document.addEventListener('DOMContentLoaded', ...)` di `js/app.js` yang memanggil `GreetingWidget.start()`, `FocusTimer.init()`, `TodoList.init()`, `QuickLinks.init()` dalam urutan tersebut
    - _Requirements: 1.6, 8.2, 11.1_

  - [x] 10.1 Tambahkan markup HTML lengkap untuk setiap widget di `index.html`
    - **GreetingWidget**: elemen `#clock`, `#date`, `#greeting`
    - **FocusTimer**: elemen `#timer-display`, `#btn-start`, `#btn-stop`, `#btn-reset`, `#timer-notification`
    - **TodoList**: elemen `#todo-input`, `#btn-add-todo`, `#todo-list`
    - **QuickLinks**: elemen `#link-label`, `#link-url`, `#btn-save-link`, `#links-list`, `#error-label`, `#error-url`
    - Semua tombol menggunakan `<button>` natif; semua input punya `<label>` terhubung via `for`/`id` atau `aria-label`; checkbox menggunakan `<input type="checkbox">` natif
    - _Requirements: 12.1, 13.1_

- [x] 11. Implementasi CSS di `css/style.css`
  - [x] 11.1 Tulis CSS untuk layout utama dan semua widget
    - Layout: CSS Grid dengan gap minimal 8px; dua kolom pada viewport ≥ 1024px (media query), satu kolom di bawahnya
    - Typography: `font-size` minimal 20px untuk heading widget, minimal 14px untuk konten teks
    - Tombol: tambahkan `transition` ≤ 100ms pada `:hover` / `:focus` untuk feedback visual
    - Strikethrough: class `.done` atau selector untuk task selesai (`text-decoration: line-through`)
    - Kartu quick links, tampilan timer, form input: styling bersih dan konsisten
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 12. Checkpoint akhir — Pastikan semua tests lulus dan dashboard berfungsi penuh
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP lebih cepat
- Property tests menggunakan **fast-check** yang di-load via CDN atau Node.js — tidak ada build step yang dibutuhkan
- Setiap property test diberi tag komentar: `// Feature: simple-web-dashboard, Property N: <deskripsi>`
- Minimum 100 iterasi per property test (`fc.assert(..., {numRuns: 100})`)
- Semua task mereferensikan requirements spesifik untuk keterlacakan
- `crypto.randomUUID()` tersedia di semua browser modern — tidak perlu polyfill

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["4.1", "5.1", "6.1", "6.4", "8.1", "9.1", "10.1", "11.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "3.2", "5.2", "6.2", "6.3", "6.5"] }
  ]
}
```
