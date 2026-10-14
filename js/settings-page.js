/* ============================================================
   Settings Page — หน้าตั้งค่า
   ============================================================ */

function renderSettings() {
  const content = document.getElementById('settingsContent');
  const shopName = Settings.shopName();
  const promptpay = Settings.promptpay();
  const hasPin = Settings.hasPin();

  content.innerHTML = `
    <div class="card">
      <div style="font-weight:700;font-size:18px;margin-bottom:12px">🏪 ข้อมูลร้าน</div>
      <label>ชื่อร้าน</label>
      <input id="sShopName" value="${escapeHtml(shopName)}" placeholder="ร้านของฉัน">
      <label>เบอร์พร้อมเพย์ / เลขบัตรประชาชน</label>
      <input id="sPromptPay" value="${escapeHtml(promptpay)}" inputmode="numeric" placeholder="0812345678">
      <div style="font-size:13px;color:#6b7280;margin-top:-8px;margin-bottom:12px">
        ใช้สร้าง QR รับเงินอัตโนมัติ
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">💾 บันทึก</button>
    </div>

    <div class="card">
      <div style="font-weight:700;font-size:18px;margin-bottom:12px">🔒 ความปลอดภัย</div>
      ${hasPin ? `
        <button class="btn btn-warning" onclick="PIN.show('set', () => renderSettings())">🔑 เปลี่ยนรหัส PIN</button>
        <button class="btn btn-secondary" onclick="removePin()">ปิดการใช้ PIN</button>
      ` : `
        <button class="btn btn-primary" onclick="PIN.show('set', () => renderSettings())">🔒 ตั้งรหัส PIN</button>
        <div style="font-size:13px;color:#6b7280;margin-top:8px">
          ล็อกแอพด้วยรหัส 4 หลัก ป้องกันคนอื่นเปิดดู
        </div>
      `}
    </div>

    <div class="card">
      <div style="font-weight:700;font-size:18px;margin-bottom:12px">💾 สำรองข้อมูล</div>
      <button class="btn btn-primary" onclick="backupData()">📤 ดาวน์โหลดข้อมูล (Backup)</button>
      <button class="btn btn-secondary" onclick="document.getElementById('restoreFile').click()">
        📥 กู้คืนจากไฟล์ (Restore)
      </button>
      <input type="file" id="restoreFile" accept=".json,application/json"
             style="display:none" onchange="restoreData(event)">
      <div style="font-size:13px;color:#6b7280;margin-top:8px">
        แนะนำให้ Backup ทุกสัปดาห์ เก็บไว้ใน Google Drive หรือส่ง LINE เก็บไว้
      </div>
    </div>

    <div class="card">
      <div style="font-weight:700;font-size:18px;margin-bottom:12px">⚠️ โซนอันตราย</div>
      <button class="btn btn-danger" onclick="clearAllData()">🗑️ ลบข้อมูลทั้งหมด</button>
      <div style="font-size:13px;color:#6b7280;margin-top:8px">
        ลบสินค้า ประวัติการขาย ทั้งหมด — กู้คืนไม่ได้
      </div>
    </div>

    <div style="text-align:center;color:#9ca3af;font-size:13px;padding:20px">
      ร้านค้า POS v2.3<br>ข้อมูลเก็บในเครื่องคุณ ไม่ส่งไปไหน
    </div>
  `;
}

function saveSettings() {
  const name = document.getElementById('sShopName').value.trim() || 'ร้านของฉัน';
  const pp = document.getElementById('sPromptPay').value.trim();
  Settings.set('shop_name', name);
  Settings.set('promptpay', pp);
  toast('บันทึกแล้ว');
  switchTab('settings');
}

function removePin() {
  if (!confirm('ปิดการใช้ PIN?')) return;
  Settings.remove('pin');
  toast('ปิด PIN แล้ว');
  renderSettings();
}

async function backupData() {
  try {
    const data = await DB.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pos-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('ดาวน์โหลด Backup แล้ว');
  } catch (e) {
    toast('ผิดพลาด: ' + e.message);
  }
}

async function restoreData(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('กู้คืนข้อมูลจะเขียนทับข้อมูลปัจจุบันทั้งหมด\n\nยืนยัน?')) {
    event.target.value = '';
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.products || !data.sales) throw new Error('ไฟล์ไม่ถูกต้อง');

    await DB.importAll(data);
    await loadProducts();
    toast('กู้คืนสำเร็จ');
    switchTab('pos');
  } catch (e) {
    toast('ผิดพลาด: ' + e.message);
  }

  event.target.value = '';
}

async function clearAllData() {
  if (!confirm('ลบข้อมูลทั้งหมด?\n\nข้อมูลจะหายถาวร')) return;
  if (!confirm('แน่ใจจริงๆ?')) return;

  await DB.clearAll();
  await loadProducts();
  toast('ลบแล้ว');
  switchTab('pos');
}