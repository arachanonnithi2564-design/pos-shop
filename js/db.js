/* ============================================================
   Database — IndexedDB
   ============================================================ */

const DB = {
  db: null,

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('pos_shop_db', 1);

      req.onupgradeneeded = (e) => {
        const db = e.target.result;

        if (!db.objectStoreNames.contains('products')) {
          db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('sales')) {
          const s = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
          s.createIndex('created_at', 'created_at');
        }
        if (!db.objectStoreNames.contains('sale_items')) {
          const s = db.createObjectStore('sale_items', { keyPath: 'id', autoIncrement: true });
          s.createIndex('sale_id', 'sale_id');
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  tx(store, mode = 'readonly') {
    return this.db.transaction(store, mode).objectStore(store);
  },

  req(r) {
    return new Promise((res, rej) => {
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },

  // --- Products ---
  async getProducts() {
    return this.req(this.tx('products').getAll());
  },
  async addProduct(p) {
    return this.req(this.tx('products', 'readwrite').add(p));
  },
  async updateProduct(p) {
    return this.req(this.tx('products', 'readwrite').put(p));
  },
  async deleteProduct(id) {
    return this.req(this.tx('products', 'readwrite').delete(id));
  },

  // --- Sales ---
  async addSale(s) {
    return this.req(this.tx('sales', 'readwrite').add(s));
  },
  async getSales() {
    const all = await this.req(this.tx('sales').getAll());
    return all.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async addSaleItem(i) {
    return this.req(this.tx('sale_items', 'readwrite').add(i));
  },
  async getSaleItems(saleId) {
    const idx = this.tx('sale_items').index('sale_id');
    return this.req(idx.getAll(saleId));
  },

  // --- Backup ---
  async exportAll() {
    const products = await this.req(this.tx('products').getAll());
    const sales = await this.req(this.tx('sales').getAll());
    const sale_items = await this.req(this.tx('sale_items').getAll());
    return {
      version: 1,
      exported_at: new Date().toISOString(),
      products,
      sales,
      sale_items
    };
  },

  async importAll(data) {
    await this.req(this.tx('products', 'readwrite').clear());
    await this.req(this.tx('sales', 'readwrite').clear());
    await this.req(this.tx('sale_items', 'readwrite').clear());

    for (const p of (data.products || [])) {
      await this.req(this.tx('products', 'readwrite').put(p));
    }
    for (const s of (data.sales || [])) {
      await this.req(this.tx('sales', 'readwrite').put(s));
    }
    for (const i of (data.sale_items || [])) {
      await this.req(this.tx('sale_items', 'readwrite').put(i));
    }
  },

  async clearAll() {
    await this.req(this.tx('products', 'readwrite').clear());
    await this.req(this.tx('sales', 'readwrite').clear());
    await this.req(this.tx('sale_items', 'readwrite').clear());
  }
};