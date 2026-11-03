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
      this.loadPBMMonitoringOtomatis();
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

  // === PEMANTAUAN OTOMATIS KELAS KOSONG (TANPA FILTER) ===
  async loadPBMMonitoringOtomatis() {
    const container = document.getElementById('pbm-grid-container');
    const summaryBox = document.getElementById('pbm-summary-box');
    const timeInfo = document.getElementById('pbm-time-info');
    if (!container) return;

    // Deteksi Hari & Jam Secara Otomatis
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const now = new Date();
    const currentHari = days[now.getDay()];
    
    // Logika penentuan jam ke- berdasarkan jam sekarang
    const hour = now.getHours();
    let currentJamKe = 1;
    if (hour >= 8 && hour < 9) currentJamKe = 2;
    else if (hour >= 9 && hour < 10) currentJamKe = 3;
    else if (hour >= 10 && hour < 11) currentJamKe = 4;
    else if (hour >= 11 && hour < 12) currentJamKe = 5;
    else if (hour >= 12 && hour < 13) currentJamKe = 6;
    else if (hour >= 13) currentJamKe = 7;

    timeInfo.textContent = `Waktu Sistem: ${currentHari}, Pukul ${now.toLocaleTimeString('id-ID')} (Jam Ke-${currentJamKe})`;
    container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 20px;">Memuat status kelas otomatis...</p>`;

    try {
      const response = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          action: "getMonitoringPBM",
          hari: currentHari,
          jamKe: currentJamKe
        })
      }).then(res => res.json());

      if (response.status === "success") {
        // Filter HANYA kelas yang BELUM terisi/belum masuk
        const kelasKosong = (response.monitoring || []).filter(item => !item.isHadir);

        document.getElementById('pbm-empty-count').textContent = kelasKosong.length;

        if (kelasKosong.length === 0) {
          summaryBox.style.background = "#e8f5e9";
          summaryBox.style.borderLeftColor = "#2e7d32";
          summaryBox.innerHTML = `<div>✅ Semua kelas terdaftar pada Jam Ke-${currentJamKe} telah terisi oleh Guru.</div>`;
          container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #2e7d32; font-weight: bold; padding: 30px;">Tidak ada kelas kosong saat ini.</p>`;
          return;
        }

        summaryBox.style.background = "#fff3e0";
        summaryBox.style.borderLeftColor = "#f57c00";
        summaryBox.innerHTML = `<div>⚠️ Terdapat <strong>${kelasKosong.length}</strong> kelas yang <strong>belum terisi / belum ada guru</strong> pada Jam Ke-${currentJamKe}.</div>`;

        let html = '';
        kelasKosong.forEach(item => {
          html += `
            <div style="background: #ffebee; border-left: 5px solid #c62828; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 8px;">
                <h4 style="margin:0; font-size:16px; color:#111;">${item.kelas}</h4>
                <span class="status-badge" style="background:#c62828; color:#fff;">⚠️ Kelas Kosong</span>
              </div>
              <p style="margin: 4px 0; font-weight:bold; color:#333;">${item.mapel}</p>
              <p style="margin: 0 0 12px 0; font-size:13px; color:#555;">👨‍🏫 Guru: <strong>${item.guruNama}</strong></p>
              
              <a href="${item.waLink}" target="_blank" class="btn btn-wa" style="width:100%; font-size:13px; padding: 8px 0;">
                📱 Ingatkan via WhatsApp
              </a>
            </div>
          `;
        });

        container.innerHTML = html;
      } else {
        container.innerHTML = `<p style="color:red; grid-column: 1/-1; text-align:center;">Gagal memuat data monitoring.</p>`;
      }
    } catch (err) {
      container.innerHTML = `<p style="color:red; grid-column: 1/-1; text-align:center;">Koneksi terputus / offline.</p>`;
    }
  },

  // === UNDUH TEMPLATE CSV (GURU & SISWA) ===
  downloadTemplateCSV(type) {
    let csvContent = "";
    let fileName = "";

    if (type === 'guru') {
      csvContent = "Nama,NIP,No_HP,Mapel,Jurusan\n" +
                   "Ajiardin S.T. Gr.,198501012010011001,085298875399,Kreativitas Inovasi dan Kewirausahaan,TKJ\n" +
                   "Farida S.Pi. Gr.,199603072023212032,081234567890,Dasar-Dasar Agribisnis,APAT\n" +
                   "Nining Suhartini,199001012022012001,082345678901,Perhotelan,Perhotelan";
      fileName = "Template_Data_Guru.csv";
    } else if (type === 'siswa') {
      csvContent = "Nama,Kelas,NISN,Tingkat_Fase\n" +
                   "Salfian Lina Saputri,XI TKJ 1,0051234567,Fase F\n" +
                   "Ahmad Dahlan,XI TKJ 1,0051234568,Fase F\n" +
                   "Siti Nurhaliza,XI PH 2,0051234569,Fase F";
      fileName = "Template_Data_Siswa.csv";
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // === HANDLER IMPORT CSV ===
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