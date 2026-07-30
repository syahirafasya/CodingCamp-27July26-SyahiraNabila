# Requirements Document

## Introduction

Simple Web Dashboard adalah aplikasi web mandiri (standalone) yang berjalan sepenuhnya di browser tanpa backend server. Dashboard ini dibuat menggunakan HTML, CSS, dan Vanilla JavaScript murni, dengan semua data disimpan menggunakan browser Local Storage API. Fitur utama mencakup: tampilan waktu dan salam dinamis (Greeting), Focus Timer berbasis Pomodoro 25 menit, daftar tugas (To-Do List) dengan operasi CRUD penuh, dan Quick Links untuk mengakses situs favorit. Aplikasi harus kompatibel dengan browser modern (Chrome, Firefox, Edge, Safari) dan dapat digunakan sebagai web app standalone maupun browser extension.

---

## Glossary

- **Dashboard**: Halaman utama aplikasi yang menampung semua widget.
- **Greeting_Widget**: Komponen yang menampilkan jam real-time, tanggal, dan salam kontekstual.
- **Focus_Timer**: Komponen countdown 25 menit (Pomodoro) dengan kontrol start, stop, dan reset.
- **Todo_List**: Komponen manajemen tugas dengan operasi tambah, edit, tandai selesai, dan hapus.
- **Quick_Links**: Komponen penyimpanan tautan favorit yang dapat ditambah dan dihapus.
- **Storage_Manager**: Lapisan abstraksi di atas browser Local Storage API untuk operasi baca/tulis data.
- **Task**: Satu item tugas dalam Todo_List, berisi teks, status selesai, dan timestamp pembuatan.
- **Link**: Satu item tautan dalam Quick_Links, berisi label dan URL.
- **Time_Period**: Rentang waktu dalam sehari — Pagi (00:00–11:59), Siang (12:00–17:59), Malam (18:00–23:59).
- **Local_Storage**: Browser Local Storage API yang digunakan untuk persistensi data sisi klien.
- **Validator**: Komponen logika yang memvalidasi input sebelum data disimpan atau diproses.

---

## Requirements

### Requirement 1: Tampilan Waktu dan Salam Real-Time

**User Story:** As a pengguna, I want melihat jam, tanggal, dan salam yang sesuai waktu saat ini, so that saya langsung tahu waktu dan merasa disambut saat membuka dashboard.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL menampilkan jam dalam format HH:MM:SS dengan zero-padding dua digit untuk jam, menit, dan detik.
2. THE Greeting_Widget SHALL menampilkan tanggal dalam format "Hari, DD Bulan YYYY" menggunakan nama hari dan bulan dalam Bahasa Indonesia.
3. WHEN jam berada pada rentang 00:00–11:59, THE Greeting_Widget SHALL menampilkan teks salam "Selamat Pagi".
4. WHEN jam berada pada rentang 12:00–17:59, THE Greeting_Widget SHALL menampilkan teks salam "Selamat Siang".
5. WHEN jam berada pada rentang 18:00–23:59, THE Greeting_Widget SHALL menampilkan teks salam "Selamat Malam".
6. THE Greeting_Widget SHALL memperbarui jam setiap 1000 milidetik menggunakan setInterval.

---

### Requirement 2: Focus Timer 25 Menit

**User Story:** As a pengguna, I want menggunakan timer countdown 25 menit, so that saya dapat bekerja dalam sesi fokus terstruktur mengikuti teknik Pomodoro.

#### Acceptance Criteria

1. THE Focus_Timer SHALL menampilkan waktu tersisa dalam format MM:SS dengan nilai awal 25:00.
2. WHEN tombol Start ditekan dan timer tidak sedang berjalan, THE Focus_Timer SHALL memulai countdown dengan interval 1000 milidetik.
3. WHILE timer sedang berjalan, THE Focus_Timer SHALL menonaktifkan (disabled) tombol Start.
4. WHILE timer sedang berjalan, THE Focus_Timer SHALL mengaktifkan (enabled) tombol Stop.
5. WHEN tombol Stop ditekan, THE Focus_Timer SHALL menghentikan countdown dan mempertahankan waktu tersisa saat itu.
6. WHEN tombol Reset ditekan, THE Focus_Timer SHALL menghentikan countdown dan mengembalikan waktu tersisa ke 25:00.
7. WHEN waktu tersisa mencapai 00:00, THE Focus_Timer SHALL menghentikan countdown secara otomatis.
8. WHEN waktu tersisa mencapai 00:00, THE Focus_Timer SHALL menampilkan pesan notifikasi bahwa sesi selesai.
9. WHEN tombol Reset ditekan, THE Focus_Timer SHALL menyembunyikan pesan notifikasi sesi selesai.
10. THE Focus_Timer SHALL memformat jumlah detik ke representasi MM:SS dengan zero-padding dua digit untuk menit dan detik.

---

### Requirement 3: Menambah Task

