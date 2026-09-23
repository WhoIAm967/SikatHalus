// ==========================================
// LOGIKA KHUSUS HALAMAN LACAK ORDER
// ==========================================

function cariOrder(kodeManual) {
  const inputEl = document.getElementById("trackInput");
  const k = (kodeManual || (inputEl ? inputEl.value : "")).trim().toUpperCase();
  const box = document.getElementById("trackResult");
  if (!box) return;
  if (!k) {
    box.innerHTML = `<div class="empty">Masukkan kode booking terlebih dahulu.</div>`;
    return;
  }

  const order = getOrders().find(o => o.kode === k);
  if (!order) {
    box.innerHTML = `<div class="empty">Kode <strong>${k}</strong> tidak ditemukan. Cek lagi kode di struk Anda atau coba kode demo: <code>CS-DEMO1</code></div>`;
    return;
  }

  const m = MITRA.find(x => x.id === order.mitraId) || { telp: "0822-4100-2211" };
  const stepIdx = typeof order.tahap === "number" ? order.tahap : 0;

  const stepsHtml = TAHAP.map((t, i) => {
    let cls = "";
    let ket = "Menunggu";
    if (i < stepIdx) { cls = "done"; ket = "Selesai"; }
    else if (i === stepIdx) { cls = "active"; ket = "Sedang berlangsung"; }
    return `<li class="${cls}"><span class="dot"></span><div><strong>${i + 1}. ${t}</strong><p>${ket}</p></div></li>`;
  }).join("");

  const riwayatHtml = (order.riwayat || []).slice().reverse().map(r => `
    <li style="margin-bottom:8px">
      <span class="muted small">${new Date(r.waktu).toLocaleString("id-ID")}</span> —
      <strong>${TAHAP[r.tahap] || "Update"}</strong>
      ${r.ket ? `<p class="small" style="margin:2px 0 0 0;color:var(--muted)">${r.ket}</p>` : ""}
    </li>
  `).join("");

  box.innerHTML = `
    <div class="result-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <div>
          <h3>${order.kode} — ${order.mitra}</h3>
          <p class="muted">${order.layanan} • ${order.total} • Status: <strong>${TAHAP[stepIdx]}</strong></p>
        </div>
        <a class="btn-small dark" target="_blank" rel="noopener" href="${waLink(m.telp, "Tanya status order " + order.kode)}">Hubungi Mitra</a>
      </div>

      <p class="small muted" style="margin-top:12px">Pelanggan: ${order.nama} • Dibuat: ${new Date(order.dibuat).toLocaleString("id-ID")}</p>

      <div style="margin-top:16px">
        <strong>Progres Pengerjaan</strong>
        <ol class="timeline mini" style="margin-top:8px">${stepsHtml}</ol>
      </div>

      <div style="margin-top:20px;border-top:1px solid var(--line);padding-top:12px">
        <strong>Riwayat Perubahan Status</strong>
        <ul style="margin-top:8px;padding-left:18px;list-style:none">${riwayatHtml}</ul>
      </div>
    </div>
  `;
}

function renderMyOrders() {
  const box = document.getElementById("myOrders");
  if (!box) return;

  const all = getOrders().filter(o => !o.kode.startsWith("CS-DEMO"));
  if (!all.length) {
    box.innerHTML = `<div class="empty">Belum ada booking dari perangkat ini. Booking baru lewat halaman "Cari Mitra" akan otomatis muncul di sini.</div>`;
    return;
  }

  box.innerHTML = all.map(o => {
    const stepIdx = typeof o.tahap === "number" ? o.tahap : 0;
    return `<div class="order-row">
      <div><strong>${o.kode}</strong> <span class="muted small">— ${o.mitra} • ${o.layanan}</span></div>
      <div style="display:flex;align-items:center;gap:10px">
        <span class="badge">${TAHAP[stepIdx]}</span>
        <a class="btn-small" href="lacak.html?kode=${o.kode}">Lihat</a>
      </div>
    </div>`;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
  renderMyOrders();

  const form = document.getElementById("trackForm");
  const input = document.getElementById("trackInput");

  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      cariOrder();
    });
  }

  // Tombol kode demo (CS-DEMO1 / CS-DEMO2) di atas form
  document.querySelectorAll("[data-demo]").forEach(btn => {
    btn.addEventListener("click", () => {
      if (input) input.value = btn.dataset.demo;
      cariOrder(btn.dataset.demo);
    });
  });

  // Kalau datang dari lacak.html?kode=CS-XXXXXX (misal redirect setelah booking)
  const params = new URLSearchParams(window.location.search);
  const kodeUrl = params.get("kode");
  if (kodeUrl) {
    if (input) input.value = kodeUrl;
    cariOrder(kodeUrl);
  }
});