// ==========================================
// LOGIKA KHUSUS DASHBOARD MITRA
// ==========================================

let activeMitraId = null;

function renderSelectMitra() {
  const sel = document.getElementById("dashMitraSelect");
  if (!sel) return;
  
  sel.innerHTML = `<option value="">-- Pilih Mitra --</option>` + 
    MITRA.map(m => `<option value="${m.id}">${m.nama}</option>`).join("");
}

function loadDashboard() {
  const sel = document.getElementById("dashMitraSelect");
  if (!sel) return;

  activeMitraId = sel.value;
  const content = document.getElementById("dashContent");

  if (!activeMitraId) {
    content.hidden = true;
    return;
  }

  content.hidden = false;
  const m = MITRA.find(x => x.id === activeMitraId);
  document.getElementById("dashMitraNama").textContent = m ? m.nama : "Mitra";

  renderOrderList();
}

function renderOrderList() {
  const all = getOrders();
  const list = all.filter(o => o.mitraId === activeMitraId);
  const container = document.getElementById("dashOrderList");

  if (!list.length) {
    container.innerHTML = `<div class="empty">Belum ada pesanan untuk mitra ini. Anda bisa membuat booking baru di halaman depan atau menggunakan data demo (misal: CleanSteps Sekaran).</div>`;
    return;
  }

  container.innerHTML = list.map(o => {
    const stepIdx = typeof o.tahap === "number" ? o.tahap : 0;
    
    const optionsHtml = TAHAP.map((t, idx) => `
      <option value="${idx}" ${idx === stepIdx ? "selected" : ""}>
        ${idx + 1}. ${t}
      </option>
    `).join("");

    return `
      <div class="card" style="margin-bottom:16px">
        <div class="card-top">
          <h3>${o.kode} — ${o.nama}</h3>
          <span class="badge">${TAHAP[stepIdx]}</span>
        </div>
        <p class="small muted" style="margin:4px 0">Layanan: <strong>${o.layanan}</strong> | Total: <strong>${o.total}</strong> | WA: ${o.wa}</p>
        <p class="small muted" style="margin:4px 0">Metode: ${o.metode} | Waktu: ${new Date(o.dibuat).toLocaleString("id-ID")}</p>
        ${o.catatan ? `<p class="small" style="background:var(--bg);padding:6px;border-radius:4px;margin:8px 0">Catatan: "${o.catatan}"</p>` : ""}
        
        <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center;flex-wrap:wrap">
          <label class="small" style="font-weight:600">Update Status:</label>
          <select class="small-input" data-status-kode="${o.kode}" style="padding:6px;border-radius:4px;border:1px solid var(--border)">
            ${optionsHtml}
          </select>
          <a class="btn-small" target="_blank" href="lacak.html?kode=${o.kode}">Lihat Detail</a>
        </div>
      </div>
    `;
  }).join("");

  // Attach event listener ke setiap dropdown update status
  container.querySelectorAll("[data-status-kode]").forEach(sel => {
    sel.addEventListener("change", (e) => {
      updateOrderStatus(e.target.dataset.statusKode, parseInt(e.target.value, 10));
    });
  });
}

function updateOrderStatus(kode, newStep) {
  const all = getOrders();
  const idx = all.findIndex(o => o.kode === kode);

  if (idx !== -1) {
    all[idx].tahap = newStep;
    if (!all[idx].riwayat) all[idx].riwayat = [];
    
    all[idx].riwayat.push({
      tahap: newStep,
      waktu: new Date().toISOString(),
      ket: `Diperbarui oleh mitra menjadi: ${TAHAP[newStep]}`
    });

    saveOrders(all);
    renderOrderList();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
  renderSelectMitra();

  const sel = document.getElementById("dashMitraSelect");
  if (sel) {
    sel.addEventListener("change", loadDashboard);
  }
});