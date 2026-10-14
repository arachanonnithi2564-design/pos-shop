/* ============================================================
   History — หน้าประวัติการขาย
   ============================================================ */

const HIST = {
  view: 'day',
  date: todayStr(),

  setView(v) {
    this.view = v;
    document.querySelectorAll('[data-h]').forEach(b => {
      b.classList.toggle('active', b.dataset.h === v);
    });
    this.render();
  },

  async render() {
    const allSales = await DB.getSales();
    const content = document.getElementById('historyContent');

    if (this.view === 'day') {
      this.renderDay(allSales, content);
    } else if (this.view === 'week') {
      this.renderRange(allSales, content, 7);
    } else {
      this.renderRange(allSales, content, 30);
    }
  },

  renderDay(allSales, content) {
    const daySales = allSales.filter(s => s.created_at.startsWith(this.date));
    const total = daySales.reduce((sum, s) => sum + s.total, 0);
    const d = new Date(this.date + 'T00:00:00');
    const dateLabel = this.date === todayStr() ? 'วันนี้'
      : d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

    content.innerHTML = `
      <div class="summary">
        <div class="date">${dateLabel}</div>
        <div class="amount">${baht(total)}</div>
        <div class="bills">${daySales.length} บิล</div>
      </div>
      <input type="date" id="hDatePicker" value="${this.date}" style="margin-bottom:14px">
      <div id="historyList"></div>
    `;

    document.getElementById('hDatePicker').onchange = (e) => {
      this.date = e.target.value;
      this.render();
    };

    const list = document.getElementById('historyList');
    if (daySales.length === 0) {
      list.innerHTML = `<div class="empty"><div class="icon">🧾</div>ยังไม่มีการขาย</div>`;
      return;
    }

    list.innerHTML = daySales.map(s => {
      const time = new Date(s.created_at).toLocaleTimeString('th-TH', {
        hour: '2-digit', minute: '2-digit'
      });
      const icon = s.payment_method === 'cash' ? '💵' : '📱';
      return `
        <div class="card" onclick="showSaleDetail(${s.id})">
          <div class="card-row">
            <div style="font-size:26px">${icon}</div>
            <div class="info">
              <div class="name">บิล #${String(s.id).slice(-4)}</div>
              <div class="meta">${time}</div>
            </div>
            <div class="right">${baht(s.total)}</div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderRange(allSales, content, days) {
    const today = new Date();
    today.setHours(23, 59, 59);

    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);

    const dayTotals = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      dayTotals[dateStr(d)] = 0;
    }

    let grand = 0, count = 0;
    for (const s of allSales) {
      const d = new Date(s.created_at);
      if (d < start || d > today) continue;
      const key = dateStr(d);
      if (dayTotals[key] !== undefined) dayTotals[key] += s.total;
      grand += s.total;
      count++;
    }

    const entries = Object.entries(dayTotals);
    const max = Math.max(...entries.map(e => e[1]), 1);

    content.innerHTML = `
      <div class="summary">
        <div class="date">${days} วันล่าสุด</div>
        <div class="amount">${baht(grand)}</div>
        <div class="bills">${count} บิล</div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">ยอดขายแต่ละวัน</div>
        <div class="bar-chart">
          ${entries.map(([k, v]) => {
            const h = max > 0 ? (v / max) * 100 : 0;
            const d = new Date(k + 'T00:00:00');
            const label = d.getDate() + '/' + (d.getMonth() + 1);
            return `
              <div class="bar-wrap">
                <div class="bar-value">${v > 0 ? Math.round(v) : ''}</div>
                <div class="bar" style="height: ${h}%"></div>
                <div class="bar-label">${label}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      <div class="card">
        <div style="font-weight:700;margin-bottom:8px">ยอดเฉลี่ย/วัน</div>
        <div style="font-size:28px;font-weight:800;color:#15803d">${baht(grand / days)}</div>
      </div>
    `;
  }
};

async function showSaleDetail(saleId) {
  const items = await DB.getSaleItems(saleId);
  const allSales = await DB.getSales();
  const sale = allSales.find(s => s.id === saleId);
  if (!sale) return;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-title">
      <span>บิล #${String(sale.id).slice(-4)}</span>
      <button onclick="closeModal()">✕</button>
    </div>
    <div style="color:#6b7280;font-size:14px;margin-bottom:16px">
      ${new Date(sale.created_at).toLocaleString('th-TH')}
    </div>
    ${items.map(i => `
      <div class="cart-item">
        <div class="ci-info">
          <div class="ci-name">${escapeHtml(i.product_name)}</div>
          <div class="ci-price">${baht(i.price)} × ${i.qty}</div>
        </div>
        <div class="ci-sub">${baht(i.subtotal)}</div>
      </div>
    `).join('')}
    <div style="border-top:2px solid #e5e7eb;margin-top:12px;padding-top:12px">
      <div class="card-row" style="margin-bottom:8px">
        <div class="info" style="font-size:18px;font-weight:700">รวม</div>
        <div style="font-size:24px;font-weight:800;color:#15803d">${baht(sale.total)}</div>
      </div>
      ${sale.payment_method === 'cash' ? `
        <div class="card-row" style="margin-bottom:4px">
          <div class="info">รับมา</div><div>${baht(sale.received)}</div>
        </div>
        <div class="card-row">
          <div class="info">ทอน</div><div>${baht(sale.change)}</div>
        </div>
      ` : `<div style="text-align:center;color:#16a34a;font-weight:700">📱 โอนผ่าน QR</div>`}
    </div>
    <button class="btn btn-secondary" style="margin-top:16px" onclick="closeModal()">ปิด</button>
  `;

  document.getElementById('modal').classList.add('show');
}