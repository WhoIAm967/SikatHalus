// ==========================================
// LOGIKA KHUSUS PETA & DAFTAR MITRA
// ==========================================

// ---- Peta ----
let map = null, markers = [];

function initMap() {
  if (typeof L === "undefined") return;
  map = L.map("map").setView([defaultLoc.lat, defaultLoc.lng], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
  updateMarkers(mitraDenganJarak());
}

function updateMarkers(list) {
  if (!map) return;
  markers.forEach(m => m.remove());
  markers = [];
  list.forEach(m => {
    const mk = L.marker([m.lat, m.lng]).addTo(map).bindPopup(`<strong>${m.nama}</strong><br>${m.alamat}<br>${m.jarak.toFixed(1)} km • ${m.rating}/5`);
    markers.push(mk);
  });
  const ref = userLoc || defaultLoc;
  const label = userLoc ? "Posisi Anda" : "UNNES Sekaran (titik awal)";
  markers.push(L.circleMarker([ref.lat, ref.lng], { radius: 9, color: "#1A73E8", fillColor: "#1A73E8", fillOpacity: 1 }).addTo(map).bindPopup(label));
}

// ---- Daftar mitra ----
function renderMitra() {
  const qEl = document.getElementById("q");
  if (!qEl) return;

  const q = qEl.value.toLowerCase();
  const fL = document.getElementById("fLayanan").value;
  const fU = document.getElementById("fUrut").value;
  const fB = document.getElementById("fBuka").checked;
  const fR = parseFloat(document.getElementById("fRadius").value || "10");
  let list = mitraDenganJarak();
  const refLabel = userLoc ? "posisi Anda" : "Gerbang UNNES";

  if (q) list = list.filter(m => (m.nama + " " + m.alamat).toLowerCase().includes(q));
  if (fL) list = list.filter(m => m.layanan.includes(fL));
  if (fB) list = list.filter(m => m.buka);
  list = list.filter(m => m.jarak <= fR);
  if (fU === "jarak") list.sort((a, b) => a.jarak - b.jarak);
  if (fU === "rating") list.sort((a, b) => b.rating - a.rating);
  if (fU === "harga") list.sort((a, b) => a.mulai - b.mulai);
  currentList = list;

  const grid = document.getElementById("mitraGrid");
  if (!list.length) {
    grid.innerHTML = `<div class="empty">Tidak ada mitra dalam radius ${fR} km dari ${refLabel}. Perbesar radius ke 15–25 km atau hapus filter.</div>`;
  } else {
    grid.innerHTML = list.map(m => `
    <article class="card">
      <div class="card-top">
        <h3>${m.nama}</h3>
        <span class="badge ${m.buka ? "" : "closed"}">${m.buka ? "Buka • " + m.jam : "Tutup"}</span>
      </div>
      <address>${m.alamat}<br>${m.jarak.toFixed(1)} km dari ${refLabel} • ${m.rating}/5 (${m.ulasan})</address>
      <div class="card-meta">${m.layanan.map(l => `<span>${l}</span>`).join("")}</div>
      <div class="card-foot">
        <div><div class="price">Mulai ${rupiah(m.mulai)}</div><div class="muted small">${m.estimasi} • ${m.telp}</div></div>
        <div class="card-actions">
          <a class="btn-small" target="_blank" rel="noopener" href="${gmapsUrl(m)}">Rute</a>
          <button class="btn-small dark" data-book="${m.id}">Pesan</button>
        </div>
      </div>
    </article>`).join("");
  }

  grid.querySelectorAll("[data-book]").forEach(b => b.addEventListener("click", () => openBooking(b.dataset.book)));
  updateMarkers(list);

  if (map) {
    const pts = list.map(m => [m.lat, m.lng]);
    pts.push([(userLoc || defaultLoc).lat, (userLoc || defaultLoc).lng]);
    map.fitBounds(L.latLngBounds(pts).pad(0.25));
  }

  const info = document.getElementById("lokasiInfo");
  if (info) info.textContent = `Menampilkan ${list.length} mitra dalam ${fR} km dari ${refLabel}. Titik awal: Gerbang UNNES Sekaran.`;
}

function setLokasiUI(t) {
  const info = document.getElementById("lokasiInfo");
  const hero = document.getElementById("heroLocationStatus");
  if (info) info.textContent = t;
  if (hero) hero.textContent = t;
}

function deteksiLokasi() {
  if (!navigator.geolocation) {
    setLokasiUI("Perangkat tidak mendukung geolokasi. Memakai titik awal UNNES.");
    return;
  }
  setLokasiUI("Meminta izin lokasi…");
  navigator.geolocation.getCurrentPosition(pos => {
    userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    const dUnnes = haversine(userLoc.lat, userLoc.lng, UNNES.lat, UNNES.lng);
    setLokasiUI(`Lokasi aktif (±${Math.round(pos.coords.accuracy)} m), ${dUnnes.toFixed(1)} km dari UNNES. Daftar dan peta diurutkan dari posisi Anda.`);
    renderMitra();
  }, err => setLokasiUI("Izin lokasi ditolak (" + err.message + "). Memakai titik awal UNNES Sekaran."),
  { enableHighAccuracy: true, timeout: 10000 });
}

// ---- Booking Modal ----
let bookingMitra = null;
function openBooking(id) {
  bookingMitra = MITRA.find(m => m.id === id);
  document.getElementById("bLayanan").innerHTML = bookingMitra.layanan.map(l => `<option value="${l}">${l} — ${rupiah(HARGA[l])}</option>`).join("");
  document.getElementById("bookMitraInfo").textContent = `${bookingMitra.nama} • ${bookingMitra.alamat}`;
  document.getElementById("bookForm").hidden = false;
  document.getElementById("bookSuccess").hidden = true;
  document.getElementById("modalTitle").textContent = "Booking — " + bookingMitra.nama;
  updateTotal();
  document.getElementById("modal").hidden = false;
}

function updateTotal() {
  const l = document.getElementById("bLayanan").value;
  const m = document.getElementById("bMetode").value;
  let t = HARGA[l] || 0;
  if (m.includes("+Rp15")) t += 15000;
  document.getElementById("bTotal").textContent = rupiah(t);
}

function genKode() {
  const c = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)];
  return "CS-" + s;
}

