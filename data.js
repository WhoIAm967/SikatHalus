// ==========================================
// DATA UTAMA & KONSTANTA
// ==========================================
const UNNES = { lat:-7.0549, lng:110.3830, label:"Gerbang UNNES Sekaran, Gunungpati" };
const MITRA = [
  { id:"cleansteps-sekaran", nama:"CleanSteps Sekaran", alamat:"Jl. Sekaran Raya No. 9, Sekaran (100 m dari Gerbang UNNES)", lat:-7.0540, lng:110.3815, rating:4.9, ulasan:412, mulai:15000, estimasi:"1-2 hari", jam:"09.00-21.00", tutupMinggu:false, layanan:["Fast Clean","Deep Clean","Unyellowing"], telp:"0822-4100-2211" },
  { id:"kickswash-patemon", nama:"KicksWash Patemon", alamat:"Jl. Patemon Raya No. 27, Gunungpati", lat:-7.0620, lng:110.3750, rating:4.8, ulasan:268, mulai:12000, estimasi:"1 hari", jam:"10.00-20.00", tutupMinggu:false, layanan:["Fast Clean","Deep Clean"], telp:"0822-3300-4455" },
  { id:"solefresh-gunungpati", nama:"SoleFresh Gunungpati", alamat:"Jl. Raya Gunungpati No. 88, Gunungpati", lat:-7.0715, lng:110.3800, rating:4.7, ulasan:195, mulai:15000, estimasi:"1-2 hari", jam:"09.00-20.00", tutupMinggu:true, layanan:["Fast Clean","Deep Clean","Leather & Suede"], telp:"0823-2200-9911" },
  { id:"kinclong-nongko", nama:"Kinclong Nongkosawit", alamat:"Jl. Nongkosawit No. 12, Sekaran", lat:-7.0450, lng:110.3920, rating:4.8, ulasan:174, mulai:18000, estimasi:"2-3 hari", jam:"09.00-19.00", tutupMinggu:true, layanan:["Deep Clean","Leather & Suede","Repaint"], telp:"0823-5500-1122" },
  { id:"deepsole-banyumanik", nama:"DeepSole Banyumanik", alamat:"Jl. Banyumanik Raya No. 45, Banyumanik", lat:-7.0830, lng:110.3980, rating:4.6, ulasan:231, mulai:15000, estimasi:"1-2 hari", jam:"09.00-21.00", tutupMinggu:false, layanan:["Fast Clean","Deep Clean","Unyellowing"], telp:"0822-7788-0099" },
  { id:"sneakerhub-tembalang", nama:"SneakerHub Tembalang", alamat:"Jl. Bulusan Raya No. 21, Tembalang (dekat Undip)", lat:-7.0625, lng:110.4015, rating:4.7, ulasan:342, mulai:16000, estimasi:"1-3 hari", jam:"10.00-21.00", tutupMinggu:false, layanan:["Fast Clean","Deep Clean","Repaint"], telp:"0822-6655-3322" },
  { id:"bersihkicks-ngaliyan", nama:"BersihKicks Ngaliyan", alamat:"Jl. Prof. Hamka No. 33, Ngaliyan", lat:-7.0350, lng:110.3600, rating:4.6, ulasan:148, mulai:14000, estimasi:"1-2 hari", jam:"09.00-20.00", tutupMinggu:false, layanan:["Fast Clean","Deep Clean"], telp:"0821-4000-7788" },
  { id:"whitesole-mijen", nama:"WhiteSole Mijen", alamat:"Jl. Raya Mijen No. 10, Mijen", lat:-7.0455, lng:110.3550, rating:4.7, ulasan:121, mulai:15000, estimasi:"2-3 hari", jam:"09.00-19.00", tutupMinggu:true, layanan:["Deep Clean","Unyellowing","Repaint"], telp:"0821-9000-3344" },
];

const HARGA = { "Fast Clean":15000, "Deep Clean":30000, "Leather & Suede":55000, "Unyellowing":60000, "Repaint":90000 };
const TAHAP = ["Diterima mitra","Antrian cuci","Proses cuci + detail","Pengeringan & QC","Siap diambil / diantar"];

let userLoc = null;
let currentList = [];
const defaultLoc = { lat:UNNES.lat, lng:UNNES.lng };

// ==========================================
// FUNGSI HELPER & UTILITY
// ==========================================
function haversine(a,b,c,d){
  const R=6371, t=x=>x*Math.PI/180;
  const dh=t(c-a), dl=t(d-b);
  const h=Math.sin(dh/2)**2 + Math.cos(t(a))*Math.cos(t(c))*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
function parseJam(s){ const [h,m]=s.split(".").map(Number); return h+m/60; }
function isOpenNow(m){
  const n=new Date();
  if(m.tutupMinggu && n.getDay()===0) return false;
  const h=n.getHours()+n.getMinutes()/60;
  const [o,c]=m.jam.split("-");
  return h>=parseJam(o) && h<=parseJam(c);
}
function rupiah(n){ return "Rp"+n.toLocaleString("id-ID"); }
function getOrders(){ try{ return JSON.parse(localStorage.getItem("sc_orders")||"[]"); }catch{ return []; } }
function saveOrders(o){ localStorage.setItem("sc_orders", JSON.stringify(o)); }
function gmapsUrl(m){ return `https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}`; }
function waLink(no, text){ const n=no.replace(/[^0-9]/g,"").replace(/^0/,"62"); return `https://wa.me/${n}?text=${encodeURIComponent(text)}`; }

function mitraDenganJarak(){
  const ref = userLoc || defaultLoc;
  return MITRA.map(m=>({...m, jarak:haversine(ref.lat,ref.lng,m.lat,m.lng), buka:isOpenNow(m)}));
}

function seedDemo(){
  // bersihkan data lama (Jakarta) supaya tidak muncul jauh
  let all=getOrders().filter(o=>MITRA.find(m=>m.id===o.mitraId) || o.kode.startsWith("CS-DEMO"));
  all=all.filter(o=>!o.kode.startsWith("CS-DEMO") || ["CS-DEMO1","CS-DEMO2"].includes(o.kode));
  // hapus demo lama yang menunjuk mitra Jakarta
  all=all.filter(o=>!(o.kode.startsWith("CS-DEMO") && !["cleansteps-sekaran","sneakerhub-tembalang"].includes(o.mitraId)));
  const now=Date.now();
  const mk=(kode,mitra,mitraId,layanan,tahap,jam,total)=>{
    const dibuat=new Date(now-jam*3600*1000).toISOString();
    return { kode, mitra, mitraId, layanan, metode:"Antar sendiri", nama:"Demo", wa:"08xx", catatan:"", total, dibuat, tahap,
      riwayat: TAHAP.slice(0,tahap+1).map((t,i)=>({tahap:i, waktu:new Date(now-(jam-i)*3600*1000).toISOString(), ket:t})) };
  };
  [mk("CS-DEMO1","CleanSteps Sekaran","cleansteps-sekaran","Deep Clean",2,26,"Rp30.000"), mk("CS-DEMO2","SneakerHub Tembalang","sneakerhub-tembalang","Deep Clean",4,70,"Rp30.000")].forEach(d=>{ if(!all.find(o=>o.kode===d.kode)) all.push(d); });
  // buang order order lama yang mitra-nya sudah tidak ada
  all=all.filter(o=>o.kode.startsWith("CS-DEMO") || MITRA.find(m=>m.id===o.mitraId));
  saveOrders(all); localStorage.setItem("sc_seeded_unnes","1");
}