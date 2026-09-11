import React, { useState, useMemo } from 'react';
import { 
  ListOrdered,
  Layers,
  Search, 
  Filter, 
  ArrowUpDown, 
  PlusCircle, 
  FileSpreadsheet, 
  ExternalLink, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  User, 
  Eye, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  FileText,
  Paperclip,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Wrench,
  Paintbrush,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  ModifyJob, 
  JobCategory, 
  JobStatus, 
  CATEGORY_CONFIG, 
  DeadlineAlertItem,
  JobAttachment 
} from '../types';
import { exportJobsToCSV } from '../lib/googleSheetsSync';

interface JobQueueViewProps {
  jobs: ModifyJob[];
  urgentAlerts: DeadlineAlertItem[];
  onViewJob: (job: ModifyJob) => void;
  onEditJob: (job: ModifyJob) => void;
  onDeleteJob: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onOpenNewJob: () => void;
  onOpenSheetsSync: () => void;
}

type QueueSortField = 'queue' | 'receivedDate' | 'shipmentDate' | 'soNo' | 'projectCode' | 'customerName' | 'status' | 'category' | 'daysUsed';

export const JobQueueView: React.FC<JobQueueViewProps> = ({
  jobs,
  urgentAlerts,
  onViewJob,
  onEditJob,
  onDeleteJob,
  onStatusChange,
  onOpenNewJob,
  onOpenSheetsSync
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // all active queue items
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [sortField, setSortField] = useState<QueueSortField>('queue');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Attachment Viewer modal state
  const [viewingAttachmentJob, setViewingAttachmentJob] = useState<ModifyJob | null>(null);
  const [initialAttachmentIndex, setInitialAttachmentIndex] = useState<number>(0);

  // Calculate days used
  const getDaysUsed = (job: ModifyJob): number | null => {
    if (!job.receivedDate) return null;
    const completed = job.completedDate || (job.status === 'เสร็จสิ้น' ? job.updatedAt : undefined);
    if (!completed) return null;
    
    const recStr = job.receivedDate.split(' ')[0].split('T')[0];
    const compStr = completed.split(' ')[0].split('T')[0];
    const dRec = new Date(recStr);
    const dComp = new Date(compStr);
    if (isNaN(dRec.getTime()) || isNaN(dComp.getTime())) return null;
    
    const diffDays = Math.round((dComp.getTime() - dRec.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Only active jobs (non-completed and non-canceled) are part of the Job Queue
  const activeJobs = useMemo(() => {
    return jobs.filter((j) => j.status !== 'เสร็จสิ้น' && j.status !== 'ยกเลิก');
  }, [jobs]);

  // Base master queue: sorted chronologically by received date & time (FIFO)
  const masterQueue = useMemo(() => {
    return [...activeJobs].sort((a, b) => {
      // 1. Primary order: receivedDate ascending (earliest received comes first in queue)
      const dateA = a.receivedDate || '';
      const dateB = b.receivedDate || '';
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      // 2. Secondary order: createdAt timestamp
      const createdA = a.createdAt || '';
      const createdB = b.createdAt || '';
      if (createdA !== createdB) {
        return createdA.localeCompare(createdB);
      }
      // 3. Fallback: seqNo
      return (a.seqNo || 0) - (b.seqNo || 0);
    });
  }, [activeJobs]);

  // Create map of Job ID -> Master Queue Rank # (Only active jobs get ranked: 1, 2, 3...)
  const queueRankMap = useMemo(() => {
    const map = new Map<string, number>();
    masterQueue.forEach((job, index) => {
      map.set(job.id, index + 1);
    });
    return map;
  }, [masterQueue]);

  // Unique technicians across active jobs
  const technicians = useMemo(() => {
    const set = new Set<string>();
    activeJobs.forEach((j) => {
      if (j.technician && j.technician.trim()) {
        set.add(j.technician.trim());
      }
    });
    return Array.from(set).sort();
  }, [activeJobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return masterQueue.filter((job) => {
      // Category filter
      if (selectedCategory !== 'all' && job.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'all' && job.status !== selectedStatus) {
        return false;
      }

      // Technician filter
      if (selectedTechnician !== 'all' && job.technician !== selectedTechnician) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (job.soNo || '').toLowerCase().includes(q) ||
          (job.projectCode || '').toLowerCase().includes(q) ||
          (job.projectName || '').toLowerCase().includes(q) ||
          (job.customerName || '').toLowerCase().includes(q) ||
          (job.ecrNo || '').toLowerCase().includes(q) ||
          (job.technician || '').toLowerCase().includes(q) ||
          (job.salesOwner || '').toLowerCase().includes(q) ||
          (job.storeRequester || '').toLowerCase().includes(q) ||
          (job.jobDescription || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [masterQueue, selectedCategory, selectedStatus, selectedTechnician, searchQuery]);

  // Display sorted jobs
  const sortedJobs = useMemo(() => {
    return [...filteredJobs].sort((a, b) => {
      if (sortField === 'queue') {
        const rankA = queueRankMap.get(a.id) || 999999;
        const rankB = queueRankMap.get(b.id) || 999999;
        return sortAsc ? rankA - rankB : rankB - rankA;
      }
      if (sortField === 'daysUsed') {
        const daysA = getDaysUsed(a);
        const daysB = getDaysUsed(b);
        const valA = daysA !== null ? daysA : -999999;
        const valB = daysB !== null ? daysB : -999999;
        return sortAsc ? valA - valB : valB - valA;
      }
      const valA = a[sortField as keyof ModifyJob] ?? '';
      const valB = b[sortField as keyof ModifyJob] ?? '';
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredJobs, sortField, sortAsc, queueRankMap]);

  const handleSort = (field: QueueSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getJobAlert = (jobId: string) => {
    return urgentAlerts.find((a) => a.job.id === jobId);
  };

  const getStatusBadge = (status: JobStatus) => {
    switch (status) {
      case 'รอดำเนินการ':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'กำลังดำเนินการ':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'รอตรวจรับ':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'เสร็จสิ้น':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'ยกเลิก':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getCategoryBadge = (category: JobCategory) => {
    switch (category) {
      case 'modify_general':
        return {
          label: 'Modify ทั่วไป',
          sheet: 'Sheet 1',
          classes: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          icon: Wrench
        };
      case 'paint':
        return {
          label: 'งานพ่นสี',
          sheet: 'Sheet 2',
          classes: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
          icon: Paintbrush
        };
      case 'custom_fabrication':
        return {
          label: 'งานประยุกต์ประดิษฐ์',
          sheet: 'Sheet 3',
          classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          icon: Cpu
        };
      default:
        return {
          label: category,
          sheet: '-',
          classes: 'bg-slate-700 text-slate-300 border-slate-600',
          icon: Wrench
        };
    }
  };

  // KPIs
  const totalQueueCount = masterQueue.length;
  const pendingCount = masterQueue.filter(j => j.status === 'รอดำเนินการ').length;
  const inProgressCount = masterQueue.filter(j => j.status === 'กำลังดำเนินการ').length;
  const waitingInspectionCount = masterQueue.filter(j => j.status === 'รอตรวจรับ').length;
  const urgentCount = urgentAlerts.filter(a => a.job.status !== 'เสร็จสิ้น' && a.job.status !== 'ยกเลิก').length;

  const handleExportCSV = () => {
    exportJobsToCSV(sortedJobs, 'BRZ_Job_Queue_Active_Only');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-3 sm:p-4 lg:p-6 overflow-hidden gap-4">
      {/* Header Banner & Global Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-amber-500/10 via-cyan-500/5 to-transparent pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <ListOrdered className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2">
                  <span>คิวงานรวมทุกหมวดหมู่</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  FIFO: คิวงานที่ยังไม่เสร็จสิ้น เรียงตามวันเวลาที่รับสินค้า
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                รวมเฉพาะงานที่อยู่ระหว่างดำเนินการจากงาน Modify ทั่วไป, งานพ่นสี, และงานประยุกต์ประดิษฐ์
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm hover:border-slate-600"
              title="ส่งออกรายการคิวงานเป็นไฟล์ CSV"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={onOpenSheetsSync}
              className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm hover:border-slate-600"
              title="ตั้งค่าและซิงค์ข้อมูล Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets</span>
            </button>

            <button
              onClick={onOpenNewJob}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>

        {/* KPI Mini-Cards Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 font-medium">คิวที่ต้องทำทั้งหมด</div>
              <div className="text-lg font-black text-slate-100">{totalQueueCount}</div>
            </div>
            <Layers className="w-5 h-5 text-slate-500" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-amber-400 font-medium">รอดำเนินการ</div>
              <div className="text-lg font-black text-amber-300">{pendingCount}</div>
            </div>
            <Clock className="w-5 h-5 text-amber-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-cyan-400 font-medium">กำลังดำเนินการ</div>
              <div className="text-lg font-black text-cyan-300">{inProgressCount}</div>
            </div>
            <RefreshCw className="w-5 h-5 text-cyan-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-purple-400 font-medium">รอตรวจรับ</div>
              <div className="text-lg font-black text-purple-300">{waitingInspectionCount}</div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-purple-400/60" />
          </div>

          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <div className="text-[11px] text-rose-400 font-medium">ด่วน/เลยกำหนด</div>
              <div className="text-lg font-black text-rose-300">{urgentCount}</div>
            </div>
            <Flame className="w-5 h-5 text-rose-400/60" />
          </div>
        </div>
      </div>

      {/* Control Filter Toolbar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหา SO No., Project Code, ชื่อลูกค้า, รายละเอียด, ช่าง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-750 focus:border-amber-500 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 text-[11px] font-medium">หมวดหมู่:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">ทุกหมวดหมู่ ({masterQueue.length})</option>
              <option value="modify_general" className="bg-slate-900">งาน Modify ทั่วไป</option>
              <option value="paint" className="bg-slate-900">งานพ่นสี</option>
              <option value="custom_fabrication" className="bg-slate-900">งานประยุกต์ประดิษฐ์</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-400 text-[11px] font-medium">สถานะ:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">ทุกสถานะคิว ({masterQueue.length})</option>
              <option value="รอดำเนินการ" className="bg-slate-900">รอดำเนินการ</option>
              <option value="กำลังดำเนินการ" className="bg-slate-900">กำลังดำเนินการ</option>
              <option value="รอตรวจรับ" className="bg-slate-900">รอตรวจรับ</option>
            </select>
          </div>

          {/* Technician Filter */}
          {technicians.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-slate-400 text-[11px] font-medium">ช่าง:</span>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">ช่างทุกคน</option>
                {technicians.map((t) => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
            </div>
          )}

          <div className="text-[11px] font-mono text-slate-400 px-2">
            แสดง <span className="font-bold text-amber-400">{sortedJobs.length}</span> จากคิวทั้งหมด {masterQueue.length} รายการ
          </div>
        </div>
      </div>

      {/* Main Queue Industrial Data Table */}
      <div className="flex-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-inner">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-left border-collapse min-w-[1780px]">
            <thead className="bg-slate-850/90 sticky top-0 z-10 border-b border-slate-750 text-[11px] font-bold text-slate-300 uppercase tracking-wider select-none">
              <tr>
                {/* ลำดับคิวงาน (Queue No.) */}
                <th 
                  className="py-3 px-3.5 w-24 text-center cursor-pointer hover:bg-slate-800 bg-amber-500/10 border-r border-amber-500/20" 
                  onClick={() => handleSort('queue')}
                >
                  <div className="flex items-center justify-center gap-1 text-amber-300 font-extrabold">
                    <span>ลำดับคิว</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* หมวดหมู่งาน */}
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    <span>หมวดหมู่งาน</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* ECR No. */}
                <th className="py-3 px-3 w-28">ECR No.</th>

                {/* เซลล์เจ้าของงาน */}
                <th className="py-3 px-3 w-28">เซลล์</th>

                {/* สโตร์ผู้ร้องขอ */}
                <th className="py-3 px-3 w-28">สโตร์ผู้ร้องขอ</th>

                {/* SO No. (PK) */}
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800 bg-amber-500/5 border-l border-amber-500/20" onClick={() => handleSort('soNo')}>
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <span>SO No. (PK)</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* Project Code & Name (PK) */}
                <th className="py-3 px-3 w-52 cursor-pointer hover:bg-slate-800 bg-amber-500/5 border-r border-amber-500/20" onClick={() => handleSort('projectCode')}>
                  <div className="flex items-center gap-1 text-amber-300 font-bold">
                    <span>Project Code / Name</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>

                {/* ชื่อลูกค้า */}
                <th className="py-3 px-3 w-40 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('customerName')}>
                  <div className="flex items-center gap-1">
                    <span>ชื่อลูกค้า</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* จำนวน (Qty) */}
                <th className="py-3 px-3 w-20 text-center">จำนวน</th>

                {/* รายละเอียดงาน */}
                <th className="py-3 px-3 min-w-[200px]">รายละเอียดงาน</th>

                {/* ไฟล์แนบ */}
                <th className="py-3 px-3 w-28 text-center">ไฟล์ประกอบ</th>

                {/* วันที่รับงาน (วันเวลาที่รับสินค้า) */}
                <th className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-800 bg-cyan-500/10 border-x border-cyan-500/20" onClick={() => handleSort('receivedDate')}>
                  <div className="flex items-center gap-1 text-cyan-300 font-bold">
                    <span>วันที่รับงาน</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>

                {/* Shipment Date */}
                <th className="py-3 px-3 w-32 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('shipmentDate')}>
                  <div className="flex items-center gap-1">
                    <span>Shipment Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* วันที่ประมาณการ */}
                <th className="py-3 px-3 w-28">วันที่ประมาณการ</th>

                {/* วันที่เสร็จสิ้น */}
                <th className="py-3 px-3 w-36">
                  <div className="flex items-center gap-1 text-emerald-300">
                    <span>วันที่เสร็จสิ้น</span>
                  </div>
                </th>

                {/* จำนวนวันที่ใช้ */}
                <th className="py-3 px-3 w-28 text-center cursor-pointer hover:bg-slate-800" onClick={() => handleSort('daysUsed')}>
                  <div className="flex items-center justify-center gap-1 text-cyan-300">
                    <span>วันที่ใช้</span>
                    <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                  </div>
                </th>

                {/* Status งาน */}
                <th className="py-3 px-3 w-36 cursor-pointer hover:bg-slate-800" onClick={() => handleSort('status')}>
                  <div className="flex items-center gap-1">
                    <span>Status งาน</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>

                {/* ช่างผู้รับผิดชอบ */}
                <th className="py-3 px-3 w-36">ช่างผู้รับผิดชอบ</th>

                {/* จัดการ */}
                <th className="py-3 px-3 w-24 text-center sticky right-0 bg-slate-850 shadow-[-4px_0_10px_rgba(0,0,0,0.3)]">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={19} className="py-14 text-center text-slate-400">
                    <div className="max-w-xs mx-auto space-y-2.5">
                      <ListOrdered className="w-10 h-10 text-slate-500 mx-auto" />
                      <div className="font-semibold text-slate-300 text-sm">ไม่พบคิวงานตามเงื่อนไขที่เลือก</div>
                      <p className="text-xs text-slate-500">
                        ลองปรับเปลี่ยนตัวกรอง หรือกดปุ่ม "สร้างงานใหม่" เพื่อเพิ่มคิวงาน
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedJobs.map((job) => {
                  const queueRank = queueRankMap.get(job.id) || 0;
                  const alert = getJobAlert(job.id);
                  const isUrgent = alert?.isUrgent1Day;
                  const isOverdue = alert?.isOverdue;
                  const hasAttachments = job.attachments && job.attachments.length > 0;
                  const daysUsed = getDaysUsed(job);
                  const categoryMeta = getCategoryBadge(job.category);
                  const CategoryIcon = categoryMeta.icon;

                  return (
                    <tr
                      key={job.id}
                      className={`hover:bg-slate-800/60 transition group ${
                        isOverdue ? 'bg-rose-950/20' : isUrgent ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      {/* ลำดับคิวงาน (Queue Badge) */}
                      <td className="py-3 px-3.5 text-center bg-amber-500/5 border-r border-amber-500/20">
                        <div className="flex flex-col items-center justify-center">
                          <span
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg font-mono font-black text-xs shadow-sm ${
                              queueRank === 1
                                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-amber-500/30 ring-2 ring-amber-400/50 animate-pulse'
                                : queueRank <= 3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            คิว #{queueRank}
                          </span>
                          {queueRank === 1 && (
                            <span className="text-[9px] text-amber-400 font-bold mt-0.5">คิวแรก</span>
                          )}
                        </div>
                      </td>

                      {/* หมวดหมู่งาน */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold ${categoryMeta.classes}`}>
                          <CategoryIcon className="w-3 h-3" />
                          <span>{categoryMeta.label}</span>
                        </span>
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
                      <td className="py-3 px-3 font-mono font-bold text-amber-300 bg-amber-500/5 border-l border-amber-500/20">
                        <div className="flex items-center justify-between gap-1">
                          <span>{job.soNo}</span>
                          <button
                            onClick={() => copyToClipboard(job.soNo, `so-${job.id}`)}
                            title="คัดลอก SO No."
                            className="opacity-0 group-hover:opacity-100 text-amber-400/80 hover:text-amber-300 p-0.5 rounded cursor-pointer transition"
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

                      {/* จำนวน (Qty) */}
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

                      {/* ไฟล์แนบ */}
                      <td className="py-3 px-3 text-center bg-slate-950/40">
                        {hasAttachments ? (
                          <button
                            onClick={() => {
                              setViewingAttachmentJob(job);
                              setInitialAttachmentIndex(0);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-semibold transition inline-flex items-center gap-1.5 shadow-sm"
                            title="ดูรูปภาพ/ไฟล์ประกอบ"
                          >
                            <Paperclip className="w-3 h-3 text-amber-400" />
                            <span>{job.attachments!.length} ไฟล์</span>
                          </button>
                        ) : job.status === 'เสร็จสิ้น' ? (
                          <span className="text-[10px] text-slate-400 italic flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500/70" />
                            <span>ลบไฟล์แล้ว</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </td>

                      {/* วันที่รับงาน */}
                      <td className="py-3 px-3 font-mono text-[11px] font-semibold text-cyan-300 bg-cyan-500/5 border-x border-cyan-500/20">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-cyan-400" />
                          <span>{job.receivedDate}</span>
                        </div>
                      </td>

                      {/* Shipment Date + Urgent Alert */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="font-mono font-semibold text-slate-200 text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{job.shipmentDate}</span>
                          </div>

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

                      {/* วันที่เสร็จสิ้น */}
                      <td className="py-3 px-3">
                        {job.status === 'เสร็จสิ้น' || job.completedDate ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>{job.completedDate || job.updatedAt?.replace('T', ' ').substring(0, 16) || '-'}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* จำนวนวันที่ใช้ */}
                      <td className="py-3 px-3 text-center">
                        {daysUsed !== null ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 whitespace-nowrap shadow-sm">
                            {daysUsed} วัน
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs font-mono">-</span>
                        )}
                      </td>

                      {/* Status งาน */}
                      <td className="py-3 px-3">
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
                      </td>

                      {/* ช่างผู้รับผิดชอบ */}
                      <td className="py-3 px-3 font-medium text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-cyan-400/80"></div>
                          <span className="line-clamp-1" title={job.technician}>{job.technician || 'ยังไม่มอบหมาย'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sticky right-0 bg-slate-900/95 group-hover:bg-slate-850/95 transition shadow-[-4px_0_10px_rgba(0,0,0,0.3)]">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewJob(job)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                            title="ดูรายละเอียดฉบับเต็ม"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditJob(job)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition cursor-pointer"
                            title="แก้ไขข้อมูลงาน"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition cursor-pointer"
                            title="ลบรายการงานนี้"
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
      </div>

      {/* Attachments Viewer Modal */}
      {viewingAttachmentJob && viewingAttachmentJob.attachments && viewingAttachmentJob.attachments.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-200 text-sm">
                  ไฟล์แนบ: SO {viewingAttachmentJob.soNo} ({viewingAttachmentJob.projectName})
                </h3>
              </div>
              <button
                onClick={() => setViewingAttachmentJob(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center">
              {viewingAttachmentJob.attachments[initialAttachmentIndex]?.type === 'image' ? (
                <img
                  src={viewingAttachmentJob.attachments[initialAttachmentIndex].dataUrl}
                  alt={viewingAttachmentJob.attachments[initialAttachmentIndex].name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain border border-slate-800"
                />
              ) : (
                <div className="text-center p-8 bg-slate-950 rounded-xl border border-slate-800">
                  <FileText className="w-16 h-16 text-amber-400 mx-auto mb-3" />
                  <div className="font-bold text-slate-200">{viewingAttachmentJob.attachments[initialAttachmentIndex]?.name}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {(viewingAttachmentJob.attachments[initialAttachmentIndex]?.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              )}
            </div>

            {viewingAttachmentJob.attachments.length > 1 && (
              <div className="p-3 bg-slate-850/80 border-t border-slate-750 flex items-center justify-between">
                <button
                  disabled={initialAttachmentIndex === 0}
                  onClick={() => setInitialAttachmentIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 text-slate-300"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ก่อนหน้า</span>
                </button>
                <span className="text-xs font-mono text-slate-400">
                  {initialAttachmentIndex + 1} / {viewingAttachmentJob.attachments.length}
                </span>
                <button
                  disabled={initialAttachmentIndex === viewingAttachmentJob.attachments.length - 1}
                  onClick={() => setInitialAttachmentIndex((prev) => Math.min(viewingAttachmentJob.attachments!.length - 1, prev + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 text-slate-300"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
