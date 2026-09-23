// ==========================================
// LOGIKA KHUSUS HALAMAN LACAK ORDER
// ==========================================

function cariOrder(kode) {
  const k = (kode || document.getElementById("lacakInput").value).trim().toUpperCase();
  const box = document.getElementById("lacakHasil");
  if (!k) return;

  const order = getOrders().find(o => o.kode === k);
  if (!order) {
    box.innerHTML = `<div class="empty">Kode <strong>${k}</strong> tidak ditemukan. Cek lagi kode di struk Anda atau coba kode demo: <code>CS-DEMO1</code></div>`;
    return;
  }

  const m = MITRA.find(x => x.id === order.mitraId) || { telp: "0822-4100-2211" };
  const stepIdx = typeof order.tahap === "number" ? order.tahap : 0;

  const stepsHtml = TAHAP.map((t, i) => {
    const active = i <= stepIdx ? "active" : "";
    const curr = i === stepIdx ? " (Saat ini)" : "";
    return `<li class="${active}"><strong>${i + 1}. ${t}${curr}</strong></li>`;
  }).join("");

  const riwayatHtml = (order.riwayat || []).map(r => `
    <li>
      <span class="muted small">${new Date(r.waktu).toLocaleString("id-ID")}</span> — 
      <strong>${TAHAP[r.tahap] || "Update"}</strong>
      ${r.ket ? `<p class="small" style="margin:2px 0 0 0;color:var(--sub)">${r.ket}</p>` : ""}
    </li>
  `).join("");

  box.innerHTML = `
    <div class="result-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <div>
          <h3>${order.kode} — ${order.mitra}</h3>
          <p class="muted">${order.layanan} • ${order.total} • Status: <strong>${TAHAP[stepIdx]}</strong></p>
        </div>
        <a class="btn-small dark" target="_blank" href="${waLink(m.telp, "Tanya status order " + order.kode)}">Hubungi Mitra</a>
      </div>
      
      <p class="small muted" style="margin-top:12px">Pelanggan: ${order.nama} • Dibuat: ${new Date(order.dibuat).toLocaleString("id-ID")}</p>
      
      <div style="margin-top:16px">
        <strong>Progres Pengerjaan</strong>
        <ol class="track-steps">${stepsHtml}</ol>
      </div>

      <div style="margin-top:20px;border-top:1px solid var(--border);padding-top:12px">
        <strong>Riwayat Perubahan Status</strong>
        <ul class="history-list" style="margin-top:8px;padding-left:18px">${riwayatHtml}</ul>
      </div>
    </div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  seedDemo();

  const btn = document.getElementById("lacakBtn");
  const input = document.getElementById("lacakInput");

  if (btn) btn.addEventListener("click", () => cariOrder());
  if (input) {
    input.addEventListener("keypress", e => {
      if (e.key === "Enter") cariOrder();
    });
  }

  // Cek jika ada parameter ?kode=CS-XXXXXX dari URL (misal: redirect dari booking)
  const params = new URLSearchParams(window.location.search);
  const kodeUrl = params.get("kode");
  if (kodeUrl) {
    if (input) input.value = kodeUrl;
    cariOrder(kodeUrl);
  }
});