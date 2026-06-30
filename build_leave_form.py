import os, sys

with open('logo_b64_temp.txt', 'r', encoding='utf-8') as f:
    LOGO = f.read().strip()

html = r"""<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>طلب أجازة - وزارة الشباب والرياضة</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Cairo', 'Arial', sans-serif;
            background: #e8edf2;
            direction: rtl;
            padding: 20px;
        }

        /* ===== أزرار التحكم (فوق الصفحة) ===== */
        .controls {
            max-width: 800px;
            margin: 0 auto 15px;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            padding: 10px 28px;
            font-family: 'Cairo', sans-serif;
            font-size: 15px;
            font-weight: 700;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.25s;
            display: flex;
            align-items: center;
            gap: 6px;
            box-shadow: 0 3px 8px rgba(0,0,0,0.18);
        }
        .btn-save {
            background: linear-gradient(135deg,#1a3a5c,#2a5a8c);
            color: white;
        }
        .btn-save:hover { background: linear-gradient(135deg,#0d1f33,#1a3a5c); transform:translateY(-1px); }
        .btn-reset {
            background: linear-gradient(135deg,#c41e3a,#9a1830);
            color: white;
        }
        .btn-reset:hover { background: linear-gradient(135deg,#9a1830,#6d1022); transform:translateY(-1px); }

        /* ===== الحاوية الرئيسية ===== */
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: none;
            padding: 28px 38px 30px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
        }

        /* ===== الترويسة ===== */
        .header {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            align-items: start;
            border-bottom: 3px solid #1a3a5c;
            padding-bottom: 14px;
            margin-bottom: 22px;
            gap: 10px;
            min-height: 110px;
        }

        /* عمود يمين: وزارة الشباب */
        .header-ministry {
            text-align: right;
            padding-top: 5px;
        }
        .header-ministry .min-name {
            font-size: 17px;
            font-weight: 800;
            color: #1a3a5c;
            margin-bottom: 6px;
            line-height: 1.3;
        }
        .header-ministry .dept {
            font-size: 13px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
        }
        .header-ministry .branch {
            font-size: 13px;
            font-weight: 600;
            color: #1a3a5c;
        }

        /* عمود وسط: شعار */
        .header-logo {
            text-align: center;
            width: 110px;
            flex-shrink: 0;
        }
        .header-logo img {
            width: 100px;
            height: 100px;
            object-fit: contain;
            display: block;
            margin: 0 auto 3px;
        }
        .header-logo p {
            font-size: 10px;
            color: #333;
            font-weight: 700;
        }

        /* عمود يسار: الوحدة والتاريخ */
        .header-info {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding-top: 5px;
        }
        .info-row {
            display: flex;
            align-items: flex-end;
            gap: 6px;
            width: 100%;
            flex-direction: row;          /* label يمين، input يسار */
        }
        .info-row label {
            font-size: 14px;
            font-weight: 700;
            color: #1a3a5c;
            white-space: nowrap;
            flex-shrink: 0;
        }
        .info-row input {
            border: none;
            border-bottom: 1.5px solid #1a3a5c;
            background: transparent;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
            width: 110px;
            flex-shrink: 0;
            padding: 2px 4px;
            text-align: center;
            color: #111;
        }
        .info-row input:focus { outline: none; border-bottom: 2px solid #c41e3a; }

        /* ===== عنوان النموذج ===== */
        .form-title {
            text-align: center;
            margin: 20px 0 18px;
        }
        .form-title h1 {
            font-size: 26px;
            font-weight: 800;
            color: #000;
        }

        /* ===== نوع الأجازة ===== */
        .leave-type-row {
            display: flex;
            align-items: center;
            gap: 22px;
            margin-bottom: 18px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        .leave-type-label {
            font-weight: 800;
            font-size: 15px;
            margin-left: auto;
            order: 10;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        .checkbox-item input[type="checkbox"] {
            width: 20px;
            height: 20px;
            border: 2px solid #333;
            cursor: pointer;
            accent-color: #1a3a5c;
        }
        .checkbox-item label {
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
        }

        /* ===== حقول الاستمارة ===== */
        .form-row {
            display: flex;
            align-items: center;
            margin-bottom: 14px;
            gap: 6px;
            flex-wrap: wrap;
        }
        .form-row label {
            font-weight: 700;
            font-size: 14px;
            color: #000;
            white-space: nowrap;
        }
        .form-row input[type="text"],
        .form-row input[type="number"] {
            border: none;
            border-bottom: 1px dotted #555;
            background: transparent;
            font-family: 'Cairo', sans-serif;
            font-size: 14px;
            padding: 3px 6px;
            text-align: center;
            color: #111;
        }
        .form-row input[type="text"]:focus,
        .form-row input[type="number"]:focus {
            outline: none;
            border-bottom: 2px solid #c41e3a;
        }
        .input-flex { flex: 1; min-width: 80px; }

        /* ===== قسم التواقيع ===== */
        .sig-section {
            margin-top: 28px;
            padding-top: 14px;
            border-top: 1px solid #ccc;
        }
        .sig-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-top: 10px;
        }
        .sig-box { text-align: center; }
        .sig-box label {
            display: block;
            font-weight: 700;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .sig-line {
            border-bottom: 1px solid #333;
            height: 45px;
        }
        .sig-date {
            display: flex;
            justify-content: center;
            gap: 4px;
            margin-top: 8px;
            font-size: 13px;
        }
        .sig-date input {
            width: 36px;
            border: none;
            border-bottom: 1px dotted #333;
            text-align: center;
            font-family: 'Cairo', sans-serif;
            font-size: 13px;
        }
        .sig-date span { font-weight: 700; }

        /* ===== تذييل ===== */
        .footer-row {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 10px;
            font-size: 13px;
            font-weight: 700;
        }

        /* ===== طباعة / PDF ===== */
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border: none; max-width: 100%; }
            .controls { display: none !important; }
            .info-row input, .form-row input { border-bottom-style: solid !important; }
        }
    </style>
</head>
<body>

    <!-- أزرار التحكم -->
    <div class="controls" id="controls">
        <button class="btn btn-save" onclick="saveAsPDF()">💾 حفظ كـ PDF</button>
        <button class="btn btn-reset" onclick="resetForm()">🔄 إعادة تعيين</button>
    </div>

    <div class="container" id="formPage">

        <!-- ===== الترويسة ===== -->
        <div class="header">
            <!-- يمين: وزارة الشباب -->
            <div class="header-ministry">
                <div class="min-name">وزارة الشباب والرياضة</div>
                <div class="dept">قسم التصاريح الامنية</div>
                <div class="branch">شعبة المتابعة</div>
            </div>

            <!-- وسط: الشعار -->
            <div class="header-logo">
                <img src="LOGO_PLACEHOLDER" alt="شعار المتابعة - التصاريح الامنية">
                <p>التصاريح الامنية</p>
            </div>

            <!-- يسار: الوحدة والتاريخ -->
            <div class="header-info">
                <div class="info-row">
                    <label>:الوحدة</label>
                    <input type="text" id="unit" placeholder="">
                </div>
                <div class="info-row">
                    <label>:التاريخ</label>
                    <input type="text" id="headerDate" placeholder="">
                </div>
            </div>
        </div>

        <!-- ===== عنوان الاستمارة ===== -->
        <div class="form-title">
            <h1>طلب أجازة</h1>
        </div>

        <!-- ===== نوع الأجازة ===== -->
        <div class="leave-type-row">
            <label class="leave-type-label">نوع الاجازة :</label>
            <div class="checkbox-item">
                <label for="annual">اعتيادية</label>
                <input type="checkbox" id="annual" name="leaveType" onchange="onlyOne(this)">
            </div>
            <div class="checkbox-item">
                <label for="sick">عارضة</label>
                <input type="checkbox" id="sick" name="leaveType" onchange="onlyOne(this)">
            </div>
            <div class="checkbox-item">
                <label for="medical">مرضية</label>
                <input type="checkbox" id="medical" name="leaveType" onchange="onlyOne(this)">
            </div>
        </div>

        <!-- ===== البيانات الأساسية ===== -->
        <div class="form-row">
            <label>الاسم :</label>
            <input type="text" id="fullName" class="input-flex">
        </div>
        <div class="form-row">
            <label>الوظيفـــــــــــة :</label>
            <input type="text" id="jobTitle" class="input-flex">
        </div>

        <!-- ===== طلب الموافقة ===== -->
        <div class="form-row">
            <label>ارجو الموافقة على منحى الأجازة الموضحة عاليه لمدة (</label>
            <input type="number" id="leaveDays" style="width:50px;">
            <label>) يوم</label>
        </div>

        <!-- ===== تواريخ الأجازة ===== -->
        <div class="form-row" style="flex-wrap:nowrap; gap:5px;">
            <label>ابتداء من يوم</label>
            <input type="text" id="startDay" style="width:80px;">
            <label>الموافق :</label>
            <input type="text" id="startDate" style="width:95px;">
            <label>وتنتهى في يوم</label>
            <input type="text" id="endDay" style="width:80px;">
            <input type="text" id="endDate" style="width:95px;">
        </div>
        <div class="form-row">
            <label>تاريخ العودة للعمل يوم</label>
            <input type="text" id="returnDay" style="width:120px;">
            <label>الموافق :</label>
            <input type="text" id="returnDate" style="width:130px;">
        </div>

        <!-- ===== عنوان أثناء الأجازة ===== -->
        <div class="form-row">
            <label>وعنوانى أثناء الأجازة :</label>
            <input type="text" id="leaveAddress" class="input-flex">
        </div>

        <!-- ===== التوقيع وتقديم الطلب ===== -->
        <div class="form-row">
            <label>توقيع مقدم الطلب :</label>
            <input type="text" id="applicantSig" style="width:140px;">
            <label>تاريخ تقديم الطلب :</label>
            <input type="text" id="submitDate" style="width:130px;">
        </div>
        <div class="form-row">
            <label>اسم القائم بالعمل اثناء الاجازة :</label>
            <input type="text" id="replacement" class="input-flex">
        </div>
        <div class="form-row">
            <label>التوقيع</label>
            <input type="text" id="replacementSig" style="width:190px;">
        </div>

        <!-- ===== موافقة مسؤول الشعبة ===== -->
        <div class="form-row" style="margin-top:22px;">
            <label>موافقة مسؤول الشعبة :</label>
            <input type="text" id="managerApproval" style="width:230px;">
        </div>
        <div class="form-row">
            <label>التاريخ :</label>
            <input type="text" id="managerDate" style="width:140px;">
        </div>

        <!-- ===== تذييل ===== -->
        <div class="footer-row">
            <span>مسؤول الوحدة</span>
            <span>مسؤول الشعبة</span>
        </div>

    </div><!-- end .container -->

    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
    <script>
        // اختيار نوع الأجازة واحد فقط
        function onlyOne(cb) {
            document.querySelectorAll('input[name="leaveType"]').forEach(function(c) {
                if (c !== cb) c.checked = false;
            });
        }

        // طباعة
        function printForm() {
            window.print();
        }

        // إعادة تعيين
        function resetForm() {
            if (!confirm('هل أنت متأكد من إعادة تعيين جميع الحقول؟')) return;
            document.querySelectorAll('input[type="text"], input[type="number"]').forEach(function(i){ i.value=''; });
            document.querySelectorAll('input[type="checkbox"]').forEach(function(c){ c.checked=false; });
            var today = new Date();
            var d = String(today.getDate()).padStart(2,'0');
            var m = String(today.getMonth()+1).padStart(2,'0');
            var y = today.getFullYear();
            document.getElementById('headerDate').value = d+'/'+m+'/'+y;
        }

        // حفظ PDF
        function saveAsPDF() {
            var el = document.getElementById('formPage');
            var opt = {
                margin: [8, 8, 8, 8],
                filename: 'طلب_اجازة_' + new Date().toISOString().slice(0,10) + '.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            var ctrl = document.getElementById('controls');
            ctrl.style.display = 'none';
            html2pdf().set(opt).from(el).save().then(function(){
                ctrl.style.display = 'flex';
            }).catch(function(){
                ctrl.style.display = 'flex';
                alert('حدث خطأ أثناء الحفظ، يرجى المحاولة مرة أخرى.');
            });
        }

        // تعبئة التاريخ تلقائياً
        document.addEventListener('DOMContentLoaded', function() {
            var today = new Date();
            var d = String(today.getDate()).padStart(2,'0');
            var m = String(today.getMonth()+1).padStart(2,'0');
            var y = today.getFullYear();
            document.getElementById('headerDate').value = d+'/'+m+'/'+y;
        });
    </script>
</body>
</html>
"""

html = html.replace('LOGO_PLACEHOLDER', LOGO)

filename = '\u0637\u0644\u0628 \u0627\u062c\u0627\u0632\u0629.html'
with open(filename, 'w', encoding='utf-8') as f:
    f.write(html)

size = os.path.getsize(filename)
print(f'Done! File size: {size} bytes')