**User Story:** As a pengguna, I want menambahkan task baru ke daftar tugas, so that saya dapat mencatat pekerjaan yang perlu dilakukan.

#### Acceptance Criteria

1. THE Todo_List SHALL menyediakan sebuah input teks dan tombol "Tambah" untuk memasukkan task baru.
2. WHEN tombol "Tambah" ditekan dan input teks mengandung minimal satu karakter non-spasi, THE Todo_List SHALL menambahkan task baru ke akhir daftar.
3. WHEN task baru ditambahkan, THE Todo_List SHALL mengosongkan isi input teks.
4. WHEN tombol "Tambah" ditekan dan input teks hanya berisi spasi atau kosong, THE Todo_List SHALL tidak menambahkan task dan tidak mengosongkan input.
5. WHEN tombol Enter ditekan di dalam input teks, THE Todo_List SHALL melakukan aksi yang sama seperti menekan tombol "Tambah".

---

### Requirement 4: Menampilkan Daftar Task

**User Story:** As a pengguna, I want melihat semua task yang telah disimpan, so that saya dapat memantau daftar pekerjaan saya.

#### Acceptance Criteria

1. THE Todo_List SHALL merender ulang seluruh daftar task setiap kali ada perubahan data (tambah, edit, hapus, toggle).
2. THE Todo_List SHALL menampilkan setiap task dengan: checkbox status selesai, teks task, tombol Edit, dan tombol Hapus.
3. WHEN task memiliki status selesai (done = true), THE Todo_List SHALL menampilkan teks task dengan strikethrough (text-decoration: line-through).
4. THE Todo_List SHALL menghindari XSS dengan menggunakan escapeHTML pada semua teks task sebelum dirender ke DOM.

---

### Requirement 5: Mengedit Task

**User Story:** As a pengguna, I want mengubah teks task yang sudah ada, so that saya dapat memperbarui detail pekerjaan.

#### Acceptance Criteria

1. WHEN tombol Edit pada sebuah task ditekan, THE Todo_List SHALL mengganti tampilan task tersebut menjadi mode edit inline dengan input teks yang berisi teks task saat ini.
2. WHILE sebuah task berada dalam mode edit, THE Todo_List SHALL menampilkan tombol "Simpan" dan tombol "Batal".
3. WHEN tombol "Simpan" ditekan dan input edit mengandung minimal satu karakter non-spasi, THE Todo_List SHALL memperbarui teks task dan keluar dari mode edit.
4. WHEN tombol "Simpan" ditekan dan input edit hanya berisi spasi atau kosong, THE Todo_List SHALL membatalkan edit dan menampilkan teks task asli tanpa perubahan.
5. WHEN tombol "Batal" ditekan, THE Todo_List SHALL membatalkan edit dan mengembalikan tampilan task ke mode normal.

---

### Requirement 6: Menandai Task Selesai

**User Story:** As a pengguna, I want menandai task sebagai selesai atau belum selesai, so that saya dapat melacak progres pekerjaan saya.

#### Acceptance Criteria

1. WHEN checkbox pada sebuah task dicentang atau dihapus centangnya, THE Todo_List SHALL mengubah status done task tersebut menjadi nilai yang berlawanan (toggle).
2. WHEN status done task diubah, THE Todo_List SHALL merender ulang tampilan task untuk mencerminkan perubahan status.

---

### Requirement 7: Menghapus Task

**User Story:** As a pengguna, I want menghapus task dari daftar, so that saya dapat membersihkan tugas yang tidak relevan.

#### Acceptance Criteria

1. WHEN tombol Hapus pada sebuah task ditekan, THE Todo_List SHALL menampilkan dialog konfirmasi kepada pengguna.
2. WHEN pengguna mengkonfirmasi penghapusan, THE Todo_List SHALL menghapus task tersebut dari daftar dan menyimpan perubahan ke Local_Storage.
3. WHEN pengguna membatalkan konfirmasi, THE Todo_List SHALL tidak melakukan perubahan apapun pada daftar.

---

### Requirement 8: Persistensi Task ke Local Storage

**User Story:** As a pengguna, I want task saya tersimpan secara permanen di browser, so that data tidak hilang saat halaman di-refresh atau browser ditutup.

#### Acceptance Criteria

1. WHEN sebuah task ditambahkan, diedit, statusnya diubah, atau dihapus, THE Storage_Manager SHALL menyimpan seluruh array task ke Local_Storage menggunakan JSON serialization.
2. WHEN Dashboard dimuat (DOMContentLoaded), THE Todo_List SHALL memuat data task dari Local_Storage dan merender daftar task.
3. WHEN data task di Local_Storage tidak ada (null), THE Todo_List SHALL menginisialisasi daftar task sebagai array kosong tanpa menampilkan pesan error.
4. IF data task di Local_Storage berformat JSON yang tidak valid atau bukan berupa array, THEN THE Todo_List SHALL menginisialisasi daftar task sebagai array kosong dan menampilkan pesan error kepada pengguna.
5. IF operasi penyimpanan ke Local_Storage gagal (misalnya karena quota penuh), THEN THE Storage_Manager SHALL mengembalikan objek hasil dengan properti success bernilai false dan properti error berisi pesan kesalahan.

