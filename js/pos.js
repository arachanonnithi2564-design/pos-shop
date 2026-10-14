/* ============================================================
   POS Screen — หน้าขายสินค้า
   ============================================================ */

function renderPos() {
  const catsBar = document.getElementById('catsBar');
  const cats = ['ทั้งหมด', ...new Set(products.map(p => p.category).filter(Boolean))];

  catsBar.innerHTML = cats.map(c =>
    `<div class="cat ${c === currentCategory ? 'active' : ''}" onclick="selectCat('${c.replace(/'/g, "\\'")}')">${escapeHtml(c)}</div>`
  ).join('');

  const area = document.getElementById('productsArea');
  const filtered = currentCategory === 'ทั้งหมด'
    ? products
    : products.filter(p => p.category === currentCategory);

  if (filtered.length === 0) {
    area.innerHTML = `
      <div class="empty">
        <div class="icon">📦</div>
        <div style="font-size:18px;margin-bottom:16px">ยังไม่มีสินค้า</div>
        <button class="btn btn-primary" style="max-width:250px;margin:0 auto"
                onclick="switchTab('products');openProductForm()">
          เพิ่มสินค้าแรก
        </button>
      </div>
    `;
    return;
  }

  area.innerHTML = `<div class="grid">${
    filtered.map(p => {
      const inCart = !!cart[p.id];
      return `
        <div class="product-card ${inCart ? 'in-cart' : ''}" onclick="addToCart('${p.id}')">
          <div class="name">${escapeHtml(p.name)}</div>
          <div>
            <div class="price">${baht(p.price)}</div>
            <div class="stock">เหลือ ${p.stock} ${p.unit || 'ชิ้น'}</div>
          </div>
        </div>
      `;
    }).join('')
  }</div>`;
}

function selectCat(c) {
  currentCategory = c;
  renderPos();
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  if (p.stock <= 0) {
    toast('สินค้าหมด');
    return;
  }

  if (cart[id]) {
    if (cart[id].qty + 1 > p.stock) {
      toast('สต็อกไม่พอ');
      return;
    }
    cart[id].qty += 1;
  } else {
    cart[id] = { product: p, qty: 1 };
  }

  renderPos();
  updateCartBar();
}