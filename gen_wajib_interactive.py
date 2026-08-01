import os

# Read the logo base64
with open('logo_b64_temp.txt', 'r', encoding='utf-8') as f:
    LOGO = f.read().strip()

HTML = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>استمارة الواجبات - تفاعلية</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700;900&family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }

body {
  font-family: "Noto Naskh Arabic", Arial, sans-serif;
  background: #e8edf2;
  padding: 20px;
  direction: rtl;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ====== أزرار التحكم ====== */
.controls {
  width: 100%;
  max-width: 210mm;
  margin: 0 auto 15px;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  padding: 10px 26px;
  font-family: 'Cairo', sans-serif;
  font-size: 15px;
  font-weight: 700;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.18);
  transition: all 0.2s;
}
.btn-save { background: linear-gradient(135deg,#1a3a5c,#2a5a8c); color:white; }
.btn-save:hover { filter:brightness(1.1); transform:translateY(-1px); }
.btn-reset { background: linear-gradient(135deg,#c41e3a,#9a1830); color:white; }
.btn-reset:hover { filter:brightness(1.1); transform:translateY(-1px); }

/* ====== الصفحة ====== */
.page {
  width: 210mm;
  min-height: 297mm;
  background: white;
  margin: 0 auto;
  padding: 12mm 20mm 20mm;
  box-shadow: 0 0 15px rgba(0,0,0,0.15);
}

/* ====== الترويسة ====== */
.hdr {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  border-bottom: 3px solid #1a3a5c;
  padding-bottom: 12px;
  margin-bottom: 15px;
  min-height: 110px;
  gap: 10px;
}
.hright { text-align: right; padding-top: 5px; }
.mn { font-size: 18px; font-weight: 900; color: #1a3a5c; margin-bottom: 6px; }
.of { font-size: 15px; font-weight: 700; color: #333; margin-bottom: 4px; }
.dp { font-size: 14px; font-weight: 700; color: #1a3a5c; }
.hc { display:flex; align-items:center; justify-content:center; width:120px; }
.hc img { width:110px; height:110px; object-fit:contain; }
.hlft {
  text-align: left;
  display: block;
  padding-top: 5px;
}
.fr {
  display: inline-flex;
  align-items: flex-end;
  gap: 6px;
  direction: rtl;
  margin-bottom: 14px;
}
.fr:last-child {
  margin-bottom: 0;
}
.fr label {
  font-size: 14px;
  font-weight: 700;
  color: #1a3a5c;
  white-space: nowrap;
  flex-shrink: 0;
}
.fr input {
  border: none;
  border-bottom: 1.5px solid #1a3a5c;
  background: transparent;
  font-family: 'Cairo', sans-serif;
  font-size: 14px;
  width: 130px;
  padding: 2px 4px;
  text-align: center;
  color: #111;
}
.fr input:focus { outline: none; border-bottom: 2px solid #c41e3a; }

/* ====== عنوان الاستمارة ====== */
.ttl {
  text-align:center; font-size:21px; font-weight:900;
  color:#1a3a5c; margin:15px 0 12px;
}

/* ====== حقل الأسبوع ====== */
.week-row {
  display:flex; justify-content:center; align-items:center;
  gap:10px; margin-bottom:14px; flex-wrap:wrap;
}
.week-row label { font-size:15px; font-weight:700; color:#1a3a5c; white-space:nowrap; }
.week-row input {
  border:none; border-bottom:1.5px solid #1a3a5c;
  background:transparent; font-family:"Noto Naskh Arabic",sans-serif;
  font-size:14px; padding:2px 6px; text-align:center; color:#111; width:120px;
}
.week-row input:focus { outline:none; border-bottom:2px solid #c41e3a; }

/* ====== الجدول ====== */
table {
  width:100%; border-collapse:collapse; margin:0 0 18px;
  font-size: 13px;
}
th, td {
  border: 1.5px solid #888;
  padding: 6px 5px;
  text-align: center;
  vertical-align: middle;
}
.mh th { background:#8e9dab; color:white; font-weight:900; font-size:13px; }
.sh th { background:#e8eaed; color:#333; font-weight:900; font-size:12px; }

/* حقول الإدخال داخل الجدول */
td input[type="text"],
td input[type="number"],
td textarea {
  width: 100%;
  border: none;
  background: transparent;
  font-family: "Noto Naskh Arabic", sans-serif;
  font-size: 12.5px;
  text-align: center;
  color: #111;
  padding: 2px;
  resize: none;
  min-height: 28px;
}
td input[type="text"]:focus,
td input[type="number"]:focus,
td textarea:focus {
  outline: 1px solid #1a3a5c;
  background: #f0f6ff;
  border-radius: 3px;
}
td input[type="number"] { -moz-appearance:textfield; }
td input[type="number"]::-webkit-outer-spin-button,
td input[type="number"]::-webkit-inner-spin-button { -webkit-appearance:none; }

/* checkbox */
td input[type="checkbox"] {
  width:18px; height:18px;
  accent-color:#1a3a5c; cursor:pointer;
}
.er td { height: 36px; }

/* ====== قسم التواقيع ====== */
.ftr {
  display:flex; justify-content:space-between;
  margin-top:60px; padding:0 40px;
}
.fi { font-size:16px; font-weight:900; text-align:center; color:#1a3a5c; }
.fi .sl { display:block; width:150px; border-bottom:2px solid #1a3a5c; margin:40px auto 0; }

/* ====== طباعة ====== */
@media print {
  body { background:white; padding:0; }
  .page { box-shadow:none; margin:0; width:100%; padding:8mm 20mm 15mm; }
  .controls { display:none !important; }
  td input, td textarea { border:none !important; background:transparent !important; }
}
</style>
</head>
<body>

<!-- أزرار التحكم -->
<div class="controls" id="controls">
  <button class="btn btn-save" onclick="saveAsPDF()">💾 حفظ كـ PDF</button>
  <button class="btn btn-reset" onclick="resetForm()">🔄 إعادة تعيين</button>
</div>

<div class="page" id="pg">

  <!-- الترويسة -->
  <div class="hdr">
    <div class="hright">
      <div class="mn">وزارة الشباب والرياضة</div>
      <div class="of">قسم التصاريح الامنية</div>
      <div class="dp">شعبة المتابعة</div>
    </div>
    <div class="hc">
      <img src="LOGO_PLACEHOLDER" alt="الشعار">
    </div>
    <div class="hlft">
      <div class="fr">
        <label>:الوحدة</label>
        <input type="text" id="unitName" placeholder="">
      </div>
      <div class="fr">
        <label>:التاريخ</label>
        <input type="text" id="headerDate" placeholder="">
      </div>
    </div>
  </div>

  <!-- عنوان -->
  <div class="ttl">نموذج واجب</div>

  <!-- الجدول -->
  <table>
    <thead>
      <tr class="mh">
        <th rowspan="2" style="width: 5%;">ت</th>
        <th rowspan="2" style="width: 25%;">اسم الموظف</th>
        <th rowspan="2" style="width: 20%;">العنوان الوظيفي</th>
        <th colspan="2" style="width: 20%;">وقت الخروج</th>
        <th rowspan="2" style="width: 20%;">اسم الجهة المقصودة بالواجب</th>
        <th rowspan="2" style="width: 10%;">ملاحظات</th>
      </tr>
      <tr class="sh">
        <th>من الساعة</th>
        <th>الى الساعة</th>
      </tr>
    </thead>
    <tbody id="tbody">
      <!-- تُولَّد الصفوف بـ JS -->
    </tbody>
  </table>

  <!-- التواقيع -->
  <div class="ftr">
    <div class="fi">
      مسؤول&nbsp;&nbsp;الشعبة
      <span class="sl"></span>
    </div>
    <div class="fi">
      مسؤول&nbsp;&nbsp;الوحدة
      <span class="sl"></span>
    </div>
  </div>

</div><!-- /page -->

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
<script>
const ROWS = 10; // عدد الصفوف في نموذج الواجب الأصلي

// بناء صفوف الجدول
function buildTable() {
  const tb = document.getElementById('tbody');
  tb.innerHTML = '';
  for (let i = 1; i <= ROWS; i++) {
    const tr = document.createElement('tr');
    tr.className = 'er';
    tr.innerHTML = `
      <td>${i}</td>
      <td><input type="text" id="name${i}" placeholder=""></td>
      <td><input type="text" id="title${i}" placeholder=""></td>
      <td><input type="text" id="time_from${i}" placeholder=""></td>
      <td><input type="text" id="time_to${i}" placeholder=""></td>
      <td><input type="text" id="destination${i}" placeholder=""></td>
      <td><input type="text" id="note${i}" placeholder=""></td>
    `;
    tb.appendChild(tr);
  }
}

// تعيين التاريخ تلقائياً
function setDate() {
  const now = new Date();
  const d = now.getDate().toString().padStart(2,'0');
  const m = (now.getMonth()+1).toString().padStart(2,'0');
  const y = now.getFullYear();
  document.getElementById('headerDate').value = `${d}/${m}/${y}`;
}

// حفظ PDF
function saveAsPDF() {
  const ctrl = document.getElementById('controls');
  ctrl.style.display = 'none';
  const unit = document.getElementById('unitName').value || 'الوحدة';
  const date = document.getElementById('headerDate').value || '';
  const filename = `نموذج_واجب_${unit}_${date}.pdf`.replace(/\//g,'-');
  const opt = {
    margin:       [8,10,10,10],
    filename:     filename,
    image:        { type:'jpeg', quality:0.98 },
    html2canvas:  { scale:2.5, useCORS:true, allowTaint:true, backgroundColor:'#ffffff' },
    jsPDF:        { unit:'mm', format:'a4', orientation:'portrait' }
  };
  html2pdf().set(opt).from(document.getElementById('pg')).save()
    .finally(() => { ctrl.style.display = 'flex'; });
}

// إعادة تعيين
function resetForm() {
  if (!confirm('هل تريد مسح جميع البيانات؟')) return;
  document.getElementById('unitName').value = '';
  setDate();
  for (let i=1; i<=ROWS; i++) {
    document.getElementById('name'+i).value = '';
    document.getElementById('title'+i).value = '';
    document.getElementById('time_from'+i).value = '';
    document.getElementById('time_to'+i).value = '';
    document.getElementById('destination'+i).value = '';
    document.getElementById('note'+i).value = '';
  }
}

buildTable();
setDate();
</script>
</body>
</html>
"""

HTML = HTML.replace("LOGO_PLACEHOLDER", f"data:image/jpeg;base64,{LOGO}")

out = "wajib-form.html"
with open(out, 'w', encoding='utf-8') as f:
    f.write(HTML)

print(f"Done! {out} => {len(HTML)} bytes")
