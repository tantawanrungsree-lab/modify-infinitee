import { ModifyJob, JobCategory, CATEGORY_CONFIG } from '../types';

export const SHEET_COLUMNS = [
  'ลำดับที่',
  'ECR No.',
  'เซลล์เจ้าของงาน',
  'สโตร์ผู้ร้องขอ',
  'SO No. (PK)',
  'Project Code (PK)',
  'Project Name (PK)',
  'ชื่อลูกค้า',
  'จำนวนชิ้น (Qty)',
  'รายละเอียดงาน',
  'วันที่รับงาน',
  'Shipment Date',
  'วันที่ประมาณการ',
  'วันที่เสร็จสิ้น',
  'จำนวนวันที่ใช้ (วัน)',
  'Status งาน',
  'ช่างที่ทำ / ผู้รับผิดชอบ',
  'ค่าแรง (THB)',
  'ค่าวัสดุ (THB)',
  'ค่าใช้จ่ายรวม (THB)',
  'หมายเหตุ',
  'อัปเดตล่าสุด'
];

export function jobToRowArray(job: ModifyJob): (string | number)[] {
  let daysUsed: string | number = '-';
  if (job.receivedDate) {
    const comp = job.completedDate || (job.status === 'เสร็จสิ้น' ? job.updatedAt : undefined);
    if (comp) {
      const recStr = job.receivedDate.split(' ')[0].split('T')[0];
      const compStr = comp.split(' ')[0].split('T')[0];
      const dRec = new Date(recStr);
      const dComp = new Date(compStr);
      if (!isNaN(dRec.getTime()) && !isNaN(dComp.getTime())) {
        daysUsed = Math.max(0, Math.round((dComp.getTime() - dRec.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }
  }

  return [
    job.seqNo,
    job.ecrNo || '-',
    job.salesOwner || '-',
    job.storeRequester || '-',
    job.soNo,
    job.projectCode,
    job.projectName,
    job.customerName,
    job.quantity !== undefined ? job.quantity : '-',
    job.jobDescription.replace(/\n/g, ' '),
    job.receivedDate,
    job.shipmentDate,
    job.estimatedDate || '-',
    job.completedDate || (job.status === 'เสร็จสิ้น' ? 'เสร็จสิ้น' : '-'),
    daysUsed,
    job.status,
    job.technician || '-',
    job.laborCost || 0,
    job.materialCost || 0,
    job.totalCost || 0,
    job.notes ? job.notes.replace(/\n/g, ' ') : '-',
    new Date(job.updatedAt).toLocaleString('th-TH')
  ];
}

export function exportJobsToCSV(jobs: ModifyJob[], sheetTitle: string): void {
  const rows = [
    SHEET_COLUMNS,
    ...jobs.map(jobToRowArray)
  ];

  const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `BRZ_LUMENCRAFT_${sheetTitle}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generateGoogleSheetsPayload(jobs: ModifyJob[]) {
  const modifyGeneral = jobs.filter(j => j.category === 'modify_general');
  const paint = jobs.filter(j => j.category === 'paint');
  const customFab = jobs.filter(j => j.category === 'custom_fabrication');

  return {
    projectName: "Modify Process BRZ LUMENCRAFT",
    firebaseProject: "Modify infinite",
    generatedAt: new Date().toISOString(),
    totalJobsCount: jobs.length,
    sheets: {
      "งาน Modify ทั่วไป": {
        headers: SHEET_COLUMNS,
        rows: modifyGeneral.map(jobToRowArray),
        count: modifyGeneral.length
      },
      "งานพ่นสี": {
        headers: SHEET_COLUMNS,
        rows: paint.map(jobToRowArray),
        count: paint.length
      },
      "งานประยุกต์ประดิษฐ์": {
        headers: SHEET_COLUMNS,
        rows: customFab.map(jobToRowArray),
        count: customFab.length
      },
      "สรุปค่าใช้จ่าย": {
        headers: SHEET_COLUMNS,
        rows: jobs.map(jobToRowArray),
        totalCost: jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0),
        count: jobs.length
      }
    }
  };
}
