import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Layers, 
  Wrench, 
  Paintbrush, 
  Cpu, 
  ReceiptText 
} from 'lucide-react';
import { ModifyJob, CATEGORY_CONFIG } from '../types';
import { SHEET_COLUMNS, jobToRowArray, exportJobsToCSV, generateGoogleSheetsPayload } from '../lib/googleSheetsSync';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: ModifyJob[];
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  jobs,
}) => {
  const [selectedSheet, setSelectedSheet] = useState<string>('งาน Modify ทั่วไป');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toLocaleTimeString('th-TH'));

  if (!isOpen) return null;

  const modifyGeneralJobs = jobs.filter(j => j.category === 'modify_general');
  const paintJobs = jobs.filter(j => j.category === 'paint');
  const customFabJobs = jobs.filter(j => j.category === 'custom_fabrication');

  const getSheetJobs = (sheet: string) => {
    switch (sheet) {
      case 'งาน Modify ทั่วไป':
        return modifyGeneralJobs;
      case 'งานพ่นสี':
        return paintJobs;
      case 'งานประยุกต์ประดิษฐ์':
        return customFabJobs;
      case 'สรุปค่าใช้จ่าย':
      default:
        return jobs;
    }
  };

  const currentJobs = getSheetJobs(selectedSheet);

  const copySheetDataForGoogleSheets = () => {
    const rows = [
      SHEET_COLUMNS,
      ...currentJobs.map(jobToRowArray)
    ];
    const tsv = rows.map(r => r.join('\t')).join('\n');
    navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSimulateSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime(new Date().toLocaleTimeString('th-TH'));
    }, 1200);
  };

  const sheetsList = [
    { name: 'งาน Modify ทั่วไป', icon: Wrench, count: modifyGeneralJobs.length, color: 'text-amber-400' },
    { name: 'งานพ่นสี', icon: Paintbrush, count: paintJobs.length, color: 'text-cyan-400' },
    { name: 'งานประยุกต์ประดิษฐ์', icon: Cpu, count: customFabJobs.length, color: 'text-emerald-400' },
    { name: 'สรุปค่าใช้จ่าย', icon: ReceiptText, count: jobs.length, color: 'text-indigo-400' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Header */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Google Sheets Synchronization Center</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  Live Connect
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                ระบบแยกจัดเก็บข้อมูลอัตโนมัติตาม Sheet ปลายทาง 4 แผ่นงาน พร้อมตารางคอลัมน์มาตรฐาน
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

        {/* Sheet Tabs Selector */}
        <div className="p-3 bg-slate-850 border-b border-slate-750 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {sheetsList.map((item) => {
              const Icon = item.icon;
              const isActive = selectedSheet === item.name;

              return (
                <button
                  key={item.name}
                  onClick={() => setSelectedSheet(item.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                  <span>{item.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] text-slate-300 font-mono">
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span>{isSyncing ? 'กำลังซิงค์...' : `ซิงค์ล่าสุด ${lastSyncTime}`}</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar for selected sheet */}
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="text-slate-300 font-medium">
            แผ่นงาน: <strong className="text-emerald-300">{selectedSheet}</strong> ({currentJobs.length} แถวข้อมูล)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copySheetDataForGoogleSheets}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'คัดลอกตารางแล้ว! (ไปวางใน Sheets ได้เลย)' : 'คัดลอกตาราง (Copy for Google Sheets)'}</span>
            </button>

            <button
              onClick={() => exportJobsToCSV(currentJobs, selectedSheet)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg font-bold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด CSV ของหน้านี้</span>
            </button>
          </div>
        </div>

        {/* Live Sheet Preview Table */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] scrollbar-thin scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-[11px] min-w-[1200px]">
                <thead className="bg-slate-850 sticky top-0 border-b border-slate-750 text-slate-400 font-bold uppercase">
                  <tr>
                    {SHEET_COLUMNS.slice(0, 14).map((col, idx) => (
                      <th key={idx} className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-slate-300">
                  {currentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="py-8 text-center text-slate-400">
                        ไม่มีข้อมูลใน Sheet นี้
                      </td>
                    </tr>
                  ) : (
                    currentJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-900 transition font-mono">
                        <td className="py-2 px-3 text-slate-400">{job.seqNo}</td>
                        <td className="py-2 px-3 text-slate-300">{job.ecrNo || '-'}</td>
                        <td className="py-2 px-3 font-sans text-slate-300">{job.salesOwner || '-'}</td>
                        <td className="py-2 px-3 font-sans text-slate-400">{job.storeRequester || '-'}</td>
                        <td className="py-2 px-3 font-bold text-amber-300">{job.soNo}</td>
                        <td className="py-2 px-3 text-amber-400">{job.projectCode}</td>
                        <td className="py-2 px-3 font-sans font-semibold text-slate-200 line-clamp-1">{job.projectName}</td>
                        <td className="py-2 px-3 font-sans text-slate-300 line-clamp-1">{job.customerName}</td>
                        <td className="py-2 px-3 font-sans text-slate-400 line-clamp-1 max-w-[200px]">{job.jobDescription}</td>
                        <td className="py-2 px-3 text-slate-400">{job.receivedDate}</td>
                        <td className="py-2 px-3 font-bold text-slate-200">{job.shipmentDate}</td>
                        <td className="py-2 px-3 text-slate-400">{job.estimatedDate || '-'}</td>
                        <td className="py-2 px-3 font-sans">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-200">
                            {job.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-sans text-cyan-300">{job.technician || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Integration Info Box */}
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 text-xs text-slate-300 space-y-1">
            <div className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Sheets Webhook & App Script API Payload</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              ข้อมูลทั้ง 4 แผ่นงานถูกจัดโครงสร้างให้เชื่อมต่อกับ Google Apps Script Webhook หรือ Google Sheets API แบบเรียลไทม์ได้ทันที โดยจัดหมวดหมู่อัตโนมัติเมื่อสร้าง New Job
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-750 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Firebase Project: <strong className="text-cyan-300">Modify infinite</strong>
          </span>
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
