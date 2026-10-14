/* ============================================================
   Cart — ตะกร้าสินค้า
   ============================================================ */

const Cart = {
  count() {
    return Object.values(cart).reduce((s, i) => s + i.qty, 0);
  },

  total() {
    return Object.values(cart).reduce(
      (s, i) => s + i.product.price * i.qty,
      0
    );
  },

  clear() {
    if (Object.keys(cart).length === 0) return;
    if (!confirm('ล้างตะกร้าทั้งหมด?')) return;
    cart = {};
    renderPos();
    updateCartBar();
  }
};

function updateCartBar() {
  const bar = document.getElementById('cartBar');
  const n = Cart.count();

  if (n > 0 && currentTab === 'pos') {
    bar.classList.add('show');
    document.getElementById('cartCount').textContent = n + ' ชิ้น';
    document.getElementById('cartTotal').textContent = baht(Cart.total());
  } else {
    bar.classList.remove('show');
  }
}