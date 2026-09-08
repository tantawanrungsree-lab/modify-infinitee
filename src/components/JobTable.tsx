import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  User, 
  Layers, 
  Calendar,
  Building2,
  ChevronDown,
  ArrowUpDown,
  FileText,
  Copy,
  Check,
  Paperclip,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { ModifyJob, JobCategory, JobStatus, CATEGORY_CONFIG, DeadlineAlertItem } from '../types';
import { exportJobsToCSV } from '../lib/googleSheetsSync';
import { AttachmentViewerModal } from './AttachmentViewerModal';

interface JobTableProps {
  category: JobCategory;
  jobs: ModifyJob[];
  urgentAlerts: DeadlineAlertItem[];
  onViewJob: (job: ModifyJob) => void;
  onEditJob: (job: ModifyJob) => void;
  onDeleteJob: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onOpenNewJobForCategory: (cat: JobCategory) => void;
  onOpenSheetsSync: () => void;
}

export const JobTable: React.FC<JobTableProps> = ({
  category,
  jobs,
  urgentAlerts,
  onViewJob,
  onEditJob,
  onDeleteJob,
  onStatusChange,
  onOpenNewJobForCategory,
  onOpenSheetsSync,
}) => {
  const config = CATEGORY_CONFIG[category];
  const [tableSearch, setTableSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [technicianFilter, setTechnicianFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof ModifyJob>('seqNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Active attachments viewer state
  const [viewingAttachmentJob, setViewingAttachmentJob] = useState<ModifyJob | null>(null);
  const [initialAttachmentIndex, setInitialAttachmentIndex] = useState<number>(0);

  // Filter jobs for this category
  const categoryJobs = jobs.filter(j => j.category === category);
  const newJobsCount = categoryJobs.filter(j => j.status === 'รอดำเนินการ').length;

  // Available technicians in this category
  const technicians = Array.from(new Set(categoryJobs.map(j => j.technician).filter(Boolean)));

  // Filter logic
  const filteredJobs = categoryJobs.filter(job => {
    const matchesSearch = 
      job.soNo.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.ecrNo.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.projectCode.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.projectName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.customerName.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.salesOwner.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.storeRequester.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.technician.toLowerCase().includes(tableSearch.toLowerCase()) ||
      job.jobDescription.toLowerCase().includes(tableSearch.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const matchesTechnician = technicianFilter === 'all' || job.technician === technicianFilter;

    return matchesSearch && matchesStatus && matchesTechnician;
  });

  // Sort logic
  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const valA = a[sortField] ?? '';
    const valB = b[sortField] ?? '';
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ModifyJob) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to check deadline alert for a job
  const getJobAlert = (jobId: string) => {
    return urgentAlerts.find(a => a.job.id === jobId);
  };

  const openAttachments = (job: ModifyJob, index = 0) => {
    setViewingAttachmentJob(job);
    setInitialAttachmentIndex(index);
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'กำลังดำเนินการ':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'รอตรวจรับ':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'เสร็จสิ้น':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'ยกเลิก':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 p-4 md:p-6 space-y-4">
      {/* Category Header Card */}
      <div className={`p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-850 border ${config.borderColor} shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${config.badgeColor} border`}>
              {config.sheetName}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span className={config.color}>{config.title}</span>
            </h2>
            {newJobsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white border border-rose-400 shadow-lg shadow-rose-600/50 animate-pulse uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                <span>NEW JOB ({newJobsCount} งานใหม่)</span>
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            {config.description} • บันทึกและเชื่อมโยงข้อมูลผ่านระบบ Cloud Firestore แบบ Real-time
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => exportJobsToCSV(categoryJobs, config.title)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs md:text-sm font-medium rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => onOpenNewJobForCategory(category)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <span>+ เพิ่มงาน {config.title}</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาในตารางนี้..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-xs md:text-sm text-slate-100 pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-800">ทั้งหมด ({categoryJobs.length})</option>
              <option value="รอดำเนินการ" className="bg-slate-800">รอดำเนินการ</option>
              <option value="กำลังดำเนินการ" className="bg-slate-800">กำลังดำเนินการ</option>
              <option value="รอตรวจรับ" className="bg-slate-800">รอตรวจรับ</option>
              <option value="เสร็จสิ้น" className="bg-slate-800">เสร็จสิ้น</option>
              <option value="ยกเลิก" className="bg-slate-800">ยกเลิก</option>
            </select>
          </div>

          {/* Technician Filter */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">ช่างที่ทำ:</span>
            <select
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[150px] truncate"
            >
              <option value="all" className="bg-slate-800">ช่างทุกคน</option>
              {technicians.map((tech) => (
                <option key={tech} value={tech} className="bg-slate-800">{tech}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400 px-2">
            แสดง {sortedJobs.length} จาก {categoryJobs.length} งาน
          </div>
        </div>
      </div>

      {/* Main Responsive Industrial Data Table */}
      <div className="flex-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-inner">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-left border-collapse min-w-[1500px]">
            <thead className="bg-slate-850/90 sticky top-0 z-10 border-b border-slate-750 text-[11px] font-bold text-slate-300 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-3 w-14 text-center cursor-pointer hover:bg-slate-800" onClick={() => handleSort('seqNo')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>ลำดับ</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('ecrNo')}>
                  <div className="flex items-center gap-1">
                    <span>ECR No.</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-40 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('salesOwner')}>
                  <span>เซลล์เจ้าของงาน</span>
                </th>
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('storeRequester')}>
                  <span>สโตร์ผู้ร้องขอ</span>
                </th>
                {/* Primary Key 1 */}
                <th className="py-3 px-3 w-32 bg-amber-500/10 border-x border-amber-500/20 text-amber-300 font-extrabold cursor-pointer" onClick={() => handleSort('soNo')}>
                  <div className="flex items-center gap-1">
                    <span>SO No. (PK)</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                {/* Primary Key 2 & 3 */}
                <th className="py-3 px-3 w-48 bg-amber-500/10 border-r border-amber-500/20 text-amber-300 font-extrabold cursor-pointer" onClick={() => handleSort('projectName')}>
                  <div className="flex items-center gap-1">
                    <span>Project Code / Name (PK)</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-44 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('customerName')}>
                  <span>ชื่อลูกค้า</span>
                </th>
                <th className="py-3 px-3 w-28 text-center cursor-pointer hover:bg-slate-800" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>จำนวนชิ้น</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-64 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('jobDescription')}>
                  <div className="flex items-center gap-1">
                    <span>รายละเอียดงาน</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                {/* Image / Attachment Column */}
                <th className="py-3 px-3 w-36 bg-slate-800/80 text-amber-300">
                  <div className="flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-amber-400" />
                    <span>รูปภาพ / ไฟล์ประกอบ</span>
                  </div>
                </th>
                <th className="py-3 px-3 w-28 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('receivedDate')}>
                  <span>วันที่รับงาน</span>
                </th>
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('shipmentDate')}>
                  <div className="flex items-center gap-1">
                    <span>Shipment Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('estimatedDate')}>
                  <span>วันที่ประมาณการ</span>
                </th>
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status งาน</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-44 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('technician')}>
                  <span>ช่างที่ทำ / ผู้รับผิดชอบ</span>
                </th>
                <th className="py-3 px-3 w-28 text-right cursor-pointer hover:bg-slate-800" onClick={() => handleSort('totalCost')}>
                  <span>ค่าใช้จ่าย</span>
                </th>
                <th className="py-3 px-3 w-28 text-center sticky right-0 bg-slate-850 z-20 border-l border-slate-750">
                  <span>จัดการ</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={17} className="py-12 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileText className="w-8 h-8 text-slate-400 mx-auto" />
                      <div className="font-semibold text-slate-300">ไม่พบข้อมูลในตารางนี้</div>
                      <p className="text-[11px] text-slate-400">ยังไม่มีงานในสถานะหรือคำค้นหานี้ กดปุ่ม "เพิ่มงาน" เพื่อเริ่มต้น</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => {
                  const alert = getJobAlert(job.id);
                  const isUrgent = alert?.isUrgent1Day;
                  const isOverdue = alert?.isOverdue;
                  const hasAttachments = job.attachments && job.attachments.length > 0;

                  return (
                    <tr 
                      key={job.id} 
                      className={`hover:bg-slate-800/60 transition group ${
                        isOverdue ? 'bg-rose-950/20' : isUrgent ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* ลำดับที่ */}
                      <td className="py-3 px-3 text-center font-mono font-medium text-slate-400">
                        {job.seqNo}
                      </td>

                      {/* ECR No. */}
                      <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                        {job.ecrNo ? (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[11px]">
                            {job.ecrNo}
                          </span>
                        ) : '-'}
                      </td>

                      {/* เซลล์เจ้าของงาน */}
                      <td className="py-3 px-3 text-slate-300 font-medium">
                        {job.salesOwner || '-'}
                      </td>

                      {/* สโตร์ผู้ร้องขอ */}
                      <td className="py-3 px-3 text-slate-400">
                        {job.storeRequester || '-'}
                      </td>

                      {/* SO No. (PK) */}
                      <td className="py-3 px-3 font-mono font-bold text-amber-300 bg-amber-500/5 border-x border-amber-500/20">
                        <div className="flex items-center justify-between gap-1">
                          <span>{job.soNo}</span>
                          <button
                            onClick={() => copyToClipboard(job.soNo, `so-${job.id}`)}
                            title="คัดลอก SO No."
                            className="opacity-0 group-hover:opacity-100 text-amber-400/80 hover:text-amber-300 p-0.5 rounded cursor-pointer"
                          >
                            {copiedKey === `so-${job.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Project Code & Name (PK) */}
                      <td className="py-3 px-3 bg-amber-500/5 border-r border-amber-500/20">
                        <div className="space-y-0.5">
                          <div className="font-mono text-[10px] text-amber-400/90 font-bold">
                            {job.projectCode}
                          </div>
                          <div className="font-semibold text-slate-200 line-clamp-1" title={job.projectName}>
                            {job.projectName}
                          </div>
                        </div>
                      </td>

                      {/* ชื่อลูกค้า */}
                      <td className="py-3 px-3 text-slate-300">
                        <div className="line-clamp-2" title={job.customerName}>
                          {job.customerName}
                        </div>
                      </td>

                      {/* จำนวนชิ้น (Qty) */}
                      <td className="py-3 px-3 text-center">
                        {job.quantity ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            {job.quantity.toLocaleString()} ชิ้น
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* รายละเอียดงาน */}
                      <td className="py-3 px-3 text-slate-300">
                        <div className="line-clamp-2 text-slate-300 text-[11px] leading-relaxed font-sans" title={job.jobDescription}>
                          {job.jobDescription}
                        </div>
                      </td>

                      {/* รูปภาพหรือไฟล์ประกอบ (New Attachment Column) */}
                      <td className="py-3 px-3 bg-slate-950/40">
                        {hasAttachments ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => openAttachments(job, 0)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition flex items-center gap-1.5 shadow-sm group/btn"
                              title="คลิกเพื่อดูและดาวน์โหลดรูปภาพ/ไฟล์ประกอบ"
                            >
                              <Paperclip className="w-3 h-3 text-amber-400 group-hover/btn:rotate-12 transition-transform" />
                              <span>{job.attachments!.length} ไฟล์</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </button>
                            {/* Tiny preview thumbnail of 1st file if image */}
                            {job.attachments![0].type === 'image' && (
                              <button
                                onClick={() => openAttachments(job, 0)}
                                className="w-6 h-6 rounded border border-slate-700 overflow-hidden shrink-0 hover:scale-110 transition"
                                title={job.attachments![0].name}
                              >
                                <img src={job.attachments![0].dataUrl} alt="Thumb" className="w-full h-full object-cover" />
                              </button>
                            )}
                          </div>
                        ) : job.status === 'เสร็จสิ้น' ? (
                          <span className="text-[10px] text-slate-400 italic flex items-center gap-1" title="ลบไฟล์แล้วเมื่อสถานะเสร็จสิ้น">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                            <span>ลบไฟล์แล้ว</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* วันที่รับงาน */}
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {job.receivedDate}
                      </td>

                      {/* Shipment Date + 1-Day Alert */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-mono font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{job.shipmentDate}</span>
                          </div>

                          {/* 1-Day Advance Warning Badge */}
                          {isOverdue && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              <AlertTriangle className="w-2.5 h-2.5 text-rose-400" />
                              เลยกำหนด ({Math.abs(alert.daysRemaining)} วัน)
                            </span>
                          )}
                          {!isOverdue && isUrgent && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              <Clock className="w-2.5 h-2.5 text-amber-400" />
                              ⚠️ ครบกำหนดใน 1 วัน!
                            </span>
                          )}
                        </div>
                      </td>

                      {/* วันที่ประมาณการ */}
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {job.estimatedDate || '-'}
                      </td>

                      {/* Status งาน */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <select
                            value={job.status}
                            onChange={(e) => onStatusChange(job.id, e.target.value as JobStatus)}
                            className={`w-full py-1 px-2 rounded-lg text-xs font-semibold border cursor-pointer focus:outline-none transition ${getStatusBadge(job.status)}`}
                          >
                            <option value="รอดำเนินการ" className="bg-slate-900 text-amber-300">รอดำเนินการ</option>
                            <option value="กำลังดำเนินการ" className="bg-slate-900 text-cyan-300">กำลังดำเนินการ</option>
                            <option value="รอตรวจรับ" className="bg-slate-900 text-purple-300">รอตรวจรับ</option>
                            <option value="เสร็จสิ้น" className="bg-slate-900 text-emerald-300">เสร็จสิ้น</option>
                            <option value="ยกเลิก" className="bg-slate-900 text-rose-300">ยกเลิก</option>
                          </select>
                          {job.status === 'รอดำเนินการ' && (
                            <div className="flex items-center justify-center">
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white border border-rose-400 shadow-md shadow-rose-600/40 animate-pulse tracking-wide">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                                NEW JOB
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* ช่างที่ทำ / ช่างผู้รับผิดชอบ */}
                      <td className="py-3 px-3 font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-cyan-400/80"></div>
                          <span className="line-clamp-1" title={job.technician}>{job.technician || 'ยังไม่มอบหมาย'}</span>
                        </div>
                      </td>

                      {/* ค่าใช้จ่าย */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-xs">
                        ฿{(job.totalCost || 0).toLocaleString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sticky right-0 bg-slate-900 group-hover:bg-slate-800 transition z-10 border-l border-slate-800">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewJob(job)}
                            title="ดูรายละเอียดฉบับเต็ม"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditJob(job)}
                            title="แก้ไขข้อมูลงาน"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            title="ลบรายการ"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary Bar */}
        <div className="p-3 bg-slate-850/90 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>รวมทั้งหมด: <strong className="text-white">{sortedJobs.length}</strong> รายการ</span>
            <span>•</span>
            <span>ค่าใช้จ่ายหมวดนี้รวม: <strong className="text-amber-400 font-mono">฿{categoryJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0).toLocaleString()}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> แจ้งเตือน 1 วัน</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> เลยกำหนด</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> ส่งมอบแล้ว</span>
          </div>
        </div>
      </div>

      {/* Attachment Viewer Modal */}
      {viewingAttachmentJob && viewingAttachmentJob.attachments && viewingAttachmentJob.attachments.length > 0 && (
        <AttachmentViewerModal
          isOpen={!!viewingAttachmentJob}
          onClose={() => setViewingAttachmentJob(null)}
          attachments={viewingAttachmentJob.attachments}
          jobTitle={`${viewingAttachmentJob.soNo} — ${viewingAttachmentJob.projectName}`}
          initialIndex={initialAttachmentIndex}
        />
      )}
    </div>
  );
};
