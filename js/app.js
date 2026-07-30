/* Simple Web Dashboard — js/app.js */
/* Feature: simple-web-dashboard */

(function () {
  'use strict';

  // =========================================================================
  // Utils — pure functions, no side effects
  // =========================================================================
  const Utils = {
    /**
     * Sanitise a string before rendering into innerHTML to prevent XSS.
     * @param {string} str
     * @returns {string}
     */
    escapeHTML(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Pad a number to two digits.
     * @param {number} n
     * @returns {string}  e.g. 5 → "05"
     */
    zeroPad(n) {
      return String(n).padStart(2, '0');
    },

    /**
     * Format total seconds to "MM:SS".
     * @param {number} totalSeconds
     * @returns {string}  e.g. 90 → "01:30"
     */
    formatTime(totalSeconds) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return Utils.zeroPad(minutes) + ':' + Utils.zeroPad(seconds);
    },

    /**
     * Return a contextual greeting based on the hour of day.
     * @param {number} hour  0–23
     * @returns {string}  "Selamat Pagi" | "Selamat Siang" | "Selamat Malam"
     */
    getGreeting(hour) {
      if (hour >= 0 && hour <= 11) return 'Selamat Pagi';
      if (hour >= 12 && hour <= 17) return 'Selamat Siang';
      return 'Selamat Malam';
    },

    /**
     * Validate that a URL starts with "http://" or "https://".
     * @param {string} url
     * @returns {boolean}
     */
    isValidURL(url) {
      return typeof url === 'string' &&
        (url.startsWith('http://') || url.startsWith('https://'));
    },
  };

  // =========================================================================
  // StorageManager — abstraction layer over localStorage
  // =========================================================================
  const StorageManager = {
    KEYS: {
      TASKS: 'swd_tasks',
      LINKS: 'swd_links',
    },

    /**
     * Persist data to localStorage as JSON.
     * @param {string} key
     * @param {*} data
     * @returns {{ success: boolean, error?: string }}
     */
    save(key, data) {
      try {
        if (typeof localStorage === 'undefined' || localStorage === null) {
          return { success: false, error: 'Storage tidak tersedia' };
        }
        const serialised = JSON.stringify(data);
        localStorage.setItem(key, serialised);
        return { success: true };
      } catch (err) {
        // DOMException name is 'QuotaExceededError' in most browsers;
        // Firefox uses 'NS_ERROR_DOM_QUOTA_REACHED'.
        if (
          err instanceof DOMException &&
          (err.name === 'QuotaExceededError' ||
            err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        ) {
          return { success: false, error: 'Storage penuh' };
        }
        return { success: false, error: err.message || 'Gagal menyimpan data' };
      }
    },

    /**
     * Load and parse data from localStorage.
     * @param {string} key
     * @returns {{ success: boolean, data: any, error?: string }}
     */
    load(key) {
      try {
        if (typeof localStorage === 'undefined' || localStorage === null) {
          return { success: false, error: 'Storage tidak tersedia', data: null };
        }
        const raw = localStorage.getItem(key);
        if (raw === null) {
          // Key does not exist — not an error; callers initialise to empty array.
          return { success: true, data: null };
        }
        const parsed = JSON.parse(raw);
        return { success: true, data: parsed };
      } catch (err) {
        // JSON.parse threw — data is corrupt.
        return { success: false, error: 'Data tidak valid: ' + (err.message || 'JSON parse error'), data: null };
      }
    },
  };

  // =========================================================================
  // GreetingWidget — real-time clock, date, and greeting
  // =========================================================================
  const GreetingWidget = {
    _DAYS: ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    _MONTHS: [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ],

    elements: {
      clock: null,
      date: null,
      greeting: null,
    },

    _intervalId: null,

    /** Start a 1 s interval; update immediately on call. */
    start() {
      this.elements.clock    = document.getElementById('clock');
      this.elements.date     = document.getElementById('date');
      this.elements.greeting = document.getElementById('greeting');

      this.update();
      this._intervalId = setInterval(function () {
        GreetingWidget.update();
      }, 1000);
    },

    /** Update all DOM elements based on the current Date. */
    update() {
      var now     = new Date();
      var hours   = now.getHours();
      var minutes = now.getMinutes();
      var seconds = now.getSeconds();

      // Requirement 1.1 — HH:MM:SS with zero-padding
      var clockStr = Utils.zeroPad(hours) + ':' + Utils.zeroPad(minutes) + ':' + Utils.zeroPad(seconds);

      // Requirement 1.2 — "Hari, DD Bulan YYYY" in Bahasa Indonesia
      var dayName   = GreetingWidget._DAYS[now.getDay()];
      var day       = Utils.zeroPad(now.getDate());
      var monthName = GreetingWidget._MONTHS[now.getMonth()];
      var year      = now.getFullYear();
      var dateStr   = dayName + ', ' + day + ' ' + monthName + ' ' + year;

      // Requirements 1.3–1.5 — contextual greeting
      var greetingStr = Utils.getGreeting(hours);

      if (GreetingWidget.elements.clock)    GreetingWidget.elements.clock.textContent    = clockStr;
      if (GreetingWidget.elements.date)     GreetingWidget.elements.date.textContent     = dateStr;
      if (GreetingWidget.elements.greeting) GreetingWidget.elements.greeting.textContent = greetingStr;
    },

    /** Stop the interval (cleanup). */
    stop() {
      clearInterval(this._intervalId);
    },
  };

  // =========================================================================
  // FocusTimer — 25-minute Pomodoro countdown
  // =========================================================================
  const FocusTimer = {
    DURATION: 25 * 60, // 1500 seconds

    state: {
      remaining: 25 * 60,
      running: false,
    },

    elements: {
      display: null,
      btnStart: null,
      btnStop: null,
      btnReset: null,
      notification: null,
    },

    _intervalId: null,

    /** Initialise: set remaining, render, bind events. */
    init() {
      this.elements.display      = document.getElementById('timer-display');
      this.elements.btnStart     = document.getElementById('btn-start');
      this.elements.btnStop      = document.getElementById('btn-stop');
      this.elements.btnReset     = document.getElementById('btn-reset');
      this.elements.notification = document.getElementById('timer-notification');

      this.state.remaining = this.DURATION;
      this.state.running   = false;

      this.elements.btnStart.addEventListener('click', () => this.start());
      this.elements.btnStop.addEventListener('click',  () => this.stop());
      this.elements.btnReset.addEventListener('click', () => this.reset());

      this._render();
    },

    /** Start countdown. */
    start() {
      if (this.state.running) return;
      this.state.running = true;
      this._intervalId = setInterval(() => this._tick(), 1000);
      this._render();
    },

    /** Stop countdown, keep remaining. */
    stop() {
      clearInterval(this._intervalId);
      this._intervalId = null;
      this.state.running = false;
      this._render();
    },

    /** Reset to DURATION, hide notification. */
    reset() {
      this.stop();
      this.state.remaining = this.DURATION;
      if (this.elements.notification) {
        this.elements.notification.style.display = 'none';
        this.elements.notification.textContent   = '';
      }
      this._render();
    },

    /** Called every tick — decrement remaining, check completion. */
    _tick() {
      this.state.remaining -= 1;
      if (this.state.remaining <= 0) {
        this.state.remaining = 0;
        this.stop();
        if (this.elements.notification) {
          this.elements.notification.textContent   = 'Sesi fokus selesai! Istirahat sejenak.';
          this.elements.notification.style.display = '';
        }
      }
      this._render();
    },

    /** Update display and button states. */
    _render() {
      if (this.elements.display) {
        this.elements.display.textContent = Utils.formatTime(this.state.remaining);
      }
      if (this.elements.btnStart) {
        this.elements.btnStart.disabled = this.state.running;
      }
      if (this.elements.btnStop) {
        this.elements.btnStop.disabled = !this.state.running;
      }
    },
  };

  // =========================================================================
  // TodoList — CRUD task manager with localStorage persistence
  // =========================================================================
  const TodoList = {
    /** @type {Array<{id: string, text: string, done: boolean, createdAt: number}>} */
    tasks: [],

    elements: {
      input: null,
      btnAdd: null,
      list: null,
    },

    /** Load from storage, render. */
    init() {
      // Resolve DOM elements
      this.elements.input  = document.getElementById('todo-input');
      this.elements.btnAdd = document.getElementById('btn-add-todo');
      this.elements.list   = document.getElementById('todo-list');

      // Requirement 8.2 — load tasks from storage on startup
      const result = StorageManager.load(StorageManager.KEYS.TASKS);

      if (result.data === null) {
        // Requirement 8.3 — null means key doesn't exist; initialise silently
        this.tasks = [];
      } else if (!result.success || !Array.isArray(result.data)) {
        // Requirement 8.4 — corrupt / non-array data; show error, reset to empty
        this.tasks = [];
        this._showError('Gagal memuat data tugas: data tidak valid. Daftar tugas direset.');
      } else {
        this.tasks = result.data;
      }

      this.render();

      // Requirement 3.1 / 3.5 — bind "Tambah" button and Enter key
      var self = this;
      if (this.elements.btnAdd) {
        this.elements.btnAdd.addEventListener('click', function () {
          self.addTask(self.elements.input ? self.elements.input.value : '');
        });
      }
      if (this.elements.input) {
        this.elements.input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            self.addTask(self.elements.input.value);
          }
        });
      }
    },

    /** Validate and add a new task. */
    addTask(text) {
      // Requirement 3.4 — reject empty / whitespace-only input
      if (typeof text !== 'string' || text.trim() === '') {
        return;
      }

      // Requirement 3.2 — create task object
      var task = {
        id: crypto.randomUUID(),
        text: text.trim(),
        done: false,
        createdAt: Date.now(),
      };

      this.tasks.push(task);

      // Requirement 3.3 — clear input after adding
      if (this.elements.input) {
        this.elements.input.value = '';
      }

      this._persist();
      this.render();
    },

    /** Toggle the done status of a task. */
    toggleTask(id) {
      // Requirement 6.1 — flip done status
      var task = this.tasks.find(function (t) { return t.id === id; });
      if (task) {
        task.done = !task.done;
        this._persist();
        this.render(); // Requirement 6.2
      }
    },

    /** Enter inline-edit mode for a task.
     *  Replaces the content of the matching <li data-id="id"> with an
     *  inline edit input + Save + Cancel buttons.
     *  Requirement 5.1, 5.2
     */
    startEdit(id) {
      const li = TodoList.elements.list
        ? TodoList.elements.list.querySelector('[data-id="' + id + '"]')
        : null;
      if (!li) return;

      const task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      // Build the edit-mode markup inside the existing <li>
      // Use textContent assignment to avoid XSS in the input value
      li.innerHTML =
        '<input class="todo-edit-input" type="text" data-id="' + Utils.escapeHTML(id) + '" aria-label="Edit task">' +
        '<button class="btn-save-edit" data-action="save-edit" data-id="' + Utils.escapeHTML(id) + '">Simpan</button>' +
        '<button class="btn-cancel-edit" data-action="cancel-edit" data-id="' + Utils.escapeHTML(id) + '">Batal</button>';

      // Set value via DOM property (not innerHTML) to avoid XSS
      const editInput = li.querySelector('.todo-edit-input');
      if (editInput) {
        editInput.value = task.text;
        editInput.focus();
        // Place cursor at end
        editInput.setSelectionRange(editInput.value.length, editInput.value.length);
      }
    },

    /** Save inline edit (validate first).
     *  - If newText is empty/whitespace: cancel edit, restore original text.
     *  - If valid: update task.text, _persist(), render().
     *  Requirement 5.3, 5.4
     */
    saveEdit(id, newText) {
      const trimmed = (newText || '').trim();
      if (!trimmed) {
        // Empty/whitespace — cancel without changing anything (Req 5.4)
        TodoList.cancelEdit(id);
        return;
      }

      const task = TodoList.tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      task.text = trimmed;
      TodoList._persist();
      TodoList.render();
    },

    /** Cancel inline edit, restore original view.
     *  Requirement 5.5
     */
    cancelEdit(id) {
      TodoList.render();
    },

    /** Show confirm dialog; delete task if confirmed.
     *  Requirement 7.1, 7.2, 7.3
     */
    deleteTask(id) {
      // Req 7.1 — show confirmation dialog
      const confirmed = window.confirm('Hapus task ini?');
      if (!confirmed) {
        // Req 7.3 — user cancelled; do nothing
        return;
      }

      // Req 7.2 — remove from array and persist
      TodoList.tasks = TodoList.tasks.filter(function (t) { return t.id !== id; });
      TodoList._persist();
      TodoList.render();
    },

    /** Re-render the entire task list to the DOM. */
    render() {
      var list = this.elements.list;
      if (!list) return;

      // Remove existing event delegation listener before re-attaching
      // (use a named stored handler so we can replace it)
      if (this._listHandler) {
        list.removeEventListener('click', this._listHandler);
        list.removeEventListener('change', this._changeHandler);
      }

      // Build HTML — Requirement 4.1, 4.2, 4.3, 4.4
      var self = this;
      var html = '';

      if (this.tasks.length === 0) {
        html = '<li class="todo-empty">Belum ada tugas. Tambahkan tugas pertama Anda!</li>';
      } else {
        this.tasks.forEach(function (task) {
          var safeText = Utils.escapeHTML(task.text);
          var checkedAttr = task.done ? ' checked' : '';
          // Requirement 4.3 — strikethrough for done tasks
          var textStyle = task.done ? ' style="text-decoration: line-through;"' : '';
          var doneClass = task.done ? ' todo-item--done' : '';

          html +=
            '<li class="todo-item' + doneClass + '" data-id="' + task.id + '">' +
              '<input type="checkbox" class="todo-checkbox" data-id="' + task.id + '" data-action="toggle"' + checkedAttr + ' aria-label="Tandai selesai: ' + safeText + '">' +
              '<span class="todo-text"' + textStyle + '>' + safeText + '</span>' +
              '<div class="todo-actions">' +
                '<button class="btn-edit" data-id="' + task.id + '" data-action="edit" aria-label="Edit tugas: ' + safeText + '">Edit</button>' +
                '<button class="btn-delete" data-id="' + task.id + '" data-action="delete" aria-label="Hapus tugas: ' + safeText + '">Hapus</button>' +
              '</div>' +
            '</li>';
        });
      }

      list.innerHTML = html;

      // Requirement 4.1 / 4.2 — event delegation for clicks (edit, delete)
      this._listHandler = function (e) {
        var target = e.target;
        var action = target.getAttribute('data-action');
        var id     = target.getAttribute('data-id');
        if (!action || !id) return;

        if (action === 'edit')        self.startEdit(id);
        if (action === 'delete')      self.deleteTask(id);
        if (action === 'save-edit') {
          var editInput = e.target.closest('li') && e.target.closest('li').querySelector('.todo-edit-input');
          self.saveEdit(id, editInput ? editInput.value : '');
        }
        if (action === 'cancel-edit') self.cancelEdit(id);
      };

      // Event delegation for checkbox changes (toggle)
      this._changeHandler = function (e) {
        var target = e.target;
        if (
          target.tagName === 'INPUT' &&
          target.type === 'checkbox' &&
          target.getAttribute('data-action') === 'toggle'
        ) {
          var id = target.getAttribute('data-id');
          if (id) self.toggleTask(id);
        }
      };

      list.addEventListener('click',  this._listHandler);
      list.addEventListener('change', this._changeHandler);
    },

    /** Persist tasks to StorageManager. */
    _persist() {
      var result = StorageManager.save(StorageManager.KEYS.TASKS, this.tasks);
      if (!result.success) {
        // Requirement 8.1 / _persist error — non-blocking inline error
        this._showError('Gagal menyimpan tugas: ' + (result.error || 'Terjadi kesalahan'));
      } else {
        this._clearError();
      }
    },

    /** Show a non-blocking inline error message above the list. */
    _showError(message) {
      var errorId = 'todo-error-msg';
      var existing = document.getElementById(errorId);
      if (!existing) {
        existing = document.createElement('p');
        existing.id = errorId;
        existing.setAttribute('role', 'alert');
        existing.style.cssText = 'color:#c0392b;font-size:0.875rem;margin:4px 0 8px;';
        var list = this.elements.list;
        if (list && list.parentNode) {
          list.parentNode.insertBefore(existing, list);
        }
      }
      existing.textContent = message;
    },

    /** Remove the inline error message if present. */
    _clearError() {
      var existing = document.getElementById('todo-error-msg');
      if (existing) existing.remove();
    },
  };

  // =========================================================================
  // QuickLinks — bookmark manager with localStorage persistence
  // =========================================================================
  const QuickLinks = {
    /** @type {Array<{id: string, label: string, url: string}>} */
    links: [],

    elements: {
      inputLabel: null,
      inputURL: null,
      btnSave: null,
      list: null,
      errorLabel: null,
      errorURL: null,
    },

    /** Load from storage, render, bind events. */
    init() {
      // Resolve DOM elements
      this.elements.inputLabel = document.getElementById('link-label');
      this.elements.inputURL   = document.getElementById('link-url');
      this.elements.btnSave    = document.getElementById('btn-save-link');
      this.elements.list       = document.getElementById('links-list');
      this.elements.errorLabel = document.getElementById('error-label');
      this.elements.errorURL   = document.getElementById('error-url');

      // Load persisted links — Requirements 11.1–11.3
      const result = StorageManager.load(StorageManager.KEYS.LINKS);

      if (result.data === null) {
        // Key didn't exist or storage unavailable when data is null
        if (!result.success) {
          // Storage unavailable on load (not a corrupt-data case — handle below)
          this.links = [];
          this._showStorageError('Gagal memuat tautan: ' + result.error);
        } else {
          // Requirement 11.2 — null means no data yet; init to empty, no error
          this.links = [];
        }
      } else if (!result.success || !Array.isArray(result.data)) {
        // Requirement 11.3 — corrupt / non-array data → empty + show error
        this.links = [];
        this._showStorageError('Data tautan tidak valid. Daftar dikosongkan.');
      } else {
        this.links = result.data;
      }

      this.render();

      // Bind "Simpan" button — Requirement 9.1
      this.elements.btnSave.addEventListener('click', () => {
        QuickLinks.addLink(
          QuickLinks.elements.inputLabel.value,
          QuickLinks.elements.inputURL.value
        );
      });

      // Event delegation for delete buttons — Requirement 10.3
      this.elements.list.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action="delete"]');
        if (btn) {
          QuickLinks.deleteLink(btn.dataset.id);
        }
      });
    },

    /** Validate and add a new link. Requirements 9.2–9.7 */
    addLink(label, url) {
      const trimmedLabel = label.trim();
      const trimmedURL   = url.trim();

      let hasError = false;

      // Requirement 9.2 / 9.4 — validate label
      if (trimmedLabel.length === 0) {
        this.elements.errorLabel.textContent = 'Label tidak boleh kosong.';
        this.elements.errorLabel.hidden = false;
        hasError = true;
      } else {
        this.elements.errorLabel.hidden = true;
        this.elements.errorLabel.textContent = '';
      }

      // Requirement 9.3 / 9.5 — validate URL
      if (!Utils.isValidURL(trimmedURL)) {
        this.elements.errorURL.textContent = 'URL tidak valid. Harus diawali http:// atau https://.';
        this.elements.errorURL.hidden = false;
        hasError = true;
      } else {
        this.elements.errorURL.hidden = true;
        this.elements.errorURL.textContent = '';
      }

      if (hasError) return;

      // Requirement 9.6 — both valid; create link object and push
      /** @type {{id: string, label: string, url: string}} */
      const link = {
        id:    crypto.randomUUID(),
        label: trimmedLabel,
        url:   trimmedURL,
      };

      this.links.push(link);

      // Clear inputs and hide errors
      this.elements.inputLabel.value = '';
      this.elements.inputURL.value   = '';
      this.elements.errorLabel.hidden = true;
      this.elements.errorURL.hidden   = true;

      // Requirement 9.7 — persist, then re-render
      this._persist();
      this.render();
    },

    /** Remove a link by id. Requirements 10.3 */
    deleteLink(id) {
      this.links = this.links.filter((link) => link.id !== id);
      this._persist();
      this.render();
    },

    /** Re-render the entire links list to the DOM. Requirements 10.1–10.6 */
    render() {
      const list = this.elements.list;
      if (!list) return;

      list.innerHTML = '';

      if (this.links.length === 0) {
        // Requirement 10.4 — show empty-state message
        const emptyMsg = document.createElement('li');
        emptyMsg.className = 'links-empty';
        emptyMsg.textContent = 'Belum ada tautan tersimpan.';
        list.appendChild(emptyMsg);
        return;
      }

      // Requirement 10.5 — hide empty-state message when links exist (achieved by not rendering it)
      this.links.forEach((link) => {
        const li = document.createElement('li');
        li.className = 'link-item';

        // Requirement 10.1 / 10.2 — label as clickable anchor, opens in new tab
        // Requirement 10.6 — escapeHTML on label to prevent XSS
        const anchor = document.createElement('a');
        anchor.href             = link.url;
        anchor.target           = '_blank';
        anchor.rel              = 'noopener noreferrer';
        anchor.textContent      = Utils.escapeHTML(link.label); // set as text, escapeHTML for safety
        anchor.className        = 'link-anchor';

        // Requirement 10.3 — delete button with data-action and data-id for event delegation
        const btnDelete = document.createElement('button');
        btnDelete.type                 = 'button';
        btnDelete.textContent          = 'Hapus';
        btnDelete.className            = 'btn-delete-link';
        btnDelete.dataset.action       = 'delete';
        btnDelete.dataset.id           = link.id;
        btnDelete.setAttribute('aria-label', 'Hapus tautan ' + Utils.escapeHTML(link.label));

        li.appendChild(anchor);
        li.appendChild(btnDelete);
        list.appendChild(li);
      });
    },

    /** Persist links to StorageManager. */
    _persist() {
      const result = StorageManager.save(StorageManager.KEYS.LINKS, this.links);
      if (!result.success) {
        this._showStorageError('Gagal menyimpan tautan: ' + result.error);
      }
    },

    /**
     * Display a non-blocking storage error message.
     * Appended after the list so it doesn't disrupt the form layout.
     * @param {string} message
     */
    _showStorageError(message) {
      // Re-use or create a persistent error banner inside the widget
      let banner = document.getElementById('ql-storage-error');
      if (!banner) {
        banner = document.createElement('p');
        banner.id        = 'ql-storage-error';
        banner.className = 'storage-error';
        banner.setAttribute('role', 'alert');
        // Insert after the links list if possible
        const list = this.elements.list;
        if (list && list.parentNode) {
          list.parentNode.insertBefore(banner, list.nextSibling);
        } else {
          document.body.appendChild(banner);
        }
      }
      banner.textContent = message;
    },
  };

  // =========================================================================
  // Initialisation — wire everything together on DOMContentLoaded
  // =========================================================================
  document.addEventListener('DOMContentLoaded', function () {
    GreetingWidget.start();
    FocusTimer.init();
    TodoList.init();
    QuickLinks.init();
  });
})();
