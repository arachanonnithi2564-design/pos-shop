/* ============================================================
   Barcode Scanner — สแกนบาร์โค้ดต่อเนื่องได้ (สำหรับซื้อหลายอย่าง)
   ============================================================ */

const Scanner = {
  html5Qr: null,
  active: false,
  lastScan: null,
  lastScanTime: 0,
  cooldown: 1500,        // กันสแกนซ้ำบาร์โค้ดเดิมภายใน 1.5 วิ
  scanCount: 0,          // นับจำนวนที่สแกนสำเร็จในรอบนี้

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

    this.lastScan = null;
    this.scanCount = 0;

    document.getElementById('scannerModal').classList.add('show');
    document.getElementById('scanStatus').innerHTML =
      '⏳ กำลังเปิดกล้อง...<br><span style="font-size:13px;opacity:0.7">สแกนได้ต่อเนื่อง — กด ✕ เมื่อเสร็จ</span>';

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
      document.getElementById('scanStatus').innerHTML =
        '📷 เล็งบาร์โค้ดในกรอบ — สแกนได้เรื่อยๆ<br><span style="font-size:13px;opacity:0.7">กด ✕ มุมขวาบน เมื่อสแกนเสร็จ</span>';
    } catch (e) {
      console.error('Scanner error:', e);
      document.getElementById('scanStatus').textContent = '⚠️ ' + this.translateError(e);
      this.active = false;
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

    // กลับมาหน้า POS (อัปเดต cart bar)
    updateCartBar();

    // ถ้ามีสินค้าในตะกร้า → แจ้ง + แสดงปุ่มจ่ายเงิน
    if (this.scanCount > 0) {
      setTimeout(() => {
        toast(`✅ สแกนแล้ว ${this.scanCount} รายการ — กด "จ่ายเงิน" เพื่อชำระ`);
      }, 100);
    }
  },

  onScanSuccess(text) {
    const now = Date.now();

    // 🚫 กันสแกนซ้ำบาร์โค้ดเดิมภายใน cooldown
    if (text === this.lastScan && now - this.lastScanTime < this.cooldown) {
      return;
    }

    this.lastScan = text;
    this.lastScanTime = now;

    this.beep();

    const product = products.find(p => p.barcode === text);

    // ❌ ไม่พบสินค้า
    if (!product) {
      this.showStatus(`⚠️ ไม่พบสินค้า: <strong>${escapeHtml(text)}</strong>`, '#fbbf24');
      return;
    }

    // ❌ สินค้าหมด
    if (product.stock <= 0) {
      this.showStatus(`❌ สินค้าหมด: <strong>${escapeHtml(product.name)}</strong>`, '#f87171');
      return;
    }

    // ❌ สต็อกในตะกร้าไม่พอ
    const inCart = cart[product.id] ? cart[product.id].qty : 0;
    if (inCart + 1 > product.stock) {
      this.showStatus(
        `⚠️ สต็อกไม่พอ: <strong>${escapeHtml(product.name)}</strong> (เหลือ ${product.stock})`,
        '#fbbf24'
      );
      return;
    }

    // ✅ สแกนสำเร็จ → เพิ่มลงตะกร้า (กล้องยังสแกนต่อ)
    addToCart(product.id);
    this.scanCount++;

    this.showStatus(
      `✅ เพิ่ม: <strong>${escapeHtml(product.name)}</strong> — ${baht(product.price)}<br>` +
      `<span style="font-size:14px;opacity:0.85">สแกนแล้ว ${this.scanCount} รายการ • รวม ${baht(Cart.total())}</span>`,
      '#4ade80'
    );
  },

  showStatus(html, color) {
    const el = document.getElementById('scanStatus');
    if (!el) return;
    el.innerHTML = html;
    el.style.color = color || 'white';
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