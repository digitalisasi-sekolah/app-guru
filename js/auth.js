const Auth = {
  currentUser: null,

  init() {
    const saved = localStorage.getItem('guru_app_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  },

  async loginAdmin(password) {
    if (password === "admin123") {
      this.currentUser = { role: "admin", nama: "Administrator" };
      localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
      return { status: "success" };
    }
    
    // Cek Online via GAS jika ada
    try {
      const res = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ action: "loginAdmin", password })
      }).then(r => r.json());
      if (res.status === "success") {
        this.currentUser = { role: "admin", nama: "Administrator" };
        localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
      }
      return res;
    } catch(e) {
      return { status: "error", message: "Gagal terhubung ke server/offline." };
    }
  },

  async loginGuru(noHP, password) {
    try {
      const res = await fetch(CONFIG.GAS_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({ action: "loginGuru", noHP, password })
      }).then(r => r.json());

      if (res.status === "success") {
        this.currentUser = { role: "guru", ...res.guru };
        localStorage.setItem('guru_app_user', JSON.stringify(this.currentUser));
      }
      return res;
    } catch(e) {
      return { status: "error", message: "Koneksi offline. Login online dibutuhkan pertama kali." };
    }
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('guru_app_user');
    window.location.reload();
  }
};
Auth.init();