export type JobCategory = 'modify_general' | 'paint' | 'custom_fabrication';

export type ActiveView = 'job_queue' | 'modify_general' | 'paint' | 'custom_fabrication' | 'cost_summary' | 'calendar';

export type JobStatus = 'รอดำเนินการ' | 'กำลังดำเนินการ' | 'รอตรวจรับ' | 'เสร็จสิ้น' | 'ยกเลิก';

export interface JobAttachment {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'pdf';
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface ModifyJob {
  id: string;
  seqNo: number;                   // ลำดับที่
  ecrNo: string;                   // ECR No.
  salesOwner: string;              // เซลล์เจ้าของงาน
  storeRequester: string;          // สโตร์ผู้ร้องขอ
  soNo: string;                    // SO No. (Primary Key 1)
  projectCode: string;             // Project Code (Primary Key 2)
  projectName: string;             // Project Name (Primary Key 3)
  customerName: string;            // ชื่อลูกค้า
  quantity?: number;               // จำนวนสินค้า / ชิ้นงาน (ชิ้น)
  jobDescription: string;          // รายละเอียดงาน
  receivedDate: string;            // วันที่รับงาน (YYYY-MM-DD)
  shipmentDate: string;            // Shipment Date (YYYY-MM-DD)
  estimatedDate: string;           // วันที่ประมาณการ (YYYY-MM-DD)
  status: JobStatus;               // Status งาน
  completedDate?: string;          // วันที่และเวลาเสร็จสิ้น (YYYY-MM-DD HH:mm) บันทึกอัตโนมัติเมื่อสถานะเสร็จสิ้น
  technician: string;              // ช่างที่ทำ / ช่างผู้รับผิดชอบ
  category: JobCategory;           // ประเภทงาน (ตัวบ่งชี้ว่าไปเก็บ Sheet ไหน)
  laborCost?: number;              // ค่าแรง
  materialCost?: number;           // ค่าวัสดุ / อะไหล่
  totalCost?: number;              // ค่าใช้จ่ายรวม
  notes?: string;                  // หมายเหตุเพิ่มเติม
  attachments?: JobAttachment[];   // รูปภาพหรือไฟล์ประกอบ (PDF / รูปภาพ) ลบอัตโนมัติเมื่อ Finish
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role?: string;
  department?: string;
}

export interface CategoryMeta {
  id: JobCategory;
  title: string;
  sheetName: string;
  description: string;
  color: string;
  bgLight: string;
  borderColor: string;
  badgeColor: string;
}

export const CATEGORY_CONFIG: Record<JobCategory, CategoryMeta> = {
  modify_general: {
    id: 'modify_general',
    title: 'งาน Modify ทั่วไป',
    sheetName: 'Sheet_Modify_General',
    description: 'งานปรับแต่งขนาด โครงสร้าง ดัดแปลงชิ้นส่วนโคมไฟและรางไฟ BRZ',
    color: 'text-amber-400',
    bgLight: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  paint: {
    id: 'paint',
    title: 'งานพ่นสี',
    sheetName: 'Sheet_Paint_Process',
    description: 'งานพ่นสีพาวเดอร์โค้ท สีอบ สีพิเศษตามสเปกสถาปนิกและลูกค้า',
    color: 'text-cyan-400',
    bgLight: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  custom_fabrication: {
    id: 'custom_fabrication',
    title: 'งานประยุกต์ประดิษฐ์',
    sheetName: 'Sheet_Custom_Fabrication',
    description: 'งานขึ้นรูปพิเศษ วงจรสั่งทำ งาน Custom Bracket & Architectural Luminaire',
    color: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
};

export interface DeadlineAlertItem {
  job: ModifyJob;
  daysRemaining: number;
  isOverdue: boolean;
  isUrgent1Day: boolean;
  targetDate: string;
  targetType: 'shipment' | 'estimated';
}
