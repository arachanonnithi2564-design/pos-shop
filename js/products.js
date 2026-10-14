/* ============================================================
   Products — หน้าจัดการสินค้า
   ============================================================ */

function renderProductsList() {
  const area = document.getElementById('productsListArea');

  if (products.length === 0) {
    area.innerHTML = `
      <div class="empty">
        <div class="icon">📦</div>
        <div style="font-size:18px;margin-bottom:16px">ยังไม่มีสินค้า</div>
        <button class="btn btn-primary" style="max-width:250px;margin:0 auto"
                onclick="openProductForm()">เพิ่มสินค้า</button>
      </div>
    `;
    return;
  }

  area.innerHTML = products.map(p => `
    <div class="card">
      <div class="card-row">
        <div class="info">
          <div class="name">${escapeHtml(p.name)}</div>
          <div class="meta">${baht(p.price)} • เหลือ ${p.stock} ${p.unit || 'ชิ้น'} • ${escapeHtml(p.category || '')}</div>
        </div>
        <button class="qty-btn" style="background:#dbeafe;color:#2563eb"
                onclick="openProductForm(${p.id})">✏️</button>
        <button class="qty-btn" style="background:#fee2e2;color:#dc2626"
                onclick="deleteProduct(${p.id})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function openProductForm(id = null) {
  const p = id ? products.find(x => x.id === id) : null;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-title">
      <span>${p ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</span>
      <button onclick="closeModal()">✕</button>
    </div>
    <label>ชื่อสินค้า</label>
    <input id="fName" value="${p ? escapeHtml(p.name) : ''}" placeholder="เช่น โค้ก, มาม่า">
    <label>ราคา (บาท)</label>
    <input id="fPrice" type="number" inputmode="decimal" value="${p ? p.price : ''}" placeholder="0">
    <label>จำนวนสต็อก</label>
    <input id="fStock" type="number" inputmode="numeric" value="${p ? p.stock : 0}">
    <label>หน่วย</label>
    <input id="fUnit" value="${p ? escapeHtml(p.unit || 'ชิ้น') : 'ชิ้น'}" placeholder="ชิ้น / ขวด / กิโล">
    <label>หมวดหมู่</label>
    <input id="fCat" value="${p ? escapeHtml(p.category || '') : ''}" placeholder="เช่น น้ำ, ขนม, ของใช้">
    <button class="btn btn-primary" onclick="saveProduct(${id || 'null'})">💾 บันทึก</button>
  `;

  document.getElementById('modal').classList.add('show');
}

async function saveProduct(id) {
  const name = document.getElementById('fName').value.trim();
  const price = parseFloat(document.getElementById('fPrice').value);
  const stock = parseInt(document.getElementById('fStock').value) || 0;
  const unit = document.getElementById('fUnit').value.trim() || 'ชิ้น';
  const category = document.getElementById('fCat').value.trim() || 'ทั่วไป';

  if (!name) { toast('ใส่ชื่อสินค้าด้วย'); return; }
  if (isNaN(price) || price < 0) { toast('ราคาไม่ถูกต้อง'); return; }

  const data = { name, price, stock, unit, category };

  if (id) {
    const p = products.find(x => x.id === id);
    await DB.updateProduct({ ...p, ...data, id });
  } else {
    await DB.addProduct(data);
  }

  closeModal();
  await loadProducts();

  if (currentTab === 'pos') renderPos();
  else renderProductsList();

  toast('บันทึกแล้ว');
}

async function deleteProduct(id) {
  if (!confirm('ลบสินค้านี้?')) return;
  await DB.deleteProduct(id);
  await loadProducts();
  renderProductsList();
  toast('ลบแล้ว');
}