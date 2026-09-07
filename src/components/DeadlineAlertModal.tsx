import React from 'react';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Building2,
  Wrench,
  Paintbrush,
  Cpu
} from 'lucide-react';
import { DeadlineAlertItem, ModifyJob, CATEGORY_CONFIG, JobStatus } from '../types';

interface DeadlineAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DeadlineAlertItem[];
  onViewJob: (job: ModifyJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
}

export const DeadlineAlertModal: React.FC<DeadlineAlertModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onViewJob,
  onStatusChange
}) => {
  if (!isOpen) return null;

  const overdueList = alerts.filter(a => a.isOverdue);
  const urgent1DayList = alerts.filter(a => !a.isOverdue && a.isUrgent1Day);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-rose-950/40 via-amber-950/30 to-slate-900 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>ศูนย์แจ้งเตือนก่อนถึงกำหนด 1 วัน</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                  {alerts.length} รายการ
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ระบบคำนวณจาก Shipment Date และ วันที่ประมาณการของทั้ง 3 กระบวนการ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5">
          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <div className="font-bold text-slate-200 text-base">ยอดเยี่ยม! ไม่มีงานที่ใกล้ครบกำหนดใน 1 วัน</div>
              <p className="text-xs text-slate-400">ทุกกระบวนการ Modify ของ BRZ LUMENCRAFT ดำเนินการตามกำหนดเวลา</p>
            </div>
          ) : (
            <>
              {/* Overdue Section */}
              {overdueList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>รายการที่เลยกำหนดส่งมอบ ({overdueList.length} งาน)</span>
                  </div>

                  <div className="space-y-2">
                    {overdueList.map(({ job, daysRemaining }) => (
                      <div 
                        key={job.id} 
                        className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white">
                              เลยกำหนด {Math.abs(daysRemaining)} วัน
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-300">{job.soNo}</span>
                            <span className="text-xs font-semibold text-slate-200">• {job.projectName}</span>
                          </div>
                          <div className="text-xs text-slate-300 line-clamp-1">{job.jobDescription}</div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Shipment: <strong className="text-rose-300">{job.shipmentDate}</strong></span>
                            <span>ช่าง: <strong className="text-slate-200">{job.technician}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewJob(job);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          >
                            ดูรายละเอียด
                          </button>
                          <button
                            onClick={() => onStatusChange(job.id, 'เสร็จสิ้น')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/40 transition"
                          >
                            ทำเสร็จแล้ว
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Due in 1 Day Section */}
              {urgent1DayList.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>รายการที่ครบกำหนดใน 1 วัน ({urgent1DayList.length} งาน)</span>
                  </div>

                  <div className="space-y-2">
                    {urgent1DayList.map(({ job }) => (
                      <div 
                        key={job.id} 
                        className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                              ครบกำหนดใน 1 วัน (พรุ่งนี้)
                            </span>
                            <span className="font-mono text-xs font-bold text-amber-300">{job.soNo}</span>
                            <span className="text-xs font-semibold text-slate-200">• {job.projectName}</span>
                          </div>
                          <div className="text-xs text-slate-300 line-clamp-1">{job.jobDescription}</div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                            <span>Shipment Date: <strong className="text-amber-300">{job.shipmentDate}</strong></span>
                            <span>ช่างผู้รับผิดชอบ: <strong className="text-cyan-300">{job.technician}</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => {
                              onClose();
                              onViewJob(job);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                          >
                            ดูรายละเอียด
                          </button>
                          <button
                            onClick={() => onStatusChange(job.id, 'รอตรวจรับ')}
                            className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/40 transition"
                          >
                            ส่งตรวจรับ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-750 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
