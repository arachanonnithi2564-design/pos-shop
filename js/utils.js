/* ============================================================
   Utilities — ฟังก์ชันช่วยเหลือทั่วไป
   ============================================================ */

function fmt(n) {
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 });
}

function baht(n) {
  return '฿' + fmt(n);
}

function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function dateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 1800);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function buildQrUrl(payload) {
  return 'https://quickchart.io/qr?text=' +
    encodeURIComponent(payload) +
    '&size=260&margin=2&ecLevel=M&format=png';
}