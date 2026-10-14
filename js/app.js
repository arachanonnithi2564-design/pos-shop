/* ============================================================
   App — main / tab switching / init
   ============================================================ */

// ---------- Global State ----------
let products = [];
let currentCategory = 'ทั้งหมด';
let currentTab = 'pos';
let cart = {};

// ---------- Tab Switching ----------
function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + tab).classList.add('active');

  document.querySelectorAll('nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.screen === tab);
  });

  const shopName = Settings.shopName();
  const titles = {
    pos: '🏪 ' + shopName,
    products: '📦 สินค้า',
    history: '🧾 ประวัติ',
    settings: '⚙️ ตั้งค่า'
  };
  document.getElementById('headerTitle').textContent = titles[tab] || shopName;

  document.getElementById('headerAddBtn').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('fab').style.display = tab === 'products' ? 'flex' : 'none';

  if (tab === 'pos') renderPos();
  if (tab === 'products') renderProductsList();
  if (tab === 'history') HIST.render();
  if (tab === 'settings') renderSettings();

  updateCartBar();
}

document.getElementById('headerAddBtn').onclick = () => openProductForm();

// ---------- Load Products ----------
async function loadProducts() {
  products = await DB.getProducts();
  products.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
}

// ---------- Init ----------
async function init() {
  await DB.init();
  await loadProducts();

  // ถ้าไม่มีสินค้าเลย เพิ่มตัวอย่างให้
  if (products.length === 0) {
    const samples = [
      { name: 'โค้ก 325ml', price: 15, stock: 24, unit: 'ขวด', category: 'น้ำ' },
      { name: 'น้ำเปล่า', price: 7, stock: 50, unit: 'ขวด', category: 'น้ำ' },
      { name: 'มาม่าต้มยำ', price: 7, stock: 30, unit: 'ซอง', category: 'อาหาร' },
      { name: 'ลูกอม', price: 5, stock: 100, unit: 'เม็ด', category: 'ขนม' },
      { name: 'สบู่', price: 12, stock: 10, unit: 'ก้อน', category: 'ของใช้' }
    ];
    for (const s of samples) await DB.addProduct(s);
    await loadProducts();
  }

  // ถ้ามี PIN ให้ล็อกก่อน
  if (Settings.hasPin()) {
    PIN.show('unlock');
  }

  switchTab('pos');
}

init();