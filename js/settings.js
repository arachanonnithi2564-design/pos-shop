/* ============================================================
   Settings Store — เก็บค่าตั้งค่าใน localStorage
   ============================================================ */

const Settings = {
  get(key, def = null) {
    const v = localStorage.getItem('pos_' + key);
    return v === null ? def : v;
  },
  set(key, val) {
    localStorage.setItem('pos_' + key, val);
  },
  remove(key) {
    localStorage.removeItem('pos_' + key);
  },
  shopName() { return this.get('shop_name', 'ร้านของฉัน'); },
  promptpay() { return this.get('promptpay', ''); },
  hasPin() { return !!this.get('pin'); },
  getPin() { return this.get('pin'); },
  setPin(pin) { this.set('pin', pin); }
};