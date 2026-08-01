/**
 * PDF Generator - نظام توليد ملفات PDF محسّنة
 * المميزات:
 * - ورقة A4 قياسية
 * - 12 حقل بورقة واحدة
 * - دعم iOS وجميع الأنظمة الأخرى
 */

const PDFGenerator = {
  // إعدادات A4
  PAGE_WIDTH: 210,      // ملم
  PAGE_HEIGHT: 297,     // ملم
  MARGIN: 10,           // ملم
  FIELDS_PER_PAGE: 12,  // 12 حقل بورقة واحدة
  
  /**
   * الكشف عن نوع النظام
   */
  detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return 'ios';
    if (/android/.test(ua)) return 'android';
    if (/windows/.test(ua)) return 'windows';
    if (/mac/.test(ua)) return 'macos';
    if (/linux/.test(ua)) return 'linux';
    return 'other';
  },

  /**
   * حفظ PDF مع دعم iOS
   */
  async savePDFiOS(data, filename) {
    try {
      const platform = this.detectPlatform();
      console.log('النظام المكتشف:', platform);

      // تقسيم البيانات إلى مجموعات (12 حقل لكل صفحة)
      const pages = this.splitDataByPages(data);
      
      // إنشاء PDF
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        precision: 10,
        lineHeight: 1.2,
        textColor: [0, 0, 0],
        drawColor: [0, 0, 0],
        fillColor: [255, 255, 255]
      });

      // إضافة كل صفحة
      pages.forEach((pageData, pageIndex) => {
        if (pageIndex > 0) {
          doc.addPage('a4', 'p');
        }
        this.drawPage(doc, pageData, pageIndex + 1, pages.length);
      });

      // حفظ الملف
      if (platform === 'ios') {
        return this.savePDFiOSSpecific(doc, filename);
      } else {
        doc.save(filename);
        return { success: true, message: 'تم حفظ الملف بنجاح' };
      }
    } catch (error) {
      console.error('خطأ في حفظ PDF:', error);
      return { success: false, message: error.message };
    }
  },

  /**
   * تقسيم البيانات إلى صفحات (12 حقل لكل صفحة)
   */
  splitDataByPages(data) {
    const pages = [];
    for (let i = 0; i < data.length; i += this.FIELDS_PER_PAGE) {
      pages.push(data.slice(i, i + this.FIELDS_PER_PAGE));
    }
    return pages;
  },

  /**
   * رسم صفحة واحدة
   */
  drawPage(doc, pageData, pageNumber, totalPages) {
    const startY = this.MARGIN + 5;
    let currentY = startY;

    // رأس الصفحة
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(16);
    doc.text('نظام الحضور والغياب', 105, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(11);
    doc.setFont('Cairo', 'normal');
    const today = new Date();
    const dateStr = `التاريخ: ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
    doc.text(dateStr, 105, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(9);
    doc.text(`الصفحة ${pageNumber} من ${totalPages}`, 105, currentY, { align: 'center' });

    currentY += 10;

    // رسم الجدول
    this.drawTable(doc, pageData, currentY);
  },

  /**
   * رسم جدول البيانات
   */
  drawTable(doc, data, startY) {
    const margin = this.MARGIN;
    const pageWidth = this.PAGE_WIDTH;
    const contentWidth = pageWidth - (margin * 2);
    const rowHeight = (this.PAGE_HEIGHT - startY - margin - 10) / (this.FIELDS_PER_PAGE + 2);

    // عناوين الأعمدة
    const columns = ['رقم', 'الموظف', 'الحالة', 'الملاحظات'];
    const colWidths = [15, 45, 40, contentWidth - 100];

    let currentY = startY;

    // رسم رأس الجدول
    doc.setFillColor(196, 30, 58); // أحمر
    doc.setTextColor(255, 255, 255); // أبيض
    doc.setFont('Cairo', 'bold');
    doc.setFontSize(9);

    let currentX = pageWidth - margin;
    columns.forEach((col, idx) => {
      const colWidth = colWidths[idx];
      currentX -= colWidth;
      doc.rect(currentX, currentY, colWidth, rowHeight, 'F');
      doc.text(col, currentX + colWidth / 2, currentY + rowHeight / 2 + 1, {
        align: 'center',
        valign: 'middle'
      });
    });

    currentY += rowHeight;

    // رسم الصفوف
    doc.setTextColor(0, 0, 0);
    doc.setFont('Cairo', 'normal');
    doc.setFontSize(8);

    data.forEach((row, rowIdx) => {
      // لون متناوب
      const bgColor = rowIdx % 2 === 0 ? [255, 255, 255] : [240, 240, 240];
      doc.setFillColor(...bgColor);

      const rowData = [
        (rowIdx + 1).toString(),
        row.name || '',
        row.status || '',
        row.notes || ''
      ];

      let colX = pageWidth - margin;
      colWidths.forEach((colWidth, colIdx) => {
        colX -= colWidth;
        
        // رسم الخلية
        doc.rect(colX, currentY, colWidth, rowHeight, 'F');
        doc.rect(colX, currentY, colWidth, rowHeight); // حدود

        // كتابة النص
        doc.text(
          rowData[colIdx].substring(0, colWidth / 2),
          colX + colWidth / 2,
          currentY + rowHeight / 2 + 1,
          {
            align: 'center',
            valign: 'middle',
            maxWidth: colWidth - 2
          }
        );
      });

      currentY += rowHeight;
    });

    // إضافة صفوف فارغة إذا لم تصل البيانات إلى 12 صف
    const emptyRows = this.FIELDS_PER_PAGE - data.length;
    for (let i = 0; i < emptyRows; i++) {
      const bgColor = (data.length + i) % 2 === 0 ? [255, 255, 255] : [240, 240, 240];
      doc.setFillColor(...bgColor);

      let colX = pageWidth - margin;
      colWidths.forEach((colWidth) => {
        colX -= colWidth;
        doc.rect(colX, currentY, colWidth, rowHeight, 'F');
        doc.rect(colX, currentY, colWidth, rowHeight);
      });

      currentY += rowHeight;
    }

    // خط الهامش السفلي
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, this.PAGE_HEIGHT - margin, pageWidth - margin, this.PAGE_HEIGHT - margin);
  },

  /**
   * حفظ PDF خاص بـ iOS
   */
  async savePDFiOSSpecific(doc, filename) {
    try {
      // الحصول على البيانات كـ Blob
      const pdfBlob = doc.output('blob');
      
      // إنشاء URL
      const url = URL.createObjectURL(pdfBlob);
      
      // إنشاء رابط تحميل
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      return { success: true, message: 'تم حفظ الملف بنجاح على iOS' };
    } catch (error) {
      return { success: false, message: 'خطأ في iOS: ' + error.message };
    }
  },

  /**
   * دالة مساعدة لتحويل النص العربي
   */
  arabicText(text) {
    if (!text) return '';
    return text.replace(/[\u064E-\u0655]/g, '');
  }
};

/**
 * دالة عامة للاستخدام الفوري
 */
async function generateAndSavePDF() {
  try {
    // جهز البيانات من الجدول الحالي
    const data = [];
    const table = document.querySelector('.entry-table tbody');
    
    if (!table) {
      alert('❌ لا توجد بيانات في الجدول');
      return;
    }

    const rows = table.querySelectorAll('tr');
    rows.forEach((row, idx) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        data.push({
          name: cells[0]?.textContent?.trim() || `موظف ${idx + 1}`,
          status: cells[1]?.textContent?.trim() || '-',
          notes: cells[cells.length - 1]?.textContent?.trim() || ''
        });
      }
    });

    if (data.length === 0) {
      alert('❌ لا توجد بيانات للحفظ');
      return;
    }

    // عرض مؤشر التحميل
    const loading = document.querySelector('.loading-overlay');
    if (loading) loading.classList.add('active');

    // إنشاء اسم الملف
    const today = new Date();
    const filename = `تقرير_الحضور_${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.pdf`;

    // حفظ PDF
    const result = await PDFGenerator.savePDFiOS(data, filename);

    // إخفاء مؤشر التحميل
    if (loading) loading.classList.remove('active');

    if (result.success) {
      showToast(`✓ ${result.message}`);
    } else {
      alert(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('خطأ:', error);
    alert('❌ حدث خطأ: ' + error.message);
  }
}

/**
 * دالة عرض رسالة نص
 */
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
