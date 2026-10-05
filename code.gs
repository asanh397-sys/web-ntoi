/**
 * GEN HASAN - Google Apps Script (Web App)
 *
 * CARA PAKAI:
 * 1. Buka Google Sheets baru > Extensions (Ekstensi) > Apps Script.
 * 2. Hapus isi default, tempel seluruh kode ini, lalu Simpan.
 * 3. Pilih fungsi "setup" lalu klik Run (izinkan akses). Ini membuat sheet
 *    Menu, Pengaturan, dan Pesanan beserta contoh data.
 * 4. Deploy > New deployment > jenis "Web app"
 *      Execute as : Me
 *      Who has access : Anyone
 *    Salin URL Web App, tempel ke SCRIPT_URL di app.js.
 * 5. Setiap mengubah kode ini, buat deployment baru (Manage deployments > Edit > New version).
 */

const SHEET_MENU = "Menu";
const SHEET_SET = "Pengaturan";
const SHEET_ORD = "Pesanan";
const MENU_HEADER = ["id", "nama", "kategori", "deskripsi", "harga", "rating", "ulasan", "badge", "emoji", "aktif"];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let m = ss.getSheetByName(SHEET_MENU);
  if (!m) {
    m = ss.insertSheet(SHEET_MENU);
    m.getRange(1, 1, 1, MENU_HEADER.length).setValues([MENU_HEADER]).setFontWeight("bold").setBackground("#f3d9b8");
    m.getRange(2, 1, 9, MENU_HEADER.length).setValues([
      [1, "Kebab Original", "Kebab", "Daging sapi + sayur segar + saus spesial", 15000, 4.8, "12.5K+", "Terlaris", "🥙", "YA"],
      [2, "Kebab Jumbo Keju", "Kebab", "Daging ganda + keju leleh + mayo", 22000, 4.7, "8.7K+", "Populer", "🌯", "YA"],
      [3, "Burger Kebab", "Burger", "Roti bun + daging kebab + saus BBQ", 18000, 4.6, "6.3K+", "Hemat 15%", "🍔", "YA"],
      [4, "Kebab Pedas Level 5", "Kebab", "Daging + sambal gen hasan yang nendang", 17000, 4.9, "9.1K+", "", "🌶️", "YA"],
      [5, "Kebab Mini", "Snack", "Ukuran mungil, cocok buat camilan", 9000, 4.5, "4.2K+", "", "🌮", "YA"],
      [6, "Kentang Goreng", "Snack", "Renyah dengan taburan bumbu", 12000, 4.6, "3.9K+", "", "🍟", "YA"],
      [7, "Es Teh Manis", "Minuman", "Segar, manis pas", 5000, 4.7, "7.8K+", "", "🧋", "YA"],
      [8, "Es Jeruk", "Minuman", "Jeruk peras asli", 7000, 4.6, "2.4K+", "", "🍊", "YA"],
      [9, "Pisang Coklat", "Dessert", "Pisang goreng, coklat lumer", 10000, 4.8, "3.1K+", "Baru", "🍫", "YA"]
    ]);
    m.getRange("G:G").setNumberFormat("@"); // ulasan sebagai teks
    m.setFrozenRows(1);
    m.autoResizeColumns(1, MENU_HEADER.length);
  }

  let s = ss.getSheetByName(SHEET_SET);
  if (!s) {
    s = ss.insertSheet(SHEET_SET);
    s.getRange(1, 1, 5, 2).setValues([
      ["kunci", "nilai"],
      ["whatsapp", "6281234567890"],
      ["diskon", "25"],
      ["alamat", "Buka setiap hari, 10.00 - 22.00"],
      ["pengumuman", "Selamat datang di Gen Hasan! 🥙"]
    ]);
    s.getRange("A1:B1").setFontWeight("bold").setBackground("#f3d9b8");
    s.getRange("B:B").setNumberFormat("@");
    s.setColumnWidth(1, 120); s.setColumnWidth(2, 360);
  }

  let o = ss.getSheetByName(SHEET_ORD);
  if (!o) {
    o = ss.insertSheet(SHEET_ORD);
    o.getRange(1, 1, 1, 5).setValues([["waktu", "nama", "pesanan", "catatan", "total"]]).setFontWeight("bold").setBackground("#f3d9b8");
    o.setFrozenRows(1);
  }

  const def = ss.getSheetByName("Sheet1") || ss.getSheetByName("Sheet 1") || ss.getSheetByName("Lembar1");
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const m = ss.getSheetByName(SHEET_MENU);
    if (!m) return json_({ error: "Sheet Menu belum ada. Jalankan fungsi setup." });

    const rows = m.getDataRange().getValues();
    const head = rows.shift().map(h => String(h).trim().toLowerCase());
    const menu = rows
      .filter(r => r[head.indexOf("nama")] !== "")
      .map(r => {
        const o = {};
        head.forEach((h, i) => { o[h] = r[i]; });
        return o;
      })
      .filter(o => ["tidak", "no", "false", "0", "nonaktif"].indexOf(String(o.aktif).trim().toLowerCase()) === -1)
      .map(o => ({
        id: String(o.id !== "" ? o.id : o.nama),
        nama: String(o.nama),
        kategori: String(o.kategori || "Lainnya"),
        deskripsi: String(o.deskripsi || ""),
        harga: Number(o.harga) || 0,
        rating: Number(o.rating) || 0,
        ulasan: String(o.ulasan || ""),
        badge: String(o.badge || ""),
        emoji: String(o.emoji || "🥙")
      }));

    const settings = {};
    const s = ss.getSheetByName(SHEET_SET);
    if (s && s.getLastRow() > 1) {
      s.getRange(2, 1, s.getLastRow() - 1, 2).getValues().forEach(r => {
        if (r[0] !== "") settings[String(r[0]).trim()] = String(r[1]);
      });
    }
    return json_({ menu: menu, settings: settings });
  } catch (err) {
    return json_({ error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const d = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let o = ss.getSheetByName(SHEET_ORD);
    if (!o) { setup(); o = ss.getSheetByName(SHEET_ORD); }
    const clean = v => String(v || "").replace(/^[=+\-@]/, "'$&").slice(0, 500); // cegah formula injection
    o.appendRow([new Date(), clean(d.nama), clean(d.pesanan), clean(d.catatan), Number(d.total) || 0]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
