async function testPOST() {
  console.log('Sending POST to Vercel API...');
  const payload = {
    unitName: 'وحدة اختبارية',
    startDate: '2026-06-20',
    endDate: '2026-06-26',
    weeks: JSON.stringify({
      "1": {
        weekNumber: 1,
        startDate: '2026-06-20',
        endDate: '2026-06-26',
        employees: [
          { id: 1, name: 'موظف تجريبي', days: ['present', 'present', 'present', 'present', 'present', 'rest', 'rest'], shift: 'morning' }
        ],
        notes: 'ملاحظة تجريبية'
      }
    }),
    notes: 'ملاحظات عامة'
  };

  const formData = new FormData();
  formData.append('unitName', payload.unitName);
  formData.append('startDate', payload.startDate);
  formData.append('endDate', payload.endDate);
  formData.append('weeks', payload.weeks);
  formData.append('notes', payload.notes);

  try {
    const response = await fetch('https://hdor-in.vercel.app/api/submissions', {
      method: 'POST',
      body: formData
    });
    const status = response.status;
    const text = await response.text();
    console.log(`Status: ${status}`);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testPOST();
