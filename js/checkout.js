/* ============================================================
   Checkout — หน้าชำระเงิน
   ============================================================ */

function openCheckout() {
  if (Cart.count() === 0) {
    toast('ยังไม่มีสินค้า');
    return;
  }

  let payMethod = 'cash';
  let received = 0;

  const render = () => {
    const items = Object.values(cart);
    const total = Cart.total();
    const change = received - total;
    const enough = payMethod === 'cash' ? received >= total : true;
    const hasPromptPay = !!Settings.promptpay();

    document.getElementById('modalContent').innerHTML = `
      <div class="modal-title">
        <span>💰 ชำระเงิน</span>
        <button onclick="closeModal()">✕</button>
      </div>

      ${items.map(i => `
        <div class="cart-item">
          <div class="ci-info">
            <div class="ci-name">${escapeHtml(i.product.name)}</div>
            <div class="ci-price">${baht(i.product.price)} × ${i.qty}</div>
          </div>
          <button class="qty-btn minus" onclick="changeQty(${i.product.id}, -1)">−</button>
          <div class="qty-val">${i.qty}</div>
          <button class="qty-btn plus" onclick="changeQty(${i.product.id}, 1)">+</button>
          <div class="ci-sub">${baht(i.product.price * i.qty)}</div>
        </div>
      `).join('')}

      <div class="pay-total">
        <div class="label">ยอดรวม</div>
        <div class="amount">${baht(total)}</div>
      </div>

      <div style="font-weight:700;margin-bottom:8px">วิธีชำระเงิน</div>
      <div class="pay-methods">
        <button class="${payMethod === 'cash' ? 'active' : ''}" onclick="setPayMethod('cash')">💵 เงินสด</button>
        <button class="${payMethod === 'qr' ? 'active' : ''}" onclick="setPayMethod('qr')">📱 QR โอน</button>
      </div>

      ${payMethod === 'cash' ? `
        <label>รับเงินมา</label>
        <input type="number" id="receivedInput" inputmode="numeric"
               value="${received || ''}" placeholder="0"
               oninput="setReceived(this.value)"
               style="font-size:28px;font-weight:800;text-align:center">
        <div class="quick-amounts">
          <button onclick="setReceived(${Math.ceil(total)})">พอดี</button>
          ${[20, 50, 100, 500, 1000].map(a =>
            `<button onclick="setReceived(${a})">${a}</button>`
          ).join('')}
        </div>
        ${received > 0 ? `
          <div class="change-box ${enough ? 'ok' : 'no'}">
            <div class="label">${enough ? 'เงินทอน' : 'ยังขาดอีก'}</div>
            <div class="amount">${baht(Math.abs(change))}</div>
          </div>
        ` : ''}
      ` : `
        ${hasPromptPay ? `
          <div class="qr-box" id="qrBox">
            <img id="qrImg" alt="QR" src="">
            <div class="hint">สแกนด้วยแอพธนาคาร<br>ยอด ${baht(total)}</div>
          </div>
        ` : `
          <div class="change-box no" style="margin-top:12px">
            <div class="label">ยังไม่ได้ตั้งค่า PromptPay</div>
            <div style="font-size:14px;margin-top:8px">ไปที่ ตั้งค่า → ใส่เบอร์พร้อมเพย์</div>
          </div>
        `}
      `}

      <button class="btn btn-primary" style="margin-top:14px;font-size:20px;padding:22px"
        ${enough && (payMethod === 'cash' || hasPromptPay) ? '' : 'disabled style="opacity:0.4;font-size:20px;padding:22px;margin-top:14px"'}
        onclick="confirmSale('${payMethod}', ${received}, ${total})">
        ✅ ยืนยันการขาย
      </button>
    `;

    // สร้าง QR
    if (payMethod === 'qr' && hasPromptPay) {
      setTimeout(() => {
        const img = document.getElementById('qrImg');
        if (!img) return;
        try {
          const payload = PromptPay.generate(Settings.promptpay(), total);
          console.log('PromptPay payload:', payload);
          const url = buildQrUrl(payload);

          img.style.display = 'block';
          img.onerror = () => {
            img.style.display = 'none';
            const box = document.getElementById('qrBox');
            const old = box.querySelector('.qr-error');
            if (old) old.remove();
            box.insertAdjacentHTML('beforeend',
              '<div class="qr-error" style="color:#dc2626;padding:12px;font-size:14px;text-align:center">⚠️ โหลดรูป QR ไม่ได้<br>ลองใหม่อีกครั้ง</div>');
          };
          img.src = url;
        } catch (e) {
          console.error(e);
          img.style.display = 'none';
          const box = document.getElementById('qrBox');
          const old = box.querySelector('.qr-error');
          if (old) old.remove();
          box.insertAdjacentHTML('beforeend',
            '<div class="qr-error" style="color:#dc2626;padding:12px;font-size:14px;text-align:center">⚠️ ' + escapeHtml(e.message) + '</div>');
        }
      }, 100);
    }
  };

  window.setPayMethod = (m) => { payMethod = m; render(); };
  window.setReceived = (v) => { received = parseFloat(v) || 0; render(); };

  window.changeQty = (id, delta) => {
    const item = cart[id];
    if (!item) return;
    const p = item.product;
    const newQty = item.qty + delta;

    if (newQty <= 0) {
      delete cart[id];
    } else if (newQty > p.stock) {
      toast('สต็อกไม่พอ');
      return;
    } else {
      item.qty = newQty;
    }

    updateCartBar();
    if (Object.keys(cart).length === 0) {
      closeModal();
      renderPos();
      return;
    }
    render();
  };

  window.confirmSale = async (method, rec, total) => {
    await doSale(method, rec, total);
  };

  render();
  document.getElementById('modal').classList.add('show');
}

function closeModal() {
  document.getElementById('modal').classList.remove('show');
}

document.getElementById('modal').onclick = (e) => {
  if (e.target.id === 'modal') closeModal();
};

async function doSale(method, received, total) {
  try {
    const items = Object.values(cart);

    const sale = {
      total,
      received: method === 'cash' ? received : total,
      change: method === 'cash' ? Math.max(0, received - total) : 0,
      payment_method: method,
      created_at: new Date().toISOString()
    };

    const saleId = await DB.addSale(sale);

    for (const item of items) {
      await DB.addSaleItem({
        sale_id: saleId,
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        qty: item.qty,
        subtotal: item.product.price * item.qty
      });

      const p = products.find(x => x.id === item.product.id);
      if (p) {
        p.stock = Math.max(0, p.stock - item.qty);
        await DB.updateProduct(p);
      }
    }

    cart = {};
    closeModal();
    await loadProducts();
    renderPos();
    updateCartBar();
    toast('✅ บันทึกการขายแล้ว');
  } catch (e) {
    console.error(e);
    toast('ผิดพลาด: ' + e.message);
  }
}