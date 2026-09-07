import { ModifyJob, JobAttachment } from '../types';

// Helper to generate clean SVG data URLs for sample lighting diagrams and drawings
const createSampleSvg = (title: string, subtitle: string, bgColor: string, accentColor: string): string => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <rect width="600" height="400" fill="${bgColor}"/>
    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="${accentColor}" stroke-width="2" stroke-dasharray="6,6"/>
    <circle cx="300" cy="160" r="60" fill="${accentColor}" fill-opacity="0.2" stroke="${accentColor}" stroke-width="3"/>
    <path d="M 260 160 L 340 160 M 300 120 L 300 200" stroke="${accentColor}" stroke-width="3" stroke-linecap="round"/>
    <text x="300" y="260" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${title}</text>
    <text x="300" y="295" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">${subtitle}</text>
    <text x="300" y="340" font-family="monospace" font-size="11" fill="${accentColor}" text-anchor="middle">BRZ LUMENCRAFT ENGINEERING SPEC</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const SAMPLE_DIAGRAM_MOD1 = createSampleSvg('Linear Profile Modification 2150mm', 'ECR-2026-089 Drawing & Diffuser Spec', '#0f172a', '#f59e0b');
const SAMPLE_DIAGRAM_MOD2 = createSampleSvg('Magnetic 48V Track Flush Mount', 'ECR-2026-094 Ceiling Mount Detail', '#0f172a', '#38bdf8');
const SAMPLE_DIAGRAM_PAINT = createSampleSvg('RAL 1036 Satin Brass Gold', 'ECR-2026-077 Powder Coating Standard', '#1e1b4b', '#fbbf24');
const SAMPLE_DIAGRAM_FAB = createSampleSvg('Curved Neon Flex R=850mm + Casambi', 'ECR-2026-061 Electronic Schematic', '#064e3b', '#34d399');

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

// Empty initial jobs array - All sample data removed as requested
export const INITIAL_SAMPLE_JOBS: ModifyJob[] = [];

export const TECHNICIANS_LIST = [
  'ช่างปรีชา (ช่างเทคนิคอาวุโส)',
  'ช่างเอกชัย (หัวหน้าแผนกพ่นสี)',
  'ช่างมานพ (ช่างพ่นสีชำนาญการ)',
  'ช่างธีรภัทร (ช่างประดิษฐ์/อิเล็กทรอนิกส์)',
  'ช่างธนพล (ช่างประกอบระบบไฟ)',
  'ช่างวิศรุต (ช่างกลโรงงานและ CNC)'
];

export const SALES_OWNERS_LIST = [
  'คุณกิตติศักดิ์ (Project Sales)',
  'คุณพรทิพย์ (Key Account)',
  'คุณวรวิทย์ (Architectural Sales)',
  'คุณอนุชา (R&D & Custom Solutions)',
  'คุณนภัสสร (Commercial Lighting)'
];

export const STORE_REQUESTERS_LIST = [
  'สโตร์หลัก คลัง A',
  'สโตร์รับเข้า B1',
  'สโตร์รับเข้า B2',
  'สโตร์พ่นสีและเคมี',
  'สโตร์ชิ้นส่วนพิเศษ C',
  'สโตร์สต็อกกลาง'
];