---

### Requirement 9: Menambah Quick Link

**User Story:** As a pengguna, I want menyimpan tautan ke situs favorit, so that saya dapat mengaksesnya dengan cepat dari dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL menyediakan input teks untuk label dan input URL untuk alamat tautan, serta tombol "Simpan".
2. WHEN tombol "Simpan" ditekan, THE Validator SHALL memvalidasi bahwa input label mengandung minimal satu karakter non-spasi.
3. WHEN tombol "Simpan" ditekan, THE Validator SHALL memvalidasi bahwa input URL dimulai dengan "http://" atau "https://".
4. IF label kosong atau hanya berisi spasi, THEN THE Quick_Links SHALL menampilkan pesan error di bawah input label.
5. IF URL tidak valid (tidak diawali "http://" atau "https://"), THEN THE Quick_Links SHALL menampilkan pesan error di bawah input URL.
6. WHEN semua validasi lulus, THE Quick_Links SHALL menambahkan link baru ke daftar dan mengosongkan kedua input.
7. THE Quick_Links SHALL menyimpan link ke Local_Storage setiap kali link baru ditambahkan.

---

### Requirement 10: Menampilkan dan Menghapus Quick Link

**User Story:** As a pengguna, I want melihat dan mengelola tautan yang tersimpan, so that saya dapat mengakses atau menghapus tautan favorit.

#### Acceptance Criteria

1. THE Quick_Links SHALL menampilkan setiap link sebagai kartu yang berisi teks label yang dapat diklik dan tombol Hapus.
2. WHEN label link diklik, THE Quick_Links SHALL membuka URL tautan di tab baru browser.
3. WHEN tombol Hapus pada sebuah link ditekan, THE Quick_Links SHALL menghapus link tersebut dari daftar dan menyimpan perubahan ke Local_Storage.
4. WHILE tidak ada link tersimpan, THE Quick_Links SHALL menampilkan pesan informasi bahwa belum ada tautan.
5. WHEN link pertama ditambahkan, THE Quick_Links SHALL menyembunyikan pesan "belum ada tautan".
6. THE Quick_Links SHALL menghindari XSS dengan menggunakan escapeHTML pada label sebelum dirender ke DOM.

---

### Requirement 11: Persistensi Quick Links ke Local Storage

**User Story:** As a pengguna, I want quick links saya tersimpan secara permanen, so that tautan favorit tidak hilang setelah refresh.

#### Acceptance Criteria

1. WHEN Dashboard dimuat (DOMContentLoaded), THE Quick_Links SHALL memuat data link dari Local_Storage dan merender daftar link.
2. WHEN data link di Local_Storage tidak ada (null), THE Quick_Links SHALL menginisialisasi daftar link sebagai array kosong tanpa menampilkan pesan error.
3. IF data link di Local_Storage berformat JSON yang tidak valid atau bukan berupa array, THEN THE Quick_Links SHALL menginisialisasi daftar link sebagai array kosong dan menampilkan pesan error kepada pengguna.

---

### Requirement 12: Tata Letak dan Desain Visual

**User Story:** As a pengguna, I want dashboard memiliki tampilan yang bersih dan rapi di berbagai ukuran layar, so that pengalaman penggunaan terasa nyaman dan profesional.

#### Acceptance Criteria

1. THE Dashboard SHALL menggunakan CSS Grid dengan jarak antar widget minimal 8px untuk semua ukuran layar.
2. THE Dashboard SHALL menggunakan font-size minimal 20px untuk heading widget dan minimal 14px untuk konten teks.
3. WHEN lebar viewport mencapai minimal 1024px, THE Dashboard SHALL menampilkan widget dalam tata letak dua kolom tanpa tumpang tindih.
4. WHEN pengguna mengarahkan pointer ke tombol interaktif, THE Dashboard SHALL mengubah tampilan tombol dalam waktu tidak lebih dari 100ms sebagai umpan balik visual.

---

### Requirement 13: Struktur File dan Kompatibilitas Browser

**User Story:** As a developer, I want codebase tetap sederhana dan terstruktur, so that proyek mudah dirawat dan tidak memerlukan build tools.

#### Acceptance Criteria

1. THE Dashboard SHALL menggunakan tepat satu file CSS di dalam direktori css/.
2. THE Dashboard SHALL menggunakan tepat satu file JavaScript di dalam direktori js/.
3. THE Dashboard SHALL berjalan tanpa backend server dan tanpa proses build.
4. THE Dashboard SHALL berfungsi dengan benar di Chrome, Firefox, Edge, dan Safari versi modern tanpa polyfill tambahan.
5. THE Dashboard SHALL menggunakan hanya HTML, CSS, dan Vanilla JavaScript tanpa menggunakan framework seperti React, Vue, atau Angular.
