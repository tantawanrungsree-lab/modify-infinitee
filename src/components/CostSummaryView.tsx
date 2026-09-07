import React, { useState } from 'react';
import { 
  ReceiptText, 
  DollarSign, 
  TrendingUp, 
  PieChart, 
  Download, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Eye, 
  User, 
  Wrench, 
  Paintbrush, 
  Cpu, 
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { ModifyJob, JobCategory, CATEGORY_CONFIG, JobStatus } from '../types';
import { exportJobsToCSV } from '../lib/googleSheetsSync';

interface CostSummaryViewProps {
  jobs: ModifyJob[];
  onViewJob: (job: ModifyJob) => void;
  onOpenSheetsSync: () => void;
}

export const CostSummaryView: React.FC<CostSummaryViewProps> = ({
  jobs,
  onViewJob,
  onOpenSheetsSync,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof ModifyJob>('totalCost');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Financial calculations
  const totalCostAll = jobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const totalLaborCost = jobs.reduce((sum, j) => sum + (j.laborCost || 0), 0);
  const totalMaterialCost = jobs.reduce((sum, j) => sum + (j.materialCost || 0), 0);

  const modifyGeneralJobs = jobs.filter(j => j.category === 'modify_general');
  const paintJobs = jobs.filter(j => j.category === 'paint');
  const customFabJobs = jobs.filter(j => j.category === 'custom_fabrication');

  const modifyCost = modifyGeneralJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const paintCost = paintJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);
  const customFabCost = customFabJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0);

  // Technician workload and cost summary
  const techSummary = jobs.reduce((acc, job) => {
    const tech = job.technician || 'ยังไม่ระบุช่าง';
    if (!acc[tech]) {
      acc[tech] = { count: 0, cost: 0, completedCount: 0 };
    }
    acc[tech].count += 1;
    acc[tech].cost += (job.totalCost || 0);
    if (job.status === 'เสร็จสิ้น') acc[tech].completedCount += 1;
    return acc;
  }, {} as Record<string, { count: number; cost: number; completedCount: number }>);

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.soNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.ecrNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.projectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.technician.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat = selectedCategory === 'all' || job.category === selectedCategory;
    const matchesStat = selectedStatus === 'all' || job.status === selectedStatus;

    return matchesSearch && matchesCat && matchesStat;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    const valA = a[sortField] ?? 0;
    const valB = b[sortField] ?? 0;
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const handleSort = (field: keyof ModifyJob) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default high to low for costs
    }
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
      {/* Header Banner */}
      <div className="p-4 md:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              Summary Dashboard
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <ReceiptText className="w-6 h-6 text-indigo-400" />
              <span>หน้าสรุปค่าใช้จ่ายทุกกระบวนการ</span>
            </h2>
          </div>
          <p className="text-xs md:text-sm text-slate-400">
            วิเคราะห์งบประมาณ ต้นทุนค่าแรง ค่าวัสดุ และภาพรวมงานของ BRZ LUMENCRAFT ทั้ง 3 แผนก
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportJobsToCSV(jobs, 'สรุปค่าใช้จ่าย_รวมทุกแผนก')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs md:text-sm font-medium rounded-xl transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV ทุกแผนก</span>
          </button>
          
          <button
            onClick={onOpenSheetsSync}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs md:text-sm font-medium rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Google Sheets Sync</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Cost */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>ค่าใช้จ่ายสะสมทั้งหมด</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ฿{totalCostAll.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
            <span>ค่าแรง: ฿{totalLaborCost.toLocaleString()}</span>
            <span>ค่าวัสดุ: ฿{totalMaterialCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Modify General Cost */}
        <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-amber-300 mb-1">
            <span className="flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              1. Modify ทั่วไป ({modifyGeneralJobs.length} งาน)
            </span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono">
            ฿{modifyCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalCostAll > 0 ? ((modifyCost / totalCostAll) * 100).toFixed(1) : 0}% ของงบรวม
          </div>
        </div>

        {/* Paint Cost */}
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-cyan-300 mb-1">
            <span className="flex items-center gap-1">
              <Paintbrush className="w-3.5 h-3.5 text-cyan-400" />
              2. งานพ่นสี ({paintJobs.length} งาน)
            </span>
          </div>
          <div className="text-2xl font-black text-cyan-300 font-mono">
            ฿{paintCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalCostAll > 0 ? ((paintCost / totalCostAll) * 100).toFixed(1) : 0}% ของงบรวม
          </div>
        </div>

        {/* Custom Fab Cost */}
        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between text-xs text-emerald-300 mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              3. ประยุกต์ประดิษฐ์ ({customFabJobs.length} งาน)
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono">
            ฿{customFabCost.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {totalCostAll > 0 ? ((customFabCost / totalCostAll) * 100).toFixed(1) : 0}% ของงบรวม
          </div>
        </div>
      </div>

      {/* Technician & Department Breakdown Pill Bar */}
      <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">สรุปรายช่างผู้รับผิดชอบ:</span>
          {(Object.entries(techSummary) as [string, { count: number; cost: number; completedCount: number }][]).slice(0, 4).map(([tech, data]) => (
            <span key={tech} className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <strong>{tech}</strong>: {data.count} งาน (<span className="text-amber-400 font-mono">฿{data.cost.toLocaleString()}</span>)
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">ทุกแผนก ({jobs.length})</option>
            <option value="modify_general">งาน Modify ทั่วไป</option>
            <option value="paint">งานพ่นสี</option>
            <option value="custom_fabrication">งานประยุกต์ประดิษฐ์</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
          >
            <option value="all">ทุกสถานะ</option>
            <option value="รอดำเนินการ">รอดำเนินการ</option>
            <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
            <option value="รอตรวจรับ">รอตรวจรับ</option>
            <option value="เสร็จสิ้น">เสร็จสิ้น</option>
            <option value="ยกเลิก">ยกเลิก</option>
          </select>
        </div>
      </div>

      {/* Complete Cross-Department Master Table */}
      <div className="flex-1 bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden flex flex-col shadow-inner">
        <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
          <table className="w-full text-left border-collapse min-w-[1550px]">
            <thead className="bg-slate-850/90 sticky top-0 z-10 border-b border-slate-750 text-[11px] font-bold text-slate-300 uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-3 w-14 text-center cursor-pointer" onClick={() => handleSort('seqNo')}>
                  <span>ลำดับ</span>
                </th>
                <th className="py-3 px-3 w-32">
                  <span>แผนก / งาน</span>
                </th>
                <th className="py-3 px-3 w-28 cursor-pointer" onClick={() => handleSort('ecrNo')}>
                  <span>ECR No.</span>
                </th>
                <th className="py-3 px-3 w-36">
                  <span>เซลล์เจ้าของงาน</span>
                </th>
                <th className="py-3 px-3 w-32">
                  <span>สโตร์ผู้ร้องขอ</span>
                </th>
                <th className="py-3 px-3 w-32 bg-indigo-500/10 border-x border-indigo-500/20 text-indigo-300 font-extrabold cursor-pointer" onClick={() => handleSort('soNo')}>
                  <span>SO No. (PK)</span>
                </th>
                <th className="py-3 px-3 w-48 bg-indigo-500/10 border-r border-indigo-500/20 text-indigo-300 font-extrabold cursor-pointer" onClick={() => handleSort('projectName')}>
                  <span>Project Name (PK)</span>
                </th>
                <th className="py-3 px-3 w-40">
                  <span>ชื่อลูกค้า</span>
                </th>
                <th className="py-3 px-3 w-60">
                  <span>รายละเอียดงาน</span>
                </th>
                <th className="py-3 px-3 w-28">
                  <span>วันที่รับงาน</span>
                </th>
                <th className="py-3 px-3 w-32 cursor-pointer" onClick={() => handleSort('shipmentDate')}>
                  <span>Shipment Date</span>
                </th>
                <th className="py-3 px-3 w-32">
                  <span>วันที่ประมาณการ</span>
                </th>
                <th className="py-3 px-3 w-32">
                  <span>Status งาน</span>
                </th>
                <th className="py-3 px-3 w-40">
                  <span>ช่างที่ทำ / ผู้รับผิดชอบ</span>
                </th>
                <th className="py-3 px-3 w-28 text-right bg-amber-500/10 text-amber-300 font-extrabold cursor-pointer" onClick={() => handleSort('totalCost')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>ค่าใช้จ่ายรวม</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-400" />
                  </div>
                </th>
                <th className="py-3 px-3 w-20 text-center sticky right-0 bg-slate-850 z-20 border-l border-slate-750">
                  <span>ดู</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs text-slate-200">
              {sortedJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-800/60 transition">
                  <td className="py-3 px-3 text-center font-mono text-slate-400">
                    {job.seqNo}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_CONFIG[job.category].badgeColor}`}>
                      {CATEGORY_CONFIG[job.category].title}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-300">
                    {job.ecrNo || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {job.salesOwner || '-'}
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {job.storeRequester || '-'}
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-indigo-300 bg-indigo-500/5 border-x border-indigo-500/20">
                    {job.soNo}
                  </td>
                  <td className="py-3 px-3 bg-indigo-500/5 border-r border-indigo-500/20">
                    <div className="font-semibold text-slate-200 line-clamp-1">{job.projectName}</div>
                    <div className="font-mono text-[10px] text-indigo-400">{job.projectCode}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300 line-clamp-2">
                    {job.customerName}
                  </td>
                  <td className="py-3 px-3 text-slate-300 line-clamp-2 text-[11px]">
                    {job.jobDescription}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {job.receivedDate}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-200 font-medium text-[11px]">
                    {job.shipmentDate}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400 text-[11px]">
                    {job.estimatedDate || '-'}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300 font-medium">
                    {job.technician || '-'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 bg-amber-500/5">
                    ฿{(job.totalCost || 0).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center sticky right-0 bg-slate-900 z-10 border-l border-slate-800">
                    <button
                      onClick={() => onViewJob(job)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-850/90 border-t border-slate-750 flex items-center justify-between text-xs text-slate-400">
          <span>รวมทั้งหมด <strong className="text-white">{sortedJobs.length}</strong> รายการ</span>
          <span className="font-mono text-sm">
            ยอดค่าใช้จ่ายรวมทั้งหมด: <strong className="text-amber-400">฿{sortedJobs.reduce((sum, j) => sum + (j.totalCost || 0), 0).toLocaleString()}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
