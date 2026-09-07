import React from 'react';
import { 
  Wrench, 
  Paintbrush, 
  Cpu, 
  ReceiptText, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  Sparkles,
  TrendingUp,
  Calculator,
  CalendarCheck2,
  CalendarDays
} from 'lucide-react';
import { ActiveView, JobCategory, CATEGORY_CONFIG, ModifyJob, DeadlineAlertItem } from '../types';

interface SidebarProps {
  activeView: ActiveView;
  onSelectView: (view: ActiveView) => void;
  onOpenNewJob: () => void;
  onOpenLeadTimeCalculator?: () => void;
  jobs: ModifyJob[];
  urgentAlerts: DeadlineAlertItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  onOpenNewJob,
  onOpenLeadTimeCalculator,
  jobs,
  urgentAlerts
}) => {
  // Counts by category
  const modifyGeneralJobs = jobs.filter(j => j.category === 'modify_general');
  const paintJobs = jobs.filter(j => j.category === 'paint');
  const customFabJobs = jobs.filter(j => j.category === 'custom_fabrication');

  const getUrgentCountForCategory = (cat: JobCategory) => {
    return urgentAlerts.filter(a => a.job.category === cat).length;
  };

  // Count new jobs (status = 'รอดำเนินการ')
  const getNewCountForCategory = (cat: JobCategory) => {
    return jobs.filter(j => j.category === cat && j.status === 'รอดำเนินการ').length;
  };

  const navItems = [
    {
      id: 'modify_general' as ActiveView,
      title: 'งาน Modify ทั่วไป',
      subtext: 'General Modification',
      icon: Wrench,
      count: modifyGeneralJobs.length,
      urgentCount: getUrgentCountForCategory('modify_general'),
      newCount: getNewCountForCategory('modify_general'),
      activeClass: 'bg-amber-500/15 text-amber-300 border-amber-500 shadow-md shadow-amber-500/10',
      inactiveClass: 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      iconClass: 'text-amber-400',
      sheetCode: 'Sheet 1',
    },
    {
      id: 'paint' as ActiveView,
      title: 'งานพ่นสี',
      subtext: 'Spray Painting Work',
      icon: Paintbrush,
      count: paintJobs.length,
      urgentCount: getUrgentCountForCategory('paint'),
      newCount: getNewCountForCategory('paint'),
      activeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500 shadow-md shadow-cyan-500/10',
      inactiveClass: 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
      iconClass: 'text-cyan-400',
      sheetCode: 'Sheet 2',
    },
    {
      id: 'custom_fabrication' as ActiveView,
      title: 'งานประยุกต์ประดิษฐ์',
      subtext: 'Applied & Custom Fabrication',
      icon: Cpu,
      count: customFabJobs.length,
      urgentCount: getUrgentCountForCategory('custom_fabrication'),
      newCount: getNewCountForCategory('custom_fabrication'),
      activeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-500/10',
      inactiveClass: 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      iconClass: 'text-emerald-400',
      sheetCode: 'Sheet 3',
    },
    {
      id: 'calendar' as ActiveView,
      title: 'ปฏิทินส่งมอบ (Calendar)',
      subtext: 'Shipment & Tech Schedule',
      icon: CalendarDays,
      count: jobs.length,
      urgentCount: urgentAlerts.length,
      newCount: 0,
      activeClass: 'bg-violet-500/15 text-violet-300 border-violet-500 shadow-md shadow-violet-500/10',
      inactiveClass: 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700',
      badgeClass: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
      iconClass: 'text-violet-400',
      sheetCode: 'Calendar',
    },
    {
      id: 'cost_summary' as ActiveView,
      title: 'สรุปค่าใช้จ่าย',
      subtext: 'Cost & Financial Overview',
      icon: ReceiptText,
      count: jobs.length,
      urgentCount: 0,
      newCount: 0,
      activeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500 shadow-md shadow-indigo-500/10',
      inactiveClass: 'hover:bg-slate-800/80 text-slate-300 border-transparent hover:border-slate-700',
      badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      iconClass: 'text-indigo-400',
      sheetCode: 'Summary',
    }
  ];

  const totalCost = jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const inProgressCount = jobs.filter(j => j.status === 'กำลังดำเนินการ').length;

  return (
    <aside className="w-full lg:w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col justify-between shrink-0 p-3 lg:p-4 gap-4">
      <div className="space-y-4">
        {/* Create New Job Primary Trigger */}
        <button
          onClick={onOpenNewJob}
          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm md:text-base flex items-center justify-between shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            <div className="text-left">
              <div className="leading-tight">สร้างงานใหม่ (New Job)</div>
              <div className="text-[11px] font-medium text-slate-900/80">บันทึกลง Sheet อัตโนมัติ</div>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-slate-950 group-hover:rotate-12 transition-transform" />
        </button>

        {/* Lead Time Calculator Tool Trigger Button */}
        {onOpenLeadTimeCalculator && (
          <button
            id="sidebar-lead-time-calculator-btn"
            type="button"
            onClick={() => onOpenLeadTimeCalculator()}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-850 to-slate-850 hover:from-amber-500/20 hover:to-slate-800 border border-amber-500/40 hover:border-amber-400 text-left transition-all duration-200 flex items-center justify-between group shadow-sm hover:shadow-amber-500/10 cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 group-hover:scale-105 group-hover:bg-amber-500/25 transition-all">
                <Calculator className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                  <span>คำนวณระยะเวลา Modify</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                    SO + 10 วัน
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  สูตร SO + 10 วันทำการ + ชิ้นงาน
                </div>
              </div>
            </div>
            <div className="shrink-0 flex items-center pl-1 text-amber-400 group-hover:text-amber-300 group-hover:translate-x-0.5 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        )}

        {/* Process Navigation Section */}
        <div>
          <div className="px-2 mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>กระบวนการหลัก (Modify Process)</span>
            <span className="text-[11px] font-normal text-slate-400">5 หน้าจอ</span>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectView(item.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group relative overflow-hidden ${
                    isActive ? item.activeClass : item.inactiveClass
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 ${item.iconClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5 truncate">
                        <span>{item.title}</span>
                        {item.newCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white border border-rose-400 shadow-lg shadow-rose-600/50 animate-pulse tracking-wide shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                            NEW JOB
                          </span>
                        )}
                        {item.urgentCount > 0 && item.newCount === 0 && (
                          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-ping" title="มีงานใกล้ครบกำหนด"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.subtext}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    {item.urgentCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40" title="งานแจ้งเตือน 1 วัน">
                        ⚠️ {item.urgentCount}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${item.badgeClass}`}>
                      {item.count}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'translate-x-0.5 text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats & System Metric Info */}
      <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            ภาพรวมงานทั้งหมด
          </span>
          <span className="text-slate-400">{jobs.length} รายการ</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">กำลังดำเนินการ</div>
            <div className="text-sm font-bold text-cyan-400">{inProgressCount} งาน</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="text-[10px] text-slate-400">ค่าใช้จ่ายรวม</div>
            <div className="text-sm font-bold text-amber-400">฿{totalCost.toLocaleString()}</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2 flex items-center justify-between">
          <span>Primary Keys:</span>
          <span className="text-slate-300 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
            Project + SO No.
          </span>
        </div>
      </div>
    </aside>
  );
};
