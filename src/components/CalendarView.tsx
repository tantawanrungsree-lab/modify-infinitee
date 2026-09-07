import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Clock, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Layers, 
  Eye, 
  Sparkles,
  CalendarDays,
  FileSpreadsheet,
  Plus,
  Wrench,
  Paintbrush,
  Cpu,
  PackageCheck,
  CalendarRange
} from 'lucide-react';
import { ModifyJob, JobCategory, JobStatus, CATEGORY_CONFIG, DeadlineAlertItem } from '../types';
import { TECHNICIANS_LIST } from '../lib/sampleData';

interface CalendarViewProps {
  jobs: ModifyJob[];
  urgentAlerts: DeadlineAlertItem[];
  onViewJob: (job: ModifyJob) => void;
  onEditJob: (job: ModifyJob) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
  onOpenNewJob: () => void;
  onOpenSheetsSync: () => void;
}

const MONTH_NAMES_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const DAY_NAMES_TH = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const DAY_NAMES_FULL_TH = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

const STATUS_COLOR_MAP: Record<JobStatus, { bg: string; text: string; border: string; dot: string }> = {
  'รอดำเนินการ': {
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400'
  },
  'กำลังดำเนินการ': {
    bg: 'bg-sky-500/15',
    text: 'text-sky-300',
    border: 'border-sky-500/30',
    dot: 'bg-sky-400'
  },
  'รอตรวจรับ': {
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-500/30',
    dot: 'bg-purple-400'
  },
  'เสร็จสิ้น': {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400'
  },
  'ยกเลิก': {
    bg: 'bg-slate-700/50',
    text: 'text-slate-400',
    border: 'border-slate-600',
    dot: 'bg-slate-500'
  }
};