function submitBooking(e) {
  e.preventDefault();
  const nama = document.getElementById("bNama").value.trim();
  const wa = document.getElementById("bWa").value.trim();
  if (!nama || !wa) return;

  const kode = genKode();
  const order = {
    kode,
    mitra: bookingMitra.nama,
    mitraId: bookingMitra.id,
    layanan: document.getElementById("bLayanan").value,
    metode: document.getElementById("bMetode").value,
    nama, wa,
    catatan: document.getElementById("bCatatan").value.trim(),
    total: document.getElementById("bTotal").textContent,
    dibuat: new Date().toISOString(),
    tahap: 0,
    riwayat: [{ tahap: 0, waktu: new Date().toISOString(), ket: "Booking dibuat via website" }]
  };

  const all = getOrders();
  all.unshift(order);
  saveOrders(all);

  document.getElementById("bookForm").hidden = true;
  const box = document.getElementById("bookSuccess");
  box.hidden = false;
  const pesan = `Halo ${bookingMitra.nama}, saya ${nama}. Booking ${kode} (${order.layanan}, ${order.total}).`;

  box.innerHTML = `<div class="result-card"><h3>Kode Anda: ${kode}</h3>
    <p class="muted">${bookingMitra.nama} • ${order.total} • ${order.metode}</p>
    <div class="struk">STEPCLEAN - STRUK BOOKING\nKode: ${kode}\nMitra: ${bookingMitra.nama}\nLayanan: ${order.layanan}\nTotal: ${order.total}\nNama: ${nama}\nTunjukkan saat serah terima.</div>
    <p style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <a class="btn-small dark" target="_blank" href="${waLink(bookingMitra.telp, pesan)}">Konfirmasi via WhatsApp</a>
      <button class="btn-small" id="printBtn">Cetak Struk</button>
      <a class="btn-small" href="lacak.html?kode=${kode}">Lacak</a>
    </p></div>`;

  document.getElementById("printBtn").onclick = () => window.print();
}

// Inisialisasi Event Listener
document.addEventListener("DOMContentLoaded", () => {
  seedDemo();
  renderMitra();
  initMap();

  const locateBtn = document.getElementById("locateBtn");
  const heroLocate = document.getElementById("heroLocate");
  if (locateBtn) locateBtn.addEventListener("click", deteksiLokasi);
  if (heroLocate) heroLocate.addEventListener("click", deteksiLokasi);

  ["q", "fLayanan", "fUrut", "fBuka", "fRadius"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderMitra);
  });

  const bLayanan = document.getElementById("bLayanan");
  const bMetode = document.getElementById("bMetode");
  const bookForm = document.getElementById("bookForm");
  const modalClose = document.getElementById("modalClose");
  const modal = document.getElementById("modal");
  const mitraForm = document.getElementById("mitraForm");

  if (bLayanan) bLayanan.addEventListener("change", updateTotal);
  if (bMetode) bMetode.addEventListener("change", updateTotal);
  if (bookForm) bookForm.addEventListener("submit", submitBooking);
  if (modalClose) modalClose.addEventListener("click", () => modal.hidden = true);
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target.id === "modal") e.target.hidden = true;
    });
  }
  if (mitraForm) {
    mitraForm.addEventListener("submit", e => {
      e.preventDefault();
      document.getElementById("mitraMsg").textContent = "Pengajuan diterima. Survei lokasi maks. 2 hari kerja via WhatsApp.";
      e.target.reset();
    });
  }
});