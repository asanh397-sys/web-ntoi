/* ============================================================
   GEN HASAN - app.js
   1) Deploy code.gs sebagai Web App, salin URL-nya.
   2) Tempel URL tersebut di bawah ini (di antara tanda kutip).
   ============================================================ */
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz-EIPTzS4oZB9njp6vQJORVwrnVX_BTyTB64KImQ76sz2qeu-vXXwtKKbS6GFQYJPYdw/exec"; // contoh: "https://script.google.com/macros/s/XXXXXXXX/exec"

/* Data contoh dipakai otomatis jika SCRIPT_URL masih kosong / gagal dimuat */
const DEMO_MENU = [
  { id: 1, nama: "Kebab Original", kategori: "Kebab", deskripsi: "Daging sapi + sayur segar + saus spesial", harga: 15000, rating: 4.8, ulasan: "12.5K+", badge: "Terlaris", emoji: "🥙" },
  { id: 2, nama: "Kebab Jumbo Keju", kategori: "Kebab", deskripsi: "Daging ganda + keju leleh + mayo", harga: 22000, rating: 4.7, ulasan: "8.7K+", badge: "Populer", emoji: "🌯" },
  { id: 3, nama: "Burger Kebab", kategori: "Burger", deskripsi: "Roti bun + daging kebab + saus BBQ", harga: 18000, rating: 4.6, ulasan: "6.3K+", badge: "Hemat 15%", emoji: "🍔" },
  { id: 4, nama: "Kebab Pedas Level 5", kategori: "Kebab", deskripsi: "Daging + sambal gen hasan yang nendang", harga: 17000, rating: 4.9, ulasan: "9.1K+", badge: "", emoji: "🌶️" },
  { id: 5, nama: "Kebab Mini", kategori: "Snack", deskripsi: "Ukuran mungil, cocok buat camilan", harga: 9000, rating: 4.5, ulasan: "4.2K+", badge: "", emoji: "🌮" },
  { id: 6, nama: "Kentang Goreng", kategori: "Snack", deskripsi: "Renyah dengan taburan bumbu", harga: 12000, rating: 4.6, ulasan: "3.9K+", badge: "", emoji: "🍟" },
  { id: 7, nama: "Es Teh Manis", kategori: "Minuman", deskripsi: "Segar, manis pas", harga: 5000, rating: 4.7, ulasan: "7.8K+", badge: "", emoji: "🧋" },
  { id: 8, nama: "Es Jeruk", kategori: "Minuman", deskripsi: "Jeruk peras asli", harga: 7000, rating: 4.6, ulasan: "2.4K+", badge: "", emoji: "🍊" },
  { id: 9, nama: "Pisang Coklat", kategori: "Dessert", deskripsi: "Pisang goreng, coklat lumer", harga: 10000, rating: 4.8, ulasan: "3.1K+", badge: "Baru", emoji: "🍫" }
];
const DEMO_SETTINGS = { whatsapp: "6281234567890", diskon: "25", alamat: "Buka setiap hari, 10.00 - 22.00", pengumuman: "Selamat datang di Gen Hasan! 🥙" };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rp = n => "Rp" + Number(n || 0).toLocaleString("id-ID");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const state = { menu: [], settings: { ...DEMO_SETTINGS }, cat: "Semua", q: "", sort: 0, cart: {}, fav: new Set() };
const SORTS = ["Urutan awal", "Harga termurah", "Rating tertinggi"];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- toast ---------- */
let tt;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400);
}

/* ---------- scroll reveal ---------- */
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target; io.unobserve(el);
    el.classList.add("in");
    setTimeout(() => el.classList.add("done"), 1000);
  });
}, { threshold: .12, rootMargin: "0px 0px -30px 0px" }) : null;
function watch(el) { if (io) io.observe(el); else el.classList.add("in", "done"); }
$$(".reveal").forEach(watch);

/* ---------- data ---------- */
async function loadData() {
  if (!SCRIPT_URL) {
    state.menu = DEMO_MENU;
    toast("Mode demo: isi SCRIPT_URL di app.js");
    return;
  }
  try {
    const r = await fetch(SCRIPT_URL + "?action=data");
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    if (!d || !Array.isArray(d.menu)) throw new Error("format");
    state.menu = d.menu.map(m => ({
      ...m, id: String(m.id), harga: Number(m.harga) || 0, rating: Number(m.rating) || 0,
      emoji: m.emoji || "🥙", kategori: m.kategori || "Lainnya"
    }));
    state.settings = { ...DEMO_SETTINGS, ...(d.settings || {}) };
  } catch (e) {
    state.menu = DEMO_MENU;
    toast("Gagal memuat spreadsheet, memakai data contoh");
  }
}

/* ---------- render ---------- */
function renderCats() {
  const map = new Map([["Semua", "🍽️"]]);
  state.menu.forEach(m => { if (!map.has(m.kategori)) map.set(m.kategori, m.emoji); });
  if (!map.has(state.cat)) state.cat = "Semua";
  $("#cats").innerHTML = [...map].map(([c, e]) =>
    `<button class="cat reveal ${c === state.cat ? "on" : ""}" data-c="${esc(c)}"><span>${esc(e)}</span>${esc(c)}</button>`).join("");
  $$("#cats .cat").forEach((b, i) => { b.style.transitionDelay = i * 60 + "ms"; watch(b); });
}

