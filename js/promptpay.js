/* ============================================================
   PromptPay — สร้าง payload สำหรับ QR Code
   ============================================================ */

const PromptPay = {
  crc16(s) {
    let crc = 0xFFFF;
    for (let i = 0; i < s.length; i++) {
      crc ^= s.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  },

  field(tag, value) {
    return tag + String(value.length).padStart(2, '0') + value;
  },

  generate(rawId, amount) {
    const digits = (rawId || '').replace(/[^0-9]/g, '');
    let merchant = this.field('00', 'A000000677010111');

    if (digits.length === 13 && digits.startsWith('0066')) {
      merchant += this.field('01', digits);
    } else if (digits.length === 10 && digits.startsWith('0')) {
      merchant += this.field('01', '0066' + digits.slice(1));
    } else if (digits.length === 13) {
      merchant += this.field('02', digits);
    } else if (digits.length === 15 && digits.startsWith('0066')) {
      merchant += this.field('01', digits);
    } else {
      throw new Error('พร้อมเพย์ไม่ถูกต้อง: ต้องเป็นเบอร์ 10 หลัก หรือเลขบัตร ปชช. 13 หลัก');
    }

    let payload = '';
    payload += this.field('00', '01');
    payload += this.field('01', '12');
    payload += this.field('29', merchant);
    payload += this.field('53', '764');
    payload += this.field('54', Number(amount).toFixed(2));
    payload += this.field('58', 'TH');

    const withoutCrc = payload + '6304';
    return withoutCrc + this.crc16(withoutCrc);
  }
};