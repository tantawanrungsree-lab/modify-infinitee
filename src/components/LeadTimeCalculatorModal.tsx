import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calculator,
  Calendar,
  Layers,
  Wrench,
  Paintbrush,
  Cpu,
  Plus,
  Minus,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Table,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  CalendarDays
} from 'lucide-react';
import { JobCategory, CATEGORY_CONFIG } from '../types';
import {
  calculateLeadTime,
  LeadTimeCalculationResult,
  formatThaiDateString
} from '../lib/leadTimeCalculator';

interface LeadTimeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToNewJob: (data: {
    category: JobCategory;
    receivedDate: string;
    quantity: number;
    estimatedDate: string;
    shipmentDate: string;
    summaryText: string;
  }) => void;
  initialCategory?: JobCategory;
}

interface CriteriaTierRow {
  tierLabel: string;
  minQty: number;
  maxQty: number;
  modifyAddDays: number;
  modifyTotalDays: number;
  paintAddDays: number;
  paintTotalDays: number;
  fabAddDays: number;
  fabTotalDays: number;
}

const CRITERIA_TIERS: CriteriaTierRow[] = [
  { tierLabel: '1 – 10 ชิ้น', minQty: 1, maxQty: 10, modifyAddDays: 1, modifyTotalDays: 11, paintAddDays: 3, paintTotalDays: 13, fabAddDays: 5, fabTotalDays: 15 },
  { tierLabel: '11 – 20 ชิ้น', minQty: 11, maxQty: 20, modifyAddDays: 2, modifyTotalDays: 12, paintAddDays: 2, paintTotalDays: 12, fabAddDays: 2, fabTotalDays: 12 },
  { tierLabel: '21 – 50 ชิ้น', minQty: 21, maxQty: 50, modifyAddDays: 3, modifyTotalDays: 13, paintAddDays: 5, paintTotalDays: 15, fabAddDays: 7, fabTotalDays: 17 },
  { tierLabel: '51 – 100 ชิ้น', minQty: 51, maxQty: 100, modifyAddDays: 7, modifyTotalDays: 17, paintAddDays: 10, paintTotalDays: 20, fabAddDays: 10, fabTotalDays: 20 },
  { tierLabel: '101 – 200 ตัว', minQty: 101, maxQty: 200, modifyAddDays: 10, modifyTotalDays: 20, paintAddDays: 10, paintTotalDays: 20, fabAddDays: 13, fabTotalDays: 23 },
  { tierLabel: '201 ชิ้นขึ้นไป', minQty: 201, maxQty: Infinity, modifyAddDays: 15, modifyTotalDays: 25, paintAddDays: 20, paintTotalDays: 30, fabAddDays: 15, fabTotalDays: 25 },
];

