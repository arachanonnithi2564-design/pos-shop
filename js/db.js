/* ============================================================
   Database — Firestore (Cloud)
   ============================================================ */

const DB = {
  _path(collection) {
    if (!currentUserId) throw new Error('ยังไม่ได้เข้าสู่ระบบ');
    return db.collection('users').doc(currentUserId).collection(collection);
  },

  // ---------- Products ----------
  async getProducts() {
    const snap = await this._path('products').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async addProduct(p) {
    const { id, ...data } = p;
    const ref = await this._path('products').add(data);
    return ref.id;
  },

  async updateProduct(p) {
    const { id, ...data } = p;
    await this._path('products').doc(id).set(data);
  },

  async deleteProduct(id) {
    await this._path('products').doc(id).delete();
  },

  // ---------- Sales ----------
  async addSale(s) {
    const { id, ...data } = s;
    const ref = await this._path('sales').add(data);
    return ref.id;
  },

  async getSales() {
    const snap = await this._path('sales').orderBy('created_at', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async addSaleItem(i) {
    const { id, ...data } = i;
    const ref = await this._path('sale_items').add(data);
    return ref.id;
  },

  async getSaleItems(saleId) {
    const snap = await this._path('sale_items').where('sale_id', '==', saleId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ---------- Backup / Restore ----------
  async exportAll() {
    const [prods, sales, items] = await Promise.all([
      this._path('products').get(),
      this._path('sales').get(),
      this._path('sale_items').get()
    ]);
    return {
      version: 2,
      exported_at: new Date().toISOString(),
      products: prods.docs.map(d => ({ id: d.id, ...d.data() })),
      sales: sales.docs.map(d => ({ id: d.id, ...d.data() })),
      sale_items: items.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  },

  async importAll(data) {
    // ลบข้อมูลเดิมทั้งหมดก่อน
    await this.clearAll();

    // กู้คืนทีละชุด (ใช้ batch เพื่อความเร็ว)
    const collections = [
      { name: 'products', items: data.products || [] },
      { name: 'sales', items: data.sales || [] },
      { name: 'sale_items', items: data.sale_items || [] }
    ];

    for (const col of collections) {
      // Firestore batch จำกัด 500 ต่อครั้ง → แบ่งชุด
      for (let i = 0; i < col.items.length; i += 400) {
        const batch = db.batch();
        const chunk = col.items.slice(i, i + 400);
        for (const item of chunk) {
          const { id, ...rest } = item;
          const ref = id
            ? this._path(col.name).doc(id)
            : this._path(col.name).doc();
          batch.set(ref, rest);
        }
        await batch.commit();
      }
    }
  },

  async clearAll() {
    const collections = ['products', 'sales', 'sale_items'];
    for (const name of collections) {
      const snap = await this._path(name).get();
      // แบ่ง batch ละ 400
      for (let i = 0; i < snap.docs.length; i += 400) {
        const batch = db.batch();
        snap.docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
    }
  }
};