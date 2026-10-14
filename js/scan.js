/* ============================================================
   Barcode Scanner — สแกนบาร์โค้ดเพื่อเพิ่มสินค้าลงตะกร้า
   ============================================================ */

const Scanner = {
  html5Qr: null,
  active: false,
  lastScan: null,
  lastScanTime: 0,

  async open() {
    if (this.active) return;

    if (typeof Html5Qrcode === 'undefined') {
      toast('⚠️ โหลดตัวสแกนไม่สำเร็จ เช็คอินเทอร์เน็ต');
      return;
    }

    if (currentTab !== 'pos') {
      toast('สแกนได้เฉพาะหน้าขาย');
      return;
    }

    document.getElementById('scannerModal').classList.add('show');
    document.getElementById('scanStatus').textContent = '⏳ กำลังเปิดกล้อง...';

    try {
      this.html5Qr = new Html5Qrcode("scannerView");

      const config = {
        fps: 10,
        qrbox: { width: 280, height: 160 },
        aspectRatio: 1.777,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.QR_CODE
        ]
      };

      await this.html5Qr.start(
        { facingMode: "environment" },
        config,
        (decodedText) => this.onScanSuccess(decodedText),
        () => { /* ignore per-frame errors */ }
      );

      this.active = true;
      document.getElementById('scanStatus').textContent = '📷 เล็งบาร์โค้ดให้อยู่ในกรอบ';
    } catch (e) {
      console.error('Scanner error:', e);
      document.getElementById('scanStatus').textContent = '⚠️ ' + this.translateError(e);
    }
  },

  async close() {
    if (this.html5Qr && this.active) {
      try {
        await this.html5Qr.stop();
        this.html5Qr.clear();
      } catch (e) {
        console.warn('Stop error:', e);
      }
    }
    this.active = false;
    this.html5Qr = null;
    this.lastScan = null;
    document.getElementById('scannerModal').classList.remove('show');
  },

  onScanSuccess(text) {
    const now = Date.now();

    if (text === this.lastScan && now - this.lastScanTime < 1000) return;
    this.lastScan = text;
    this.lastScanTime = now;

    this.beep();

    const product = products.find(p => p.barcode === text);

    if (!product) {
      document.getElementById('scanStatus').innerHTML =
        `⚠️ ไม่พบสินค้า: <strong>${escapeHtml(text)}</strong>`;
      return;
    }

    if (product.stock <= 0) {
      document.getElementById('scanStatus').innerHTML =
        `❌ สินค้าหมด: <strong>${escapeHtml(product.name)}</strong>`;
      return;
    }

    const inCart = cart[product.id] ? cart[product.id].qty : 0;
    if (inCart + 1 > product.stock) {
      document.getElementById('scanStatus').innerHTML =
        `⚠️ สต็อกไม่พอ: <strong>${escapeHtml(product.name)}</strong> (เหลือ ${product.stock})`;
      return;
    }

    addToCart(product.id);

    document.getElementById('scanStatus').innerHTML =
      `✅ เพิ่ม: <strong>${escapeHtml(product.name)}</strong> — ${baht(product.price)}`;
  },

  beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 1200;
      osc.type = 'sine';
      gain.gain.value = 0.15;
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
      setTimeout(() => ctx.close(), 200);
    } catch (e) {
      // บาง browser ไม่รองรับ — ไม่เป็นไร
    }
  },

  translateError(e) {
    const msg = String(e && e.message ? e.message : e);
    if (msg.includes('Permission') || msg.includes('NotAllowed')) {
      return 'ยังไม่ได้อนุญาตกล้อง → กด "อนุญาต" ในเบราว์เซอร์';
    }
    if (msg.includes('NotFound') || msg.includes('no camera')) {
      return 'ไม่พบกล้องในเครื่องนี้';
    }
    if (msg.includes('NotSecure') || msg.includes('secure')) {
      return 'ต้องใช้ HTTPS (GitHub Pages ใช้ได้) หรือ localhost';
    }
    if (msg.includes('NotReadable')) {
      return 'กล้องถูกใช้โดยแอพอื่น ปิดก่อนลองใหม่';
    }
    return msg;
  }
};