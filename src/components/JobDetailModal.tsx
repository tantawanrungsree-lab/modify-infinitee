import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Share2, 
  Calendar, 
  User, 
  Clock, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  FileSpreadsheet, 
  Layers, 
  DollarSign, 
  Building2,
  KeyRound,
  FileText,
  Paperclip,
  Image as ImageIcon,
  ExternalLink,
  Download
} from 'lucide-react';
import { ModifyJob, CATEGORY_CONFIG, JobStatus, DeadlineAlertItem } from '../types';
import { AttachmentViewerModal } from './AttachmentViewerModal';

interface JobDetailModalProps {
  job: ModifyJob | null;
  onClose: () => void;
  onEdit: (job: ModifyJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  alert?: DeadlineAlertItem;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  onEdit,
  onStatusChange,
  alert
}) => {
  const [selectedAttachmentIdx, setSelectedAttachmentIdx] = useState<number | null>(null);

  if (!job) return null;

  const config = CATEGORY_CONFIG[job.category];
  const isUrgent = alert?.isUrgent1Day;
  const isOverdue = alert?.isOverdue;

  const handlePrint = () => {
    try {
      window.print();
    } catch (err) {
      console.warn('Print not supported in this frame context:', err);
    }
  };

  const copyJobDetails = () => {
    const text = `
[BRZ LUMENCRAFT - JOB TRAVELER]
ประเภทงาน: ${config.title} (${config.sheetName})
ลำดับที่: ${job.seqNo} | ECR No: ${job.ecrNo || '-'}
SO No: ${job.soNo} (PK)
Project Code: ${job.projectCode} | Project Name: ${job.projectName}
ลูกค้า: ${job.customerName}
เซลล์: ${job.salesOwner || '-'} | สโตร์: ${job.storeRequester || '-'}
ช่างผู้รับผิดชอบ: ${job.technician}
วันที่รับงาน: ${job.receivedDate} | Shipment Date: ${job.shipmentDate} | วันที่ประมาณการ: ${job.estimatedDate || '-'}
สถานะ: ${job.status}
รายละเอียดงาน: ${job.jobDescription}
ค่าใช้จ่ายรวม: ฿${(job.totalCost || 0).toLocaleString()}
หมายเหตุ: ${job.notes || '-'}
    `.trim();
    navigator.clipboard.writeText(text);
    alertModalNotification('คัดลอกข้อมูลใบสั่งงานแล้ว');
  };

  const alertModalNotification = (msg: string) => {
    // gentle notification
    const div = document.createElement('div');
    div.innerText = msg;
    div.className = 'fixed bottom-4 right-4 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-xl z-50 animate-bounce';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header Bar */}
        <div className={`p-4 md:p-5 border-b border-slate-750 flex items-center justify-between ${config.bgLight}`}>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${config.badgeColor}`}>
              {config.title}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-mono">{job.soNo}</h3>
                <span className="text-xs text-slate-400">• ลำดับที่ #{job.seqNo}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                {job.projectCode} — {job.projectName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={copyJobDetails}
              title="คัดลอกข้อความใบงาน"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              title="พิมพ์ใบงาน (Print Traveler)"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 text-sm text-slate-200">
          {/* Urgent 1-Day Alert Banner if applicable */}
          {(isUrgent || isOverdue) && (
            <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
              isOverdue ? 'bg-rose-500/15 border-rose-500/40 text-rose-200' : 'bg-amber-500/15 border-amber-500/40 text-amber-200'
            }`}>
              <AlertTriangle className={`w-5 h-5 shrink-0 ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
              <div className="text-xs">
                <strong>{isOverdue ? '⚠️ งานนี้เลยกำหนดส่งมอบแล้ว!' : '⚠️ แจ้งเตือน: เหลือเวลาอีก 1 วันก่อนถึงกำหนด Shipment Date'}</strong>
                <div>กำหนดส่ง: {job.shipmentDate} (วันที่ประมาณการ: {job.estimatedDate || '-'})</div>
              </div>
            </div>
          )}

          {/* Primary Keys Card */}
          <div className="p-4 rounded-xl bg-slate-850 border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Primary Key Identification</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
              <div>
                <span className="text-[11px] text-slate-400 block">SO No.</span>
                <span className="text-base font-bold text-amber-300">{job.soNo}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Project Code</span>
                <span className="text-sm font-bold text-slate-200">{job.projectCode}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block">Project Name</span>
                <span className="text-sm font-bold text-white line-clamp-1">{job.projectName}</span>
              </div>
            </div>
          </div>

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-850 border border-slate-750 text-xs">
            <div>
              <span className="text-slate-400 block">ECR No.</span>
              <span className="font-mono font-semibold text-slate-200">{job.ecrNo || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">เซลล์เจ้าของงาน</span>
              <span className="font-semibold text-slate-200">{job.salesOwner || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">สโตร์ผู้ร้องขอ</span>
              <span className="font-semibold text-slate-200">{job.storeRequester || '-'}</span>
            </div>
            <div>
              <span className="text-slate-400 block">ช่างผู้รับผิดชอบ</span>
              <span className="font-semibold text-cyan-300">{job.technician || '-'}</span>
            </div>
          </div>

          {/* Customer & Description */}
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-400 block">ชื่อลูกค้า / บริษัทผู้สั่งซื้อ</span>
              <div className="text-base font-bold text-white mt-0.5">{job.customerName}</div>
            </div>

            <div>
              <span className="text-xs text-slate-400 block">รายละเอียดงาน Modify</span>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 text-sm leading-relaxed mt-1 whitespace-pre-line font-mono">
                {job.jobDescription}
              </div>
            </div>
          </div>

          {/* Timeline & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-slate-850 border border-slate-750 text-xs font-mono">
            <div>
              <span className="text-slate-400 block">วันที่รับงาน</span>
              <span className="text-sm text-slate-200 font-semibold">{job.receivedDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Shipment Date</span>
              <span className="text-sm text-amber-400 font-bold">{job.shipmentDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block">วันที่ประมาณการ</span>
              <span className="text-sm text-slate-200 font-semibold">{job.estimatedDate || '-'}</span>
            </div>
          </div>

          {/* Financials Breakdown */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                สรุปค่าใช้จ่ายงานนี้
              </span>
              <div className="text-xs text-slate-400">
                ค่าแรง: ฿{(job.laborCost || 0).toLocaleString()} • ค่าวัสดุ: ฿{(job.materialCost || 0).toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">ยอดรวมทั้งสิ้น</div>
              <div className="text-xl font-mono font-bold text-amber-400">
                ฿{(job.totalCost || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                รูปภาพและไฟล์ประกอบ ({job.attachments?.length || 0})
              </span>
              {job.status === 'เสร็จสิ้น' && (
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  ไฟล์ถูกลบอัตโนมัติเนื่องจากสถานะเป็น "เสร็จสิ้น"
                </span>
              )}
            </div>

            {job.attachments && job.attachments.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {job.attachments.map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="relative group bg-slate-850 border border-slate-750 hover:border-amber-500/50 rounded-xl p-2 transition flex flex-col justify-between"
                  >
                    {att.type === 'image' ? (
                      <div 
                        onClick={() => setSelectedAttachmentIdx(idx)}
                        className="w-full h-24 rounded-lg bg-slate-900 overflow-hidden cursor-pointer flex items-center justify-center mb-1.5 border border-slate-750"
                      >
                        <img 
                          src={att.dataUrl} 
                          alt={att.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                    ) : (
                      <div 
                        onClick={() => setSelectedAttachmentIdx(idx)}
                        className="w-full h-24 rounded-lg bg-rose-950/30 border border-rose-500/30 flex flex-col items-center justify-center cursor-pointer mb-1.5 group-hover:bg-rose-950/50 transition"
                      >
                        <FileText className="w-8 h-8 text-rose-400 mb-1" />
                        <span className="text-[10px] font-bold text-rose-300 uppercase">PDF Document</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="text-[11px] font-medium text-slate-200 line-clamp-1" title={att.name}>
                        {att.name}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{((att.size || 0) / 1024).toFixed(0)} KB</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedAttachmentIdx(idx)}
                            className="p-1 hover:text-amber-400 transition"
                            title="ดูแบบเต็มจอ"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </button>
                          <a
                            href={att.dataUrl}
                            download={att.name}
                            className="p-1 hover:text-emerald-400 transition"
                            title="ดาวน์โหลด"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-850/60 border border-slate-800 text-center text-xs text-slate-400">
                {job.status === 'เสร็จสิ้น' 
                  ? 'ไม่มีไฟล์แนบ (ไฟล์ถูกลบอัตโนมัติตามนโยบายเมื่อปิดงานเสร็จสิ้น)'
                  : 'ไม่มีรูปภาพหรือไฟล์ประกอบในใบสั่งงานนี้'}
              </div>
            )}
          </div>

          {/* Creator and Firestore Sync Information */}
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>ผู้บันทึกข้อมูล:</span>
              <strong className="text-slate-200">
                {job.createdByEmail || job.createdByName || 'ระบบส่วนกลาง BRZ'}
              </strong>
            </div>
            <div className="text-[11px] font-mono text-slate-400">
              อัปเดตล่าสุด: {new Date(job.updatedAt || job.createdAt).toLocaleString('th-TH')}
            </div>
          </div>

          {/* Notes */}
          {job.notes && (
            <div>
              <span className="text-xs text-slate-400 block">หมายเหตุเพิ่มเติม</span>
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 mt-1">
                {job.notes}
              </div>
            </div>
          )}

          {/* Status Quick Control */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800 border border-slate-700">
            <span className="text-xs font-semibold text-slate-300">เปลี่ยนสถานะงาน:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['รอดำเนินการ', 'กำลังดำเนินการ', 'รอตรวจรับ', 'เสร็จสิ้น', 'ยกเลิก'] as JobStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStatusChange(job.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    job.status === st
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-750 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            ปลายทาง Sheet: <strong className="text-slate-200">{config.sheetName}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(job);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold border border-amber-500/40 transition"
            >
              แก้ไขข้อมูล
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>

      {/* Attachment Fullscreen Viewer */}
      {selectedAttachmentIdx !== null && job.attachments && job.attachments[selectedAttachmentIdx] && (
        <AttachmentViewerModal
          isOpen={selectedAttachmentIdx !== null}
          onClose={() => setSelectedAttachmentIdx(null)}
          attachments={job.attachments}
          jobTitle={`${job.soNo} — ${job.projectName}`}
          initialIndex={selectedAttachmentIdx}
        />
      )}
    </div>
  );
};
