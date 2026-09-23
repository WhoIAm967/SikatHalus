// ==========================================
// LOGIKA KHUSUS DASHBOARD MITRA
// ==========================================

function renderSelectMitra() {
  const sel = document.getElementById("dMitra");
  if (!sel) return;
  sel.innerHTML = `<option value="">-- Pilih Workshop --</option>` +
    MITRA.map(m => `<option value="${m.id}">${m.nama}</option>`).join("");
}

function renderDashboard() {
  const sel = document.getElementById("dMitra");
  const filterSel = document.getElementById("dFilter");
  const statsBox = document.getElementById("dashStats");
  const listBox = document.getElementById("dashList");
  if (!sel || !listBox) return;

  const mitraId = sel.value;
  const filter = filterSel ? filterSel.value : "";

  if (!mitraId) {
    listBox.innerHTML = `<div class="empty">Pilih workshop di atas untuk melihat daftar order.</div>`;
    if (statsBox) statsBox.innerHTML = "";
    return;
  }

  const semuaOrderMitra = getOrders().filter(o => o.mitraId === mitraId);
  const lastStep = TAHAP.length - 1;

  let list = semuaOrderMitra;
  if (filter === "aktif") list = list.filter(o => (o.tahap ?? 0) < lastStep);
  if (filter === "selesai") list = list.filter(o => (o.tahap ?? 0) === lastStep);

  const totalAktif = semuaOrderMitra.filter(o => (o.tahap ?? 0) < lastStep).length;
  const totalSelesai = semuaOrderMitra.filter(o => (o.tahap ?? 0) === lastStep).length;
  if (statsBox) statsBox.innerHTML = `<span>${totalAktif} belum selesai</span><span>${totalSelesai} selesai</span>`;

  if (!list.length) {
    listBox.innerHTML = `<div class="empty">Belum ada pesanan untuk workshop ini. Coba data demo (CleanSteps Sekaran / SneakerHub Tembalang) atau buat booking baru di halaman "Cari Mitra".</div>`;
    return;
  }

  listBox.innerHTML = list.map(o => {
    const stepIdx = typeof o.tahap === "number" ? o.tahap : 0;
    const btnsHtml = TAHAP.map((t, idx) =>
      `<button type="button" data-kode="${o.kode}" data-tahap="${idx}" class="${idx === stepIdx ? "on" : ""}">${idx + 1}. ${t}</button>`
    ).join("");

    return `
      <div class="dash-item">
        <div class="row">
          <div>
            <strong>${o.kode}</strong> — ${o.nama}
            <p class="muted small" style="margin:4px 0 0">${o.layanan} • ${o.total} • WA ${o.wa} • ${new Date(o.dibuat).toLocaleString("id-ID")}</p>
          </div>
          <span class="badge">${TAHAP[stepIdx]}</span>
        </div>
        ${o.catatan ? `<p class="small" style="background:var(--bg);padding:6px 10px;border-radius:8px;margin:8px 0">Catatan: "${o.catatan}"</p>` : ""}
        <div class="progress-btns">${btnsHtml}</div>
      </div>
    `;
  }).join("");

  listBox.querySelectorAll("[data-kode]").forEach(btn => {
    btn.addEventListener("click", () => {
      updateOrderStatus(btn.dataset.kode, parseInt(btn.dataset.tahap, 10));
    });
  });
}

function updateOrderStatus(kode, newStep) {
  const all = getOrders();
  const idx = all.findIndex(o => o.kode === kode);
  if (idx === -1) return;

  all[idx].tahap = newStep;
  if (!all[idx].riwayat) all[idx].riwayat = [];
  all[idx].riwayat.push({
    tahap: newStep,
    waktu: new Date().toISOString(),
    ket: `Diperbarui oleh mitra menjadi: ${TAHAP[newStep]}`
  });

  saveOrders(all);
  renderDashboard();
}

document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
  renderSelectMitra();

  const sel = document.getElementById("dMitra");
  const filterSel = document.getElementById("dFilter");
  if (sel) sel.addEventListener("change", renderDashboard);
  if (filterSel) filterSel.addEventListener("change", renderDashboard);

  renderDashboard();
});