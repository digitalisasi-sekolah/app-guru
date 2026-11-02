/**
 * UI Manager - Aplikasi Administrasi Guru & Pemantauan PBM v1.42
 * Pengembang: Pak Ajiardin (SMKN 1 Wakatobi)
 */

const UI = {
  // === MANAJEMEN TAMPILAN UMUM & TAB ===
  switchLoginTab(type) {
    const formGuru = document.getElementById('form-login-guru');
    const formAdmin = document.getElementById('form-login-admin');
    const tabs = document.querySelectorAll('#section-login .tab-btn');

    tabs.forEach(t => t.classList.remove('active'));

    if (type === 'guru') {
      formGuru.classList.remove('hidden');
      formAdmin.classList.add('hidden');
      tabs[0].classList.add('active');
    } else {
      formAdmin.classList.remove('hidden');
      formGuru.classList.add('hidden');
      tabs[1].classList.add('active');
    }
  },

  switchAdminTab(tabName) {
    const tabs = {
      monitoring: document.getElementById('admin-tab-monitoring'),
      jadwal: document.getElementById('admin-tab-jadwal'),
      import: document.getElementById('admin-tab-import')
    };

    const tabBtns = document.querySelectorAll('#section-admin .nav-tabs .tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));

    Object.keys(tabs).forEach(key => {
      if (key === tabName) {
        tabs[key].classList.remove('hidden');
      } else {
        tabs[key].classList.add('hidden');
      }
    });

    if (tabName === 'monitoring') {
      tabBtns[0].classList.add('active');
      this.loadPBMMonitoring();
    } else if (tabName === 'jadwal') {
      tabBtns[1].classList.add('active');
      if (document.getElementById('jadwal-rows-container').children.length === 0) {
        this.renderJadwalInputRow('jadwal-rows-container');
      }
    } else if (tabName === 'import') {
      tabBtns[2].classList.add('active');
    }
  },

  updateUserInterface() {
    const user = Auth.currentUser;
    const secLogin = document.getElementById('section-login');
    const secAdmin = document.getElementById('section-admin');
    const secGuru = document.getElementById('section-guru');
    const displayName = document.getElementById('user-display-name');

    if (!user) {
      secLogin.classList.remove('hidden');
      secAdmin.classList.add('hidden');
      secGuru.classList.add('hidden');
      displayName.textContent = "Guest";
      return;
    }

    secLogin.classList.add('hidden');
    displayName.textContent = user.nama || user.role;

    if (user.role === 'admin') {
      secAdmin.classList.remove('hidden');
      secGuru.classList.add('hidden');
      this.switchAdminTab('monitoring');
    } else if (user.role === 'guru') {
      secGuru.classList.remove('hidden');
      secAdmin.classList.add('hidden');
      document.getElementById('guru-nama-display').textContent = user.nama;
      document.getElementById('guru-mapel-display').textContent = user.mapel || '-';
      document.getElementById('guru-nip-display').textContent = user.nip || '-';
    }
  },

  // === HANDLER LOGIN ===
  async handleLoginAdmin(e) {
    e.preventDefault();
    const pass = document.getElementById('login-pass-admin').value;
    const res = await Auth.loginAdmin(pass);
    if (res.status === 'success') {
      this.updateUserInterface();
    } else {
      alert(res.message || 'Login Admin Gagal!');
    }
  },

  async handleLoginGuru(e) {
    e.preventDefault();
    const hp = document.getElementById('login-hp').value;
    const pass = document.getElementById('login-pass-guru').value;
    const res = await Auth.loginGuru(hp, pass);
    if (res.status === 'success') {
      this.updateUserInterface();
    } else {
      alert(res.message || 'Login Guru Gagal!');
    }
  },

  // === RENDER JADWAL DINAMIS (JAM KE-1, 2, DST) ===
  renderJadwalInputRow(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rowId = 'jadwal-row-' + Date.now();
    const html = `
      <div class="grid cols-5 jadwal-dynamic-row" id="${rowId}" style="margin-top: 10px; padding: 10px; background: #f9f9f9; border-radius: 5px;">
        <div class="field">
          <label>Jam Ke-</label>
          <input type="number" class="jadwal-jam-ke" min="1" max="15" placeholder="Contoh: 1">
        </div>
        <div class="field">
          <label>Waktu</label>
          <input type="text" class="jadwal-waktu" placeholder="07.30 - 08.15">
        </div>
        <div class="field">
          <label>Kelas</label>
          <input type="text" class="jadwal-kelas" placeholder="XI TKJ 1">
        </div>
        <div class="field">
          <label>Mata Pelajaran</label>
          <input type="text" class="jadwal-mapel" placeholder="KIK / TKJ">
        </div>
        <div class="field" style="display:flex; align-items:flex-end;">
          <button class="btn btn-danger" onclick="document.getElementById('${rowId}').remove()" style="width:100%;">✕ Hapus</button>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
  },

  // === PEMANTAUAN PBM REAL-TIME & WA REMINDER ===
  renderPBMMonitoring(monitoringData) {
    const container = document.getElementById('pbm-grid-container');
    if (!container) return;

    if (!monitoringData || monitoringData.length === 0) {
      container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #777; padding: 20px;">Tidak ada jadwal pelajaran aktif pada hari dan jam ini.</p>`;
      return;
    }

    let html = '';
    monitoringData.forEach(item => {
      const statusBg = item.isHadir ? '#e8f5e9' : '#ffebee';
      const statusBorder = item.isHadir ? '#2e7d32' : '#c62828';
      const statusBadge = item.isHadir 
        ? `<span class="status-badge" style="background:#2e7d32; color:#fff;">✅ Terisi / Ada Guru</span>`
        : `<span class="status-badge" style="background:#c62828; color:#fff;">⚠️ Kelas Kosong / Belum Masuk</span>`;

      html += `
        <div style="background: ${statusBg}; border-left: 5px solid ${statusBorder}; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
            <h4 style="margin:0; font-size:16px; color:#111;">${item.kelas}</h4>
            ${statusBadge}
          </div>
          <p style="margin: 4px 0; font-weight:bold; color:#333;">${item.mapel}</p>
          <p style="margin: 0 0 12px 0; font-size:13px; color:#555;">👨‍🏫 ${item.guruNama}</p>
          
          ${!item.isHadir ? `
            <a href="${item.waLink}" target="_blank" class="btn btn-wa" style="width:100%; font-size:13px; padding: 8px 0;">
              📱 Ingatkan via WhatsApp
            </a>
          ` : `
            <div style="font-size:12px; color:#2e7d32; text-align:center; font-style:italic; font-weight:bold;">Guru telah mengisi presensi/jurnal</div>
          `}
        </div>
      `;
    });

    container.innerHTML = html;
  },

  async loadPBMMonitoring() {
    const hari = document.getElementById('select-hari-monitor').value;
    const jamKe = document.getElementById('select-jam-monitor').value;
    
    const container = document.getElementById('pbm-grid-container');
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Memuat status kelas...</p>`;

    try {
      const response = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({
          action: "getMonitoringPBM",
          hari: hari,
          jamKe: jamKe
        })
      }).then(res => res.json());

      if (response.status === "success") {
        this.renderPBMMonitoring(response.monitoring);
      } else {
        container.innerHTML = `<p style="color:red; grid-column: 1/-1; text-align:center;">Gagal memuat data monitoring.</p>`;
      }
    } catch (err) {
      container.innerHTML = `<p style="color:red; grid-column: 1/-1; text-align:center;">Koneksi terputus / offline.</p>`;
    }
  },

  // === IMPORT CSV HANDLERS ===
  handleImportGuru() {
    const fileInput = document.getElementById('file-csv-guru');
    if (!fileInput.files[0]) return alert('Pilih file CSV Guru terlebih dahulu!');
    alert('Proses impor data Guru dimulai...');
  },

  handleImportSiswa() {
    const fileInput = document.getElementById('file-csv-siswa');
    if (!fileInput.files[0]) return alert('Pilih file CSV Siswa terlebih dahulu!');
    alert('Proses impor data Siswa dimulai...');
  }
};