function visible() {
  const q = state.q.trim().toLowerCase();
  let l = state.menu.filter(m => (state.cat === "Semua" || m.kategori === state.cat) &&
    (!q || (m.nama + " " + m.deskripsi + " " + m.kategori).toLowerCase().includes(q)));
  if (state.sort === 1) l = [...l].sort((a, b) => a.harga - b.harga);
  if (state.sort === 2) l = [...l].sort((a, b) => b.rating - a.rating);
  return l;
}

function renderGrid() {
  const l = visible(), g = $("#grid");
  $("#menuTitle").textContent = state.cat === "Semua" ? "Pilihan Favorit" : state.cat;
  if (!l.length) { g.innerHTML = `<div class="empty">Menu tidak ditemukan. Coba kata kunci atau kategori lain.</div>`; return; }
  g.innerHTML = l.map((m, i) => {
    const b = esc(m.badge), cls = i % 3 === 1 ? "o" : i % 3 === 2 ? "p" : "";
    return `<article class="card neo reveal" style="transition-delay:${Math.min(i % 4, 3) * 90}ms">
      ${b ? `<span class="tag ${cls}">${b}</span>` : `<span style="height:22px"></span>`}
      <button class="heart ${state.fav.has(m.id) ? "on" : ""}" data-fav="${esc(m.id)}" aria-label="Favorit"><svg viewBox="0 0 24 24"><path d="M12 21s-8-5.3-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 10c0 5.700-8 11-8 11z"/></svg></button>
      <div class="pic">${esc(m.emoji)}</div>
      <h4>${esc(m.nama)}</h4><p>${esc(m.deskripsi)}</p>
      <div class="rate"><b>★</b> ${m.rating ? m.rating.toFixed(1) : "-"} ${m.ulasan ? "(" + esc(m.ulasan) + ")" : ""}</div>
      <div class="row"><span class="price">${rp(m.harga)}</span><button class="add" data-add="${esc(m.id)}" aria-label="Tambah ${esc(m.nama)}">+</button></div>
    </article>`;
  }).join("");
  $$("#grid .reveal").forEach(watch);
}

function renderSettings() {
  const s = state.settings;
  const d = String(s.diskon || "").replace(/\D/g, "");
  if (d) { $("#offPct").textContent = d + "%"; $("#offTitle").textContent = "Diskon Hingga " + d + "%"; }
  $("#infoAddr").textContent = s.alamat || "";
  const wa = String(s.whatsapp || "").replace(/\D/g, "");
  $("#infoWa").textContent = wa ? "WhatsApp: +" + wa : "";
}

/* ---------- cart ---------- */
const find = id => state.menu.find(m => m.id === String(id));
const count = () => Object.values(state.cart).reduce((a, b) => a + b, 0);
function updateBadges(bump) {
  const n = count();
  $("#bagCount").textContent = n; $("#navCount").textContent = n; $("#navCount").hidden = !n;
  if (bump) [$("#bagCount"), $("#navCount")].forEach(b => { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); });
}
function renderCart() {
  const ids = Object.keys(state.cart).filter(id => find(id));
  let total = 0;
  $("#items").innerHTML = ids.length ? ids.map(id => {
    const m = find(id), q = state.cart[id]; total += m.harga * q;
    return `<div class="it neo"><span class="e">${esc(m.emoji)}</span><div><b>${esc(m.nama)}</b><small>${rp(m.harga)}</small></div>
      <div class="q"><button data-dec="${esc(id)}" aria-label="Kurangi">−</button><span>${q}</span><button data-inc="${esc(id)}" aria-label="Tambah">+</button></div></div>`;
  }).join("") : `<div class="empty">Keranjang masih kosong.<br>Pilih menu lalu tekan tombol +</div>`;
  $("#total").textContent = rp(total);
  $("#checkout").disabled = !ids.length;
  updateBadges();
}
function setQty(id, d) {
  id = String(id);
  const n = (state.cart[id] || 0) + d;
  if (n <= 0) delete state.cart[id]; else state.cart[id] = n;
  renderCart();
}
function openCart(o) {
  $("#drawer").classList.toggle("show", o); $("#ov").classList.toggle("show", o);
  document.body.style.overflow = o ? "hidden" : "";
  if (o) renderCart();
}

