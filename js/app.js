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

  document.getElementById('headerScanBtn').style.display = tab === 'pos' ? 'block' : 'none';
  document.getElementById('headerAddBtn').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('fab').style.display = tab === 'products' ? 'flex' : 'none';

  if (tab === 'pos') renderPos();
  if (tab === 'products') renderProductsList();
  if (tab === 'history') HIST.render();
  if (tab === 'settings') renderSettings();

  updateCartBar();
}

document.getElementById('headerAddBtn').onclick = () => openProductForm();
document.getElementById('headerScanBtn').onclick = () => Scanner.open();

// ---------- Load Products ----------
async function loadProducts() {
  products = await DB.getProducts();
  products.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th'));
}

let appInitialized = false;

async function initApp() {
  if (appInitialized) {
    await loadProducts();
    if (currentTab === 'pos') renderPos();
    else if (currentTab === 'products') renderProductsList();
    else if (currentTab === 'history') HIST.render();
    else if (currentTab === 'settings') renderSettings();
    return;
  }
  appInitialized = true;

  try {
    await loadProducts();

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

    if (Settings.hasPin()) {
      PIN.show('unlock');
    }

    switchTab('pos');
  } catch (e) {
    console.error(e);
    toast('โหลดข้อมูลผิดพลาด: ' + e.message);
  }
}

// เริ่มระบบ Authentication
Auth.init();