export const LeadTimeCalculatorModal: React.FC<LeadTimeCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyToNewJob,
  initialCategory = 'modify_general',
}) => {
  const [category, setCategory] = useState<JobCategory>(initialCategory);
  
  // Default to today's date in YYYY-MM-DD
  const [soDate, setSoDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Quantity input string state to allow seamless manual typing and backspacing
  const [quantityInput, setQuantityInput] = useState<string>('10');
  const [copied, setCopied] = useState<boolean>(false);
  const [showCriteriaTable, setShowCriteriaTable] = useState<boolean>(false);

  // Derive numeric quantity with minimum of 1
  const quantity = useMemo(() => {
    const parsed = parseInt(quantityInput, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }, [quantityInput]);

  // Sync category when initialCategory changes
  useEffect(() => {
    if (initialCategory && typeof initialCategory === 'string' && (initialCategory === 'modify_general' || initialCategory === 'paint' || initialCategory === 'custom_fabrication')) {
      setCategory(initialCategory);
    }
  }, [initialCategory, isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lead Time Calculation
  const validCategory: JobCategory = (category === 'modify_general' || category === 'paint' || category === 'custom_fabrication') 
    ? category 
    : 'modify_general';

  const result: LeadTimeCalculationResult = useMemo(() => {
    return calculateLeadTime(validCategory, soDate, quantity);
  }, [validCategory, soDate, quantity]);

  // Determine active tier index for live table highlight
  const activeTierIndex = useMemo(() => {
    return CRITERIA_TIERS.findIndex(
      (t) => quantity >= t.minQty && quantity <= t.maxQty
    );
  }, [quantity]);

  if (!isOpen) return null;

  const config = CATEGORY_CONFIG[validCategory] || CATEGORY_CONFIG.modify_general;

  const summaryText = `[คำนวณ Lead Time: ${config.title}] จำนวน ${quantity} ชิ้น | วันทำการรวม ${result.totalWorkingDays} วันทำการ (ฐาน SO 10 วัน + เพิ่ม ${result.additionalWorkingDays} วัน) | รับ SO: ${result.soReceivedDate} -> พร้อมส่งมอบ (Shipment Date): ${result.estimatedFinishDate}`;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyToNewJob({
      category,
      receivedDate: soDate,
      quantity,
      estimatedDate: result.estimatedFinishDate,
      shipmentDate: result.estimatedFinishDate,
      summaryText,
    });
    onClose();
  };

  const PRESET_QUANTITIES = [5, 15, 30, 75, 150, 250];

  return (
    <div 
      id="lead-time-calculator-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        id="lead-time-calculator-modal"
        className={`relative w-full ${showCriteriaTable ? 'max-w-5xl' : 'max-w-3xl'} bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-750 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  ระบบคำนวณระยะเวลา Modify (Lead Time Calculator)
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  เกณฑ์มาตรฐาน BRZ LUMENCRAFT
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                สูตรทางการ: วันที่รับ SO + ฐาน 10 วันทำการ + วันเพิ่มตามจำนวนชิ้นงาน (ข้ามวันหยุดเสาร์-อาทิตย์และวันหยุดนักขัตฤกษ์)
              </p>
            </div>
          </div>

          <button
            id="lead-time-modal-close-x-btn"
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-slate-200">
          <div className={`grid grid-cols-1 ${showCriteriaTable ? 'lg:grid-cols-12 gap-5' : 'gap-4'} items-start`}>
            
            {/* Form Controls & Summary Output */}
            <div className={`${showCriteriaTable ? 'lg:col-span-6' : 'w-full'} space-y-4`}>
              {/* Step 1: Category Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>1. เลือกประเภทงาน</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Modify General */}
                  <button
                    type="button"
                    onClick={() => setCategory('modify_general')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      category === 'modify_general'
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 ring-1 ring-amber-500'
                        : 'bg-slate-850 border-slate-750 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-amber-400 shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold truncate">1. Modify ทั่วไป</div>
                    </div>
                    <div className="text-[10px] text-slate-400">ฐาน 10 วันทำการ</div>
                  </button>

                  {/* Paint Work */}
                  <button
                    type="button"
                    onClick={() => setCategory('paint')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      category === 'paint'
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                        : 'bg-slate-850 border-slate-750 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-cyan-400 shrink-0">
                        <Paintbrush className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold truncate">2. งานพ่นสี</div>
                    </div>
                    <div className="text-[10px] text-slate-400">ฐาน 10 วันทำการ</div>
                  </button>

                  {/* Custom Fabrication */}
                  <button
                    type="button"
                    onClick={() => setCategory('custom_fabrication')}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                      category === 'custom_fabrication'
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : 'bg-slate-850 border-slate-750 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-bold truncate">3. งานประดิษฐ์</div>
                    </div>
                    <div className="text-[10px] text-slate-400">ฐาน 10 วันทำการ</div>
                  </button>
                </div>
              </div>

              {/* Step 2 & 3: SO Date & Quantity Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 2. SO Received Date */}
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span>2. วันที่ได้รับ SO</span>
                  </label>

                  <input
                    id="lead-time-so-date-input"
                    type="date"
                    value={soDate}
                    onChange={(e) => setSoDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 text-sm text-white font-mono font-bold px-3 py-2 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* 3. จำนวนชิ้นงาน (Quantity) */}
                <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>3. จำนวนชิ้นงาน</span>
                    </label>
                    <span className="text-xs text-amber-300 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                      {quantity.toLocaleString()} ชิ้น
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setQuantityInput(String(Math.max(1, quantity - 1)))}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 font-bold transition cursor-pointer"
                      title="ลดทีละ 1 ชิ้น"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>

                    <div className="relative flex-1">
                      <input
                        id="lead-time-quantity-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={quantityInput}
                        onChange={(e) => {
                          const cleanVal = e.target.value.replace(/[^0-9]/g, '');
                          setQuantityInput(cleanVal);
                        }}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                          if (!quantityInput || parseInt(quantityInput, 10) < 1) {
                            setQuantityInput('1');
                          }
                        }}
                        placeholder="พิมพ์จำนวน"
                        className="w-full bg-slate-800 border border-slate-700 text-center text-lg font-bold text-amber-300 font-mono px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => setQuantityInput(String(quantity + 1))}
                      className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-slate-750 active:scale-95 border border-slate-700 flex items-center justify-center text-slate-200 font-bold transition cursor-pointer"
                      title="เพิ่มทีละ 1 ชิ้น"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {PRESET_QUANTITIES.map((qty) => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setQuantityInput(String(qty))}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border transition cursor-pointer ${
                          quantity === qty
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary Highlight Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-850 to-slate-900 border border-amber-500/40 shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-750 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      สรุปผลการคำนวณ Lead Time
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    รวม {result.totalWorkingDays} วันทำการ
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>วันพร้อมส่งมอบงานประมาณการ (Estimated Shipment Date)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight">
                    {result.estimatedFinishDate}
                  </div>
                  <div className="text-xs font-semibold text-emerald-300 pt-0.5 flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>{formatThaiDateString(new Date(result.estimatedFinishDate))}</span>
                  </div>
                </div>

                {/* Step Breakdown */}
                <div className="pt-2 border-t border-slate-750 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">1. วันที่ได้รับ SO:</span>
                    <span className="font-mono font-bold text-white">{result.soReceivedDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">2. ฐานตั้งต้นมาตรฐาน:</span>
                    <span className="font-mono font-bold text-cyan-300">+10 วันทำการ</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">3. เพิ่มตามจำนวน ({quantity} ชิ้น):</span>
                    <span className="font-mono font-bold text-amber-300">+{result.additionalWorkingDays} วันทำการ ({result.tierDescription})</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-800 pt-1">
                    <span className="text-slate-400">วันหยุดที่ตรวจพบและข้าม:</span>
                    <span className="font-mono text-[11px] text-slate-300">
                      ส.-อา. {result.totalWeekendsSkipped} วัน | วันหยุดราชการ {result.totalHolidaysSkipped} วัน
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copied ? 'คัดลอกข้อความสรุปแล้ว!' : 'คัดลอกข้อความสรุป'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCriteriaTable(!showCriteriaTable)}
                    className="py-1.5 px-3 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center justify-center gap-1 transition cursor-pointer"
                    title="แสดง/ซ่อนตารางเกณฑ์คำนวณ"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>{showCriteriaTable ? 'ซ่อนตารางเกณฑ์' : 'ดูตารางเกณฑ์'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Collapsible Criteria Table (Hidden by default) */}
            {showCriteriaTable && (
              <div className="lg:col-span-6 space-y-3 pt-2 lg:pt-0">
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <Table className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      ตารางเกณฑ์คำนวณ Lead Time มาตรฐาน
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-300 font-medium bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {quantity} ชิ้น
                  </span>
                </div>

                {/* Matrix Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-750 bg-slate-850/60 shadow-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/95 text-slate-300 border-b border-slate-750">
                        <th className="py-2.5 px-3 font-bold text-slate-200">
                          จำนวน
                        </th>
                        <th className={`py-2.5 px-3 font-bold transition ${category === 'modify_general' ? 'text-amber-300 bg-amber-500/15' : 'text-slate-300'}`}>
                          1. ทั่วไป
                        </th>
                        <th className={`py-2.5 px-3 font-bold transition ${category === 'paint' ? 'text-cyan-300 bg-cyan-500/15' : 'text-slate-300'}`}>
                          2. พ่นสี
                        </th>
                        <th className={`py-2.5 px-3 font-bold transition ${category === 'custom_fabrication' ? 'text-emerald-300 bg-emerald-500/15' : 'text-slate-300'}`}>
                          3. ประดิษฐ์
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-750/70 font-mono">
                      {CRITERIA_TIERS.map((tier, idx) => {
                        const isCurrentTier = idx === activeTierIndex;
                        return (
                          <tr
                            key={tier.tierLabel}
                            className={`transition-colors ${
                              isCurrentTier
                                ? 'bg-amber-500/20 font-bold text-white ring-1 ring-inset ring-amber-500/60'
                                : 'hover:bg-slate-800/50 text-slate-300'
                            }`}
                          >
                            <td className="py-2 px-3 font-sans">
                              <span className={isCurrentTier ? 'text-amber-300 font-bold' : 'text-slate-200'}>
                                {tier.tierLabel}
                              </span>
                            </td>
                            <td className={`py-2 px-3 ${category === 'modify_general' ? (isCurrentTier ? 'bg-amber-500/25 text-amber-300 font-bold' : 'bg-amber-500/10 text-amber-200') : ''}`}>
                              +{tier.modifyAddDays} วัน ({tier.modifyTotalDays})
                            </td>
                            <td className={`py-2 px-3 ${category === 'paint' ? (isCurrentTier ? 'bg-cyan-500/25 text-cyan-300 font-bold' : 'bg-cyan-500/10 text-cyan-200') : ''}`}>
                              +{tier.paintAddDays} วัน ({tier.paintTotalDays})
                            </td>
                            <td className={`py-2 px-3 ${category === 'custom_fabrication' ? (isCurrentTier ? 'bg-emerald-500/25 text-emerald-300 font-bold' : 'bg-emerald-500/10 text-emerald-200') : ''}`}>
                              +{tier.fabAddDays} วัน ({tier.fabTotalDays})
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 sm:p-5 bg-slate-850 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-400">
            วันพร้อมส่งมอบงานประมาณการ: <strong className="text-amber-300 font-mono text-sm ml-1">{result.estimatedFinishDate}</strong>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              id="lead-time-modal-close-btn"
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 border border-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>

            <button
              id="lead-time-modal-apply-btn"
              type="button"
              onClick={handleApply}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition transform active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>สร้าง Job ด้วยค่าที่คำนวณได้</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