const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  jobs,
  urgentAlerts,
  onViewJob,
  onEditJob,
  onStatusChange,
  onOpenNewJob,
  onOpenSheetsSync
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => formatLocalDate(today), [today]);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    return formatLocalDate(today);
  });
  
  // Filters
  const [selectedTechnician, setSelectedTechnician] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [calendarSearch, setCalendarSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(formatLocalDate(now));
  };

  // Filtered jobs based on filters and search
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (selectedTechnician !== 'all' && job.technician !== selectedTechnician) {
        return false;
      }
      if (selectedStatus !== 'all' && job.status !== selectedStatus) {
        return false;
      }
      if (selectedCategory !== 'all' && job.category !== selectedCategory) {
        return false;
      }
      if (calendarSearch.trim()) {
        const q = calendarSearch.toLowerCase().trim();
        const matchSo = job.soNo.toLowerCase().includes(q);
        const matchProject = job.projectName.toLowerCase().includes(q) || job.projectCode.toLowerCase().includes(q);
        const matchTech = job.technician.toLowerCase().includes(q);
        const matchCustomer = job.customerName.toLowerCase().includes(q);
        const matchDesc = job.jobDescription.toLowerCase().includes(q);
        if (!matchSo && !matchProject && !matchTech && !matchCustomer && !matchDesc) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, selectedTechnician, selectedStatus, selectedCategory, calendarSearch]);

  // Map of jobs grouped by Shipment Date (YYYY-MM-DD)
  const jobsByDate = useMemo(() => {
    const map = new Map<string, ModifyJob[]>();
    filteredJobs.forEach((job) => {
      const dateKey = job.shipmentDate || job.estimatedDate;
      if (dateKey) {
        const existing = map.get(dateKey) || [];
        existing.push(job);
        map.set(dateKey, existing);
      }
    });
    return map;
  }, [filteredJobs]);

  // Compute Calendar Grid days
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = lastDayOfMonth.getDate();
    
    // Days from previous month
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const days = [];

    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevDate = new Date(currentYear, currentMonth - 1, dayNum);
      const dateStr = formatLocalDate(prevDate);
      days.push({
        date: prevDate,
        dateStr,
        dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const dateStr = formatLocalDate(dateObj);
      days.push({
        date: dateObj,
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Days for next month to complete standard 6-row or 5-row grid (total multiple of 7)
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextDate = new Date(currentYear, currentMonth + 1, n);
      const dateStr = formatLocalDate(nextDate);
      days.push({
        date: nextDate,
        dateStr,
        dayNum: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr]);

  // Selected date jobs list
  const selectedDateJobs = useMemo(() => {
    return jobsByDate.get(selectedDateStr) || [];
  }, [jobsByDate, selectedDateStr]);

  // Metrics for current month
  const monthMetrics = useMemo(() => {
    const currentMonthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const thisMonthJobs = filteredJobs.filter(j => j.shipmentDate && j.shipmentDate.startsWith(currentMonthPrefix));
    
    const pendingCount = thisMonthJobs.filter(j => j.status === 'รอดำเนินการ').length;
    const inProgressCount = thisMonthJobs.filter(j => j.status === 'กำลังดำเนินการ').length;
    const inspectingCount = thisMonthJobs.filter(j => j.status === 'รอตรวจรับ').length;
    const completedCount = thisMonthJobs.filter(j => j.status === 'เสร็จสิ้น').length;

    return {
      total: thisMonthJobs.length,
      pendingCount,
      inProgressCount,
      inspectingCount,
      completedCount,
    };
  }, [filteredJobs, currentYear, currentMonth]);

  // List of unique technicians who have jobs assigned + standard list
  const allTechnicians = useMemo(() => {
    const set = new Set<string>(TECHNICIANS_LIST);
    jobs.forEach(j => {
      if (j.technician) set.add(j.technician);
    });
    return Array.from(set);
  }, [jobs]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-hidden">
      {/* Top Calendar Header & Control Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-3 sm:p-4 shrink-0 flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Month / Year Navigator */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>{MONTH_NAMES_TH[currentMonth]}</span>
                  <span className="text-amber-400 font-mono">{currentYear + 543}</span>
                </h1>
                <span className="text-xs text-slate-400 font-mono font-medium bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {currentYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                ปฏิทินงาน Modify จำแนกตาม Shipment Date, ช่างผู้รับผิดชอบ และ Status
              </p>
            </div>

            {/* Prev / Today / Next Buttons */}
            <div className="flex items-center gap-1 ml-0 sm:ml-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="เดือนก่อนหน้า"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-2.5 py-1 text-xs font-bold text-amber-300 hover:bg-slate-700 rounded-lg transition cursor-pointer"
              >
                วันนี้
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="เดือนถัดไป"
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & View Toggle */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-between lg:justify-end">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('month')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>มุมมองปฏิทิน</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('agenda')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${
                  viewMode === 'agenda'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5" />
                <span>กำหนดการ (Agenda)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenNewJob}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>สร้างงานใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1 border-t border-slate-800/80">
          {/* 1. Filter by Technician */}
          <div className="relative">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>ช่างผู้รับผิดชอบ:</span>
            </div>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">👨‍🔧 ช่างทุกคน ({jobs.length} งาน)</option>
              {allTechnicians.map((tech) => {
                const count = jobs.filter(j => j.technician === tech).length;
                return (
                  <option key={tech} value={tech}>
                    {tech} ({count} งาน)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Filter by Job Status */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>สถานะงาน (Status):</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">📊 ทุกสถานะ ({jobs.length})</option>
              <option value="รอดำเนินการ">🟡 รอดำเนินการ</option>
              <option value="กำลังดำเนินการ">🔵 กำลังดำเนินการ</option>
              <option value="รอตรวจรับ">🟣 รอตรวจรับ</option>
              <option value="เสร็จสิ้น">🟢 เสร็จสิ้น</option>
              <option value="ยกเลิก">⚪ ยกเลิก</option>
            </select>
          </div>

          {/* 3. Filter by Category */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>ประเภทงาน:</span>
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="all">📁 ทุกหมวดหมู่งาน</option>
              <option value="modify_general">1. งาน Modify ทั่วไป</option>
              <option value="paint">2. งานพ่นสี</option>
              <option value="custom_fabrication">3. งานประยุกต์ประดิษฐ์</option>
            </select>
          </div>

          {/* 4. Search Filter */}
          <div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 mb-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>ค้นหาในปฏิทิน:</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="SO No, โครงการ, ช่าง..."
                value={calendarSearch}
                onChange={(e) => setCalendarSearch(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500 placeholder-slate-400"
              />
              {calendarSearch && (
                <button
                  type="button"
                  onClick={() => setCalendarSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Month Summary Bar */}
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto text-xs pt-1 text-slate-300">
          <span className="text-slate-400 shrink-0 font-medium">
            ส่งมอบเดือนนี้: <strong className="text-white">{monthMetrics.total}</strong> งาน
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            รอดำเนินการ: {monthMetrics.pendingCount}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            กำลังทำ: {monthMetrics.inProgressCount}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            รอตรวจรับ: {monthMetrics.inspectingCount}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            เสร็จสิ้น: {monthMetrics.completedCount}
          </span>
        </div>
      </div>

      {/* Main Calendar Grid / Agenda Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {viewMode === 'month' ? (
          /* Month Grid View */
          <div className="flex-1 flex flex-col overflow-y-auto p-2 sm:p-3">
            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-1 shrink-0">
              {DAY_NAMES_TH.map((dayName, idx) => {
                const isWeekend = idx === 0 || idx === 6;
                return (
                  <div
                    key={dayName}
                    className={`py-2 text-center text-xs font-bold uppercase tracking-wider rounded-lg ${
                      isWeekend
                        ? 'bg-rose-950/20 text-rose-400/80 border border-rose-900/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    <span className="hidden sm:inline">{DAY_NAMES_FULL_TH[idx]}</span>
                    <span className="sm:hidden">{dayName}</span>
                  </div>
                );
              })}
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1 auto-rows-fr">
              {calendarGrid.map((dayItem, idx) => {
                const dayJobs = jobsByDate.get(dayItem.dateStr) || [];
                const isSelected = selectedDateStr === dayItem.dateStr;
                const hasJobs = dayJobs.length > 0;
                const hasUrgent = dayJobs.some(j => urgentAlerts.some(a => a.job.id === j.id));

                return (
                  <div
                    key={`cal-day-box-${dayItem.dateStr}-${dayItem.isCurrentMonth ? 'curr' : 'ext'}-${idx}`}
                    onClick={() => setSelectedDateStr(dayItem.dateStr)}
                    className={`min-h-[90px] sm:min-h-[110px] p-1 sm:p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                        : dayItem.isToday
                        ? 'bg-slate-850 border-amber-500/60 shadow-sm'
                        : dayItem.isCurrentMonth
                        ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850/80'
                        : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60'
                    }`}
                  >
                    {/* Top Row in Day Card: Day Number & Badge */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-bold font-mono px-1.5 py-0.5 rounded-md ${
                          dayItem.isToday
                            ? 'bg-amber-500 text-slate-950 font-black'
                            : isSelected
                            ? 'text-amber-300 font-bold'
                            : dayItem.isCurrentMonth
                            ? 'text-slate-300'
                            : 'text-slate-600'
                        }`}
                      >
                        {dayItem.dayNum}
                      </span>

                      {hasJobs && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {dayJobs.length} งาน
                        </span>
                      )}
                    </div>

                    {/* Jobs List in Day Box (Show top 2-3 items) */}
                    <div className="space-y-1 my-1 flex-1 overflow-hidden">
                      {dayJobs.slice(0, 2).map((job) => {
                        const statusTheme = STATUS_COLOR_MAP[job.status] || STATUS_COLOR_MAP['รอดำเนินการ'];
                        const isJobUrgent = urgentAlerts.some(a => a.job.id === job.id);

                        return (
                          <div
                            key={job.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewJob(job);
                            }}
                            className={`px-1.5 py-1 rounded text-[10px] sm:text-[11px] font-medium border truncate transition hover:scale-[1.02] flex items-center justify-between gap-1 cursor-pointer ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                            title={`SO: ${job.soNo} | ${job.projectName} | ช่าง: ${job.technician} | สถานะ: ${job.status}`}
                          >
                            <div className="flex items-center gap-1 truncate min-w-0">
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusTheme.dot}`} />
                              <span className="font-mono font-bold truncate">{job.soNo}</span>
                            </div>
                            {isJobUrgent && (
                              <span className="text-[10px] text-rose-400 shrink-0" title="เร่งด่วน 1 วัน">
                                ⚠️
                              </span>
                            )}
                          </div>
                        );
                      })}

                      {dayJobs.length > 2 && (
                        <div className="text-[10px] text-amber-400 font-semibold px-1 text-center bg-slate-800/80 rounded py-0.5">
                          + อีก {dayJobs.length - 2} งาน
                        </div>
                      )}
                    </div>

                    {/* Bottom Indicator for Technician hint */}
                    {hasJobs && (
                      <div className="text-[9px] text-slate-400 truncate pt-0.5 border-t border-slate-800/60 hidden sm:block">
                        👨‍🔧 {dayJobs[0].technician.split(' ')[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Agenda / List View */
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {Array.from(jobsByDate.entries())
              .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
              .map(([dateKey, dateJobsList]) => {
                const parts = dateKey.split('-').map(Number);
                const dateObj = parts.length === 3 ? new Date(parts[0], parts[1] - 1, parts[2]) : new Date(dateKey);
                const dayOfWeek = DAY_NAMES_FULL_TH[dateObj.getDay()] || '';
                const isTodayDate = dateKey === todayStr;

                return (
                  <div
                    key={dateKey}
                    className={`rounded-2xl border p-3 sm:p-4 transition ${
                      isTodayDate
                        ? 'bg-slate-850 border-amber-500/60 shadow-lg'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl text-xs font-bold font-mono ${
                          isTodayDate ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-800 text-amber-300 border border-slate-700'
                        }`}>
                          {dateKey}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{dayOfWeek}</span>
                            {isTodayDate && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                                วันนี้ (TODAY)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            กำหนดส่งมอบ (Shipment Date)
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        {dateJobsList.length} รายการ
                      </span>
                    </div>

                    {/* Jobs in this Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {dateJobsList.map((job) => {
                        const statusTheme = STATUS_COLOR_MAP[job.status] || STATUS_COLOR_MAP['รอดำเนินการ'];
                        const config = CATEGORY_CONFIG[job.category];

                        return (
                          <div
                            key={job.id}
                            onClick={() => onViewJob(job)}
                            className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 transition cursor-pointer flex flex-col justify-between gap-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-white text-xs sm:text-sm">
                                    {job.soNo}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${config.badgeColor}`}>
                                    {config.title}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                                  {job.projectName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  ลูกค้า: {job.customerName}
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}>
                                {job.status}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                              <span className="flex items-center gap-1 text-slate-400">
                                <User className="w-3.5 h-3.5 text-amber-400" />
                                <strong className="text-slate-200">{job.technician}</strong>
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                SO Recv: {job.receivedDate}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {jobsByDate.size === 0 && (
              <div className="py-16 text-center text-slate-400">
                <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                <div className="text-sm font-semibold text-slate-300">ไม่พบงานที่ตรงกับตัวกรองที่เลือก</div>
                <div className="text-xs text-slate-500 mt-1">ลองเปลี่ยนตัวกรองช่าง สถานะ หรือคำค้นหา</div>
              </div>
            )}
          </div>
        )}

        {/* Right Details Panel for Selected Date */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 p-3 sm:p-4 overflow-y-auto max-h-[50vh] lg:max-h-full">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                <span>รายละเอียดงานประจำวัน</span>
              </div>
              <div className="text-base font-black text-white font-mono mt-0.5">
                {selectedDateStr}
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
              {selectedDateJobs.length} งาน
            </span>
          </div>

          {/* Jobs List for the selected day */}
          <div className="mt-3 space-y-2.5 flex-1">
            {selectedDateJobs.length > 0 ? (
              selectedDateJobs.map((job) => {
                const statusTheme = STATUS_COLOR_MAP[job.status] || STATUS_COLOR_MAP['รอดำเนินการ'];
                const config = CATEGORY_CONFIG[job.category];
                const isUrgent = urgentAlerts.some(a => a.job.id === job.id);

                return (
                  <div
                    key={job.id}
                    onClick={() => onViewJob(job)}
                    className="p-3 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 transition cursor-pointer space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="font-mono font-bold text-white text-xs flex items-center gap-1.5">
                          <span>{job.soNo}</span>
                          {isUrgent && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                              เตือน 1 วัน
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-slate-200 mt-0.5 line-clamp-1">
                          {job.projectName}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 line-clamp-2 bg-slate-850 p-1.5 rounded border border-slate-750">
                      {job.jobDescription || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </div>

                    <div className="pt-1.5 border-t border-slate-750 flex items-center justify-between text-[11px]">
                      <span className="text-amber-300 font-medium flex items-center gap-1">
                        <User className="w-3 h-3 text-amber-400" />
                        <span>{job.technician}</span>
                      </span>
                      <span className="text-slate-400">
                        ลำดับ: #{job.seqNo}
                      </span>
                    </div>

                    {/* Quick Status Change Action */}
                    <div className="flex items-center gap-1 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(job.id, 'กำลังดำเนินการ');
                        }}
                        className={`flex-1 py-1 text-[10px] font-semibold rounded border transition cursor-pointer ${
                          job.status === 'กำลังดำเนินการ'
                            ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                            : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        กำลังทำ
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(job.id, 'รอตรวจรับ');
                        }}
                        className={`flex-1 py-1 text-[10px] font-semibold rounded border transition cursor-pointer ${
                          job.status === 'รอตรวจรับ'
                            ? 'bg-purple-500 text-slate-950 border-purple-400 font-bold'
                            : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        รอตรวจรับ
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(job.id, 'เสร็จสิ้น');
                        }}
                        className={`flex-1 py-1 text-[10px] font-semibold rounded border transition cursor-pointer ${
                          job.status === 'เสร็จสิ้น'
                            ? 'bg-emerald-500 text-white border-emerald-400 font-bold'
                            : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        เสร็จสิ้น
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CalendarIcon className="w-8 h-8 mx-auto text-slate-600" />
                <div className="text-xs font-semibold text-slate-300">ไม่มีกำหนดส่งมอบในวันที่เลือก</div>
                <div className="text-[11px] text-slate-500">
                  คลิกเลือกวันที่อื่นในปฏิทิน หรือกดปุ่ม "สร้างงานใหม่"
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