async function checkout() {
  const ids = Object.keys(state.cart).filter(id => find(id));
  if (!ids.length) return;
  const name = $("#cName").value.trim();
  if (!name) { toast("Isi nama kamu dulu ya"); $("#cName").focus(); return; }
  const note = $("#cNote").value.trim();
  let total = 0;
  const lines = ids.map(id => { const m = find(id), q = state.cart[id]; total += m.harga * q; return `- ${q}x ${m.nama} (${rp(m.harga * q)})`; });
  const wa = String(state.settings.whatsapp || "").replace(/\D/g, "");
  if (!wa) { toast("Nomor WhatsApp toko belum diatur"); return; }
  const msg = `Halo Gen Hasan, saya mau pesan:\n${lines.join("\n")}\n\nTotal: ${rp(total)}\nNama: ${name}${note ? "\nCatatan: " + note : ""}`;

  if (SCRIPT_URL) { // catat pesanan ke spreadsheet (tanpa menunggu)
    try {
      fetch(SCRIPT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ nama: name, catatan: note, pesanan: lines.join("; "), total }) }).catch(() => {});
    } catch (e) {}
  }
  window.open("https://wa.me/" + wa + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  state.cart = {}; $("#cNote").value = ""; renderCart(); openCart(false);
  toast("Pesanan dikirim. Terima kasih! 🙏");
}

/* ---------- hero slider ---------- */
(function slider() {
  const tr = $("#track"), n = $$(".slide", tr).length, hero = $("#hero"), dots = $("#dots");
  let i = 0, timer, sx = null;
  dots.innerHTML = Array.from({ length: n }, (_, k) => `<button aria-label="Slide ${k + 1}"></button>`).join("");
  const ds = $$("button", dots);
  function go(k) { i = (k + n) % n; tr.style.transform = `translateX(-${i * 100}%)`; ds.forEach((d, j) => d.classList.toggle("on", j === i)); }
  function play() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(i + 1), 4800); }
  ds.forEach((d, k) => d.addEventListener("click", () => { go(k); play(); }));
  hero.addEventListener("touchstart", e => { sx = e.touches[0].clientX; clearInterval(timer); }, { passive: true });
  hero.addEventListener("touchend", e => {
    if (sx !== null) { const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); }
    sx = null; play();
  });
  hero.addEventListener("mouseenter", () => clearInterval(timer));
  hero.addEventListener("mouseleave", play);
  go(0); play();
})();

/* ---------- events ---------- */
$("#cats").addEventListener("click", e => {
  const b = e.target.closest(".cat"); if (!b) return;
  state.cat = b.dataset.c;
  $$("#cats .cat").forEach(x => x.classList.toggle("on", x === b));
  renderGrid();
});
$("#viewAll").addEventListener("click", () => {
  state.cat = "Semua"; state.q = ""; $("#q").value = "";
  $$("#cats .cat").forEach(x => x.classList.toggle("on", x.dataset.c === "Semua"));
  renderGrid(); toast("Menampilkan semua menu");
});
let st;
$("#q").addEventListener("input", e => { clearTimeout(st); st = setTimeout(() => { state.q = e.target.value; renderGrid(); }, 200); });
$("#btnSort").addEventListener("click", () => { state.sort = (state.sort + 1) % SORTS.length; renderGrid(); toast("Urut: " + SORTS[state.sort]); });
$("#grid").addEventListener("click", e => {
  const a = e.target.closest("[data-add]"), f = e.target.closest("[data-fav]");
  if (a) { const m = find(a.dataset.add); if (!m) return; state.cart[m.id] = (state.cart[m.id] || 0) + 1; updateBadges(true); toast(m.nama + " ditambahkan 🛒"); }
  if (f) { const id = f.dataset.fav; state.fav.has(id) ? state.fav.delete(id) : state.fav.add(id); f.classList.toggle("on"); }
});
$("#items").addEventListener("click", e => {
  const i = e.target.closest("[data-inc]"), d = e.target.closest("[data-dec]");
  if (i) setQty(i.dataset.inc, 1); if (d) setQty(d.dataset.dec, -1);
});
$("#btnBag").addEventListener("click", () => openCart(true));
$("#navOrder").addEventListener("click", () => openCart(true));
$("#closeCart").addEventListener("click", () => openCart(false));
$("#ov").addEventListener("click", () => openCart(false));
document.addEventListener("keydown", e => { if (e.key === "Escape") openCart(false); });
$("#checkout").addEventListener("click", checkout);
$("#btnBell").addEventListener("click", () => { toast(state.settings.pengumuman || "Belum ada notifikasi baru"); $(".badge", $("#btnBell")).hidden = true; });
$("#btnMenu").addEventListener("click", () => $("#info").scrollIntoView({ behavior: reduce ? "auto" : "smooth" }));

const navBtns = $$(".nav [data-go]");
navBtns.forEach(b => b.addEventListener("click", () => {
  const t = b.dataset.go === "top" ? document.body : document.getElementById(b.dataset.go);
  if (b.dataset.go === "top") scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  else t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
}));
const secs = ["top", "menu", "offers", "info"];
addEventListener("scroll", () => {
  const y = scrollY + innerHeight * .4, atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  let cur = "top";
  secs.slice(1).forEach(id => { const el = document.getElementById(id); if (el && el.offsetTop <= y) cur = id; });
  if (atEnd) cur = "info";
  navBtns.forEach(b => b.classList.toggle("on", b.dataset.go === cur));
}, { passive: true });

/* ---------- start ---------- */
(async function init() {
  await loadData();
  renderSettings(); renderCats(); renderGrid(); renderCart();
})();
