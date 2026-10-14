/* ============================================================
   PIN Lock — ล็อกแอพด้วยรหัส 4 หลัก
   ============================================================ */

const PIN = {
  entered: '',
  mode: 'unlock',
  tempPin: '',
  onChange: null,

  show(mode = 'unlock', onDone = null) {
    this.mode = mode;
    this.entered = '';
    this.onChange = onDone;
    this.render();
    document.getElementById('pinScreen').classList.add('show');
  },

  hide() {
    document.getElementById('pinScreen').classList.remove('show');
  },

  render() {
    const dots = document.getElementById('pinDots');
    dots.innerHTML = [0, 1, 2, 3].map(i =>
      `<div class="pin-dot ${i < this.entered.length ? 'filled' : ''}"></div>`
    ).join('');

    const pad = document.getElementById('pinPad');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
    pad.innerHTML = keys.map(k => {
      if (k === '') return `<button class="empty-btn"></button>`;
      return `<button onclick="PIN.press('${k}')">${k}</button>`;
    }).join('');

    const hint = document.getElementById('pinHint');
    if (this.mode === 'unlock') hint.textContent = 'ใส่รหัส PIN 4 หลัก';
    else if (this.mode === 'set') hint.textContent = 'ตั้งรหัส PIN ใหม่';
    else if (this.mode === 'confirm') hint.textContent = 'ใส่รหัส PIN อีกครั้ง';
  },

  press(k) {
    if (k === '⌫') {
      this.entered = this.entered.slice(0, -1);
    } else if (this.entered.length < 4) {
      this.entered += k;
    }
    this.render();
    if (this.entered.length === 4) {
      setTimeout(() => this.submit(), 150);
    }
  },

  submit() {
    const pin = this.entered;
    this.entered = '';
    this.render();

    if (this.mode === 'unlock') {
      if (pin === Settings.getPin()) {
        this.hide();
      } else {
        toast('รหัสไม่ถูกต้อง');
        if (navigator.vibrate) navigator.vibrate(200);
      }
    } else if (this.mode === 'set') {
      this.tempPin = pin;
      this.mode = 'confirm';
      this.render();
    } else if (this.mode === 'confirm') {
      if (pin === this.tempPin) {
        Settings.setPin(pin);
        toast('ตั้งรหัสเรียบร้อย');
        this.hide();
        if (this.onChange) this.onChange();
      } else {
        toast('รหัสไม่ตรงกัน');
        this.mode = 'set';
        this.tempPin = '';
        this.render();
      }
    }
  },

  forgot() {
    const msg = 'การรีเซ็ตจะต้องล้างข้อมูลทั้งหมดในแอพ\n\nยืนยันหรือไม่?';
    if (!confirm(msg)) return;
    if (!confirm('แน่ใจจริงๆ? ข้อมูลทั้งหมดจะหาย')) return;
    DB.clearAll().then(() => {
      Settings.remove('pin');
      alert('ล้างข้อมูลเรียบร้อย เปิดแอพใหม่');
      location.reload();
    });
  }
};