/* ============================================================
   Authentication — Login / Register / Logout
   ============================================================ */

const Auth = {
  mode: 'login',
  initialized: false,
  appStarted: false,

  init() {
    return new Promise((resolve) => {
      auth.onAuthStateChanged((user) => {
        if (user) {
          currentUser = user;
          currentUserId = user.uid;
          this.showApp();
        } else {
          currentUser = null;
          currentUserId = null;
          this.showLogin();
        }
        if (!this.initialized) {
          this.initialized = true;
          resolve();
        }
      });
    });
  },

  toggleMode() {
    this.mode = this.mode === 'login' ? 'register' : 'login';
    const isLogin = this.mode === 'login';

    document.getElementById('loginSubtitle').textContent =
      isLogin ? 'เข้าสู่ระบบเพื่อใช้งาน' : 'สมัครบัญชีใหม่';
    document.getElementById('loginBtn').textContent =
      isLogin ? '🔓 เข้าสู่ระบบ' : '✨ สมัครเลย';
    document.getElementById('toggleMode').textContent =
      isLogin ? 'ยังไม่มีบัญชี? สมัครใหม่' : 'มีบัญชีอยู่แล้ว? เข้าสู่ระบบ';
    document.getElementById('loginError').textContent = '';
  },

  async handleSubmit() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    errEl.textContent = '';

    if (!email || !password) {
      errEl.textContent = 'กรอกอีเมลและรหัสผ่านให้ครบ';
      return;
    }
    if (this.mode === 'register' && password.length < 6) {
      errEl.textContent = 'รหัสผ่านต้อง 6 ตัวอักษรขึ้นไป';
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ กำลังทำงาน...';

    try {
      if (this.mode === 'login') {
        await auth.signInWithEmailAndPassword(email, password);
      } else {
        await auth.createUserWithEmailAndPassword(email, password);
      }
      // onAuthStateChanged จะทำงานต่อเอง
    } catch (e) {
      errEl.textContent = this.translateError(e.code);
      btn.disabled = false;
      btn.textContent = this.mode === 'login' ? '🔓 เข้าสู่ระบบ' : '✨ สมัครเลย';
    }
  },

  async forgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();
    if (!email) {
      document.getElementById('loginError').textContent = 'กรอกอีเมลก่อน';
      return;
    }
    if (!confirm('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ' + email + ' ?')) return;
    try {
      await auth.sendPasswordResetEmail(email);
      alert('ส่งอีเมลแล้ว เช็คกล่องจดหมาย');
    } catch (e) {
      document.getElementById('loginError').textContent = this.translateError(e.code);
    }
  },

  async logout() {
    if (!confirm('ออกจากระบบ?')) return;
    try {
      await auth.signOut();
      this.appStarted = false;
      location.reload();
    } catch (e) {
      alert('เกิดข้อผิดพลาด: ' + e.message);
    }
  },

  showLogin() {
    document.getElementById('loginScreen').classList.add('show');
    document.getElementById('appContainer').style.display = 'none';
  },

  showApp() {
    document.getElementById('loginScreen').classList.remove('show');
    document.getElementById('appContainer').style.display = 'block';
    this.appStarted = true;
    initApp(); // เรียกใน app.js
  },

  translateError(code) {
    const map = {
      'auth/user-not-found': 'ไม่พบอีเมลนี้',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-email': 'อีเมลไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้ถูกใช้แล้ว',
      'auth/weak-password': 'รหัสผ่านต้อง 6 ตัวอักษรขึ้นไป',
      'auth/network-request-failed': 'ไม่มีอินเทอร์เน็ต',
      'auth/too-many-requests': 'ลองผิดหลายครั้งเกินไป รอสักครู่',
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/invalid-login-credentials': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
    };
    return map[code] || 'เกิดข้อผิดพลาด: ' + code;
  }
};