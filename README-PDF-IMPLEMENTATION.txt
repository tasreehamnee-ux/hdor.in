تعليمات التطبيق على الكود الحالي
=====================================

## المميزات المضافة:

✅ **حفظ PDF بحجم A4 ورقة واحدة**
- تنسيق ورقة A4 قياسية (210 × 297 ملم)
- هوامش محددة (10 ملم من كل جهة)
- لا يتجاوز محتوى الورقة الهوامش

✅ **دعم 12 حقل بورقة واحدة**
- عدد ثابت من الصفوف في كل صفحة
- تقسيم تلقائي للبيانات الكبيرة إلى صفحات متعددة
- كل 12 حقل = صفحة واحدة A4

✅ **دعم iOS والأنظمة الأخرى**
- يكتشف نوع النظام تلقائياً
- معالجة خاصة لـ iOS (iPhone, iPad, iPod)
- يعمل على Android, Windows, Mac, Linux
- يدعم جميع المتصفحات الحديثة

## خطوات التطبيق:

### 1. أضف السكريبت إلى index.html:

```html
<!-- قبل إغلاق body -->
<script src="pdf-generator.js"></script>
```

### 2. أضف زر الحفظ إلى صفحتك:

```html
<button class="action-btn pdf" onclick="generateAndSavePDF()">
  <span>💾</span>
  حفظ كـ PDF
</button>
```

### 3. أضف الدالة الرئيسية في index.html:

```javascript
function generateAndSavePDF() {
  // جهز البيانات من الجدول
  const data = [];
  const table = document.querySelector('.entry-table tbody');
  
  if (!table) {
    alert('لا توجد بيانات للحفظ');
    return;
  }

  const rows = table.querySelectorAll('tr');
  rows.forEach((row) => {
    const cells = row.querySelectorAll('td');
    if (cells.length >= 2) {
      data.push({
        name: cells[0]?.textContent?.trim() || '',
        status: cells[1]?.textContent?.trim() || '',
        notes: cells[cells.length - 1]?.textContent?.trim() || ''
      });
    }
  });

  if (data.length === 0) {
    alert('لا توجد بيانات للحفظ');
    return;
  }

  // إنشاء اسم الملف
  const today = new Date();
  const filename = `تقرير_الحضور_${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}.pdf`;

  // حفظ PDF مع دعم iOS
  PDFGenerator.savePDFiOS(data, filename).then(result => {
    if (result.success) {
      showToast('✓ تم حفظ الملف بنجاح: ' + filename);
    } else {
      alert('❌ خطأ: ' + result.message);
    }
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message;
  toast.style.bottom = '20px';
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

## الخصائص الرئيسية:

📋 **معايير PDF**
- الحجم: A4 (210mm × 297mm)
- الاتجاه: رأسي (Portrait)
- الهوامش: 10mm من جميع الجهات
- الضغط: مفعّل لتقليل حجم الملف

📊 **جدول البيانات**
- 3 أعمدة: الموظف، الحالة، الملاحظات
- ألوان متناوبة (أبيض ورمادي فاتح)
- حدود واضحة بين الخلايا
- خط عربي (Cairo)

🌐 **التوافقية**
```
✓ iOS (iPhone, iPad)
✓ Android
✓ Windows
✓ macOS
✓ Linux
```

## ملاحظات هامة:

1. **jsPDF و html2canvas** مكتبات خارجية مطلوبة (موجودة بالفعل في index.html)
2. البيانات تُحفظ تلقائياً على جهاز المستخدم
3. الملف يُنزل تلقائياً عند الضغط على الزر
4. اللغة العربية مدعومة بالكامل

## اختبار البرنامج:

جرب على:
1. متصفح سطح المكتب (Chrome, Firefox, Safari, Edge)
2. iPhone/iPad
3. Android Phone/Tablet

الملف سيُحفظ بنفس الشكل على جميع الأجهزة!
