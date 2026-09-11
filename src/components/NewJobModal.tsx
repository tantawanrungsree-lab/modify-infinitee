import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  PlusCircle, 
  Wrench, 
  Paintbrush, 
  Cpu, 
  Calendar, 
  User, 
  Building2, 
  FileText, 
  DollarSign, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Sparkles,
  KeyRound,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Paperclip,
  Eye,
  Info,
  FileCheck,
  Calculator
} from 'lucide-react';
import { ModifyJob, JobCategory, JobStatus, CATEGORY_CONFIG, UserProfile, JobAttachment } from '../types';

interface NewJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveJob: (jobData: Omit<ModifyJob, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialCategory?: JobCategory;
  existingJobs: ModifyJob[];
  user: UserProfile | null;
  editingJob?: ModifyJob | null;
  prefillData?: {
    category?: JobCategory;
    receivedDate?: string;
    shipmentDate?: string;
    estimatedDate?: string;
    jobDescription?: string;
    notes?: string;
    quantity?: number;
  } | null;
  onOpenLeadTimeCalculator?: () => void;
}

export const NewJobModal: React.FC<NewJobModalProps> = ({
  isOpen,
  onClose,
  onSaveJob,
  initialCategory = 'modify_general',
  existingJobs,
  user,
  editingJob = null,
  prefillData = null,
  onOpenLeadTimeCalculator,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [category, setCategory] = useState<JobCategory>(initialCategory);
  const [seqNo, setSeqNo] = useState<number>(1);
  const [ecrNo, setEcrNo] = useState<string>('');
  const [salesOwner, setSalesOwner] = useState<string>('');
  const [storeRequester, setStoreRequester] = useState<string>('');
  const [soNo, setSoNo] = useState<string>('');
  const [projectCode, setProjectCode] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [receivedDate, setReceivedDate] = useState<string>('');
  const [shipmentDate, setShipmentDate] = useState<string>('');
  const [estimatedDate, setEstimatedDate] = useState<string>('');
  const [status, setStatus] = useState<JobStatus>('รอดำเนินการ');
  const [technician, setTechnician] = useState<string>('');
  const [laborCost, setLaborCost] = useState<number>(0);
  const [materialCost, setMaterialCost] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [attachments, setAttachments] = useState<JobAttachment[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic list of technicians, sales owners, and store requesters from real existing jobs
  const availableTechnicians = React.useMemo(() => {
    const set = new Set<string>();
    existingJobs.forEach(j => {
      if (j.technician?.trim()) set.add(j.technician.trim());
    });
    return Array.from(set);
  }, [existingJobs]);

  const availableSalesOwners = React.useMemo(() => {
    const set = new Set<string>();
    existingJobs.forEach(j => {
      if (j.salesOwner?.trim()) set.add(j.salesOwner.trim());
    });
    return Array.from(set);
  }, [existingJobs]);

  const availableStoreRequesters = React.useMemo(() => {
    const set = new Set<string>();
    existingJobs.forEach(j => {
      if (j.storeRequester?.trim()) set.add(j.storeRequester.trim());
    });
    return Array.from(set);
  }, [existingJobs]);

  useEffect(() => {
    if (isOpen) {
      if (editingJob) {
        setCategory(editingJob.category);
        setSeqNo(editingJob.seqNo);
        setEcrNo(editingJob.ecrNo || '');
        setSalesOwner(editingJob.salesOwner || '');
        setStoreRequester(editingJob.storeRequester || '');
        setSoNo(editingJob.soNo || '');
        setProjectCode(editingJob.projectCode || '');
        setProjectName(editingJob.projectName || '');
        setCustomerName(editingJob.customerName || '');
        setQuantity(editingJob.quantity !== undefined ? editingJob.quantity : '');
        setJobDescription(editingJob.jobDescription || '');
        setReceivedDate(editingJob.receivedDate || '');
        setShipmentDate(editingJob.shipmentDate || '');
        setEstimatedDate(editingJob.estimatedDate || '');
        setStatus(editingJob.status);
        setTechnician(editingJob.technician || '');
        setLaborCost(editingJob.laborCost || 0);
        setMaterialCost(editingJob.materialCost || 0);
        setNotes(editingJob.notes || '');
        setAttachments(editingJob.attachments || []);
      } else {
        const cat = prefillData?.category || initialCategory || 'modify_general';
        setCategory(cat);
        const countInCat = existingJobs.filter(j => j.category === cat).length;
        setSeqNo(countInCat + 1);
        setEcrNo('');
        setSalesOwner('');
        setStoreRequester('');
        setSoNo('');
        setProjectCode('');
        setProjectName('');
        setCustomerName('');
        
        // Check if prefillData provides values from Lead Time Calculator
        if (prefillData) {
          setQuantity(prefillData.quantity !== undefined ? prefillData.quantity : '');
          setJobDescription(prefillData.jobDescription || (prefillData.quantity ? `ปรับแต่ง/ผลิตชิ้นงาน จำนวน ${prefillData.quantity} ชิ้น` : ''));
          setReceivedDate(prefillData.receivedDate || new Date().toISOString().split('T')[0]);
          setShipmentDate(prefillData.shipmentDate || '');
          setEstimatedDate(prefillData.estimatedDate || '');
          setNotes(prefillData.notes || '');
        } else {
          setQuantity('');
          setJobDescription('');
          const today = new Date().toISOString().split('T')[0];
          setReceivedDate(today);
          setShipmentDate('');
          setEstimatedDate('');
          setNotes('');
        }
        
        setStatus('รอดำเนินการ');
        setTechnician('');
        setLaborCost(0);
        setMaterialCost(0);
        setAttachments([]);
      }
      setUploadError(null);
      setErrors({});
    }
  }, [isOpen, editingJob, initialCategory, existingJobs, prefillData]);

  // When category changes in create mode, update seqNo
  const handleCategoryChange = (newCat: JobCategory) => {
    setCategory(newCat);
    if (!editingJob) {
      const countInCat = existingJobs.filter(j => j.category === newCat).length;
      setSeqNo(countInCat + 1);
    }
  };

  // Process uploaded files (Images & PDFs)
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'];
    const maxFileSize = 15 * 1024 * 1024; // 15MB limit

    Array.from(files).forEach((file) => {
      if (!allowedMimeTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.pdf') && !file.name.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
        setUploadError(`ไฟล์ "${file.name}" ไม่ใช่รูปภาพหรือไฟล์ PDF ที่รองรับ`);
        return;
      }

      if (file.size > maxFileSize) {
        setUploadError(`ไฟล์ "${file.name}" มีขนาดใหญ่เกินไป (จำกัดไม่เกิน 15MB)`);
        return;
      }

      const reader = new FileReader();
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          const newAttachment: JobAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: file.name,
            size: file.size,
            type: isPdf ? 'pdf' : 'image',
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            dataUrl,
            uploadedAt: new Date().toISOString()
          };

          setAttachments((prev) => [...prev, newAttachment]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const validate = () => {
    const err: Record<string, string> = {};
    if (!soNo.trim()) err.soNo = 'กรุณาระบุ SO No. (Primary Key)';
    if (!projectCode.trim()) err.projectCode = 'กรุณาระบุ Project Code (Primary Key)';
    if (!projectName.trim()) err.projectName = 'กรุณาระบุ Project Name (Primary Key)';
    if (!customerName.trim()) err.customerName = 'กรุณาระบุชื่อลูกค้า';
    if (!jobDescription.trim()) err.jobDescription = 'กรุณากรอกรายละเอียดงานที่ต้อง Modify';
    if (!receivedDate) err.receivedDate = 'กรุณาระบุวันที่รับงาน';
    if (!shipmentDate) err.shipmentDate = 'กรุณาระบุ Shipment Date';
    if (!technician.trim()) err.technician = 'กรุณาเลือกช่างผู้รับผิดชอบ';
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const totalCost = Number(laborCost || 0) + Number(materialCost || 0);

    // Rule: Clear attachments if status is Finish ('เสร็จสิ้น')
    const finalAttachments = status === 'เสร็จสิ้น' ? [] : attachments;

    const getAutoCompletedDateTime = (): string => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      return `${y}-${m}-${d} ${hh}:${min}`;
    };

    const finalCompletedDate = status === 'เสร็จสิ้น' 
      ? (editingJob?.completedDate || getAutoCompletedDateTime())
      : undefined;

    onSaveJob({
      seqNo: Number(seqNo) || 1,
      ecrNo: ecrNo.trim(),
      salesOwner: salesOwner.trim(),
      storeRequester: storeRequester.trim(),
      soNo: soNo.trim(),
      projectCode: projectCode.trim(),
      projectName: projectName.trim(),
      customerName: customerName.trim(),
      quantity: quantity !== '' ? Number(quantity) : undefined,
      jobDescription: jobDescription.trim(),
      receivedDate,
      shipmentDate,
      estimatedDate: estimatedDate || shipmentDate,
      status,
      completedDate: finalCompletedDate,
      technician,
      category,
      laborCost: Number(laborCost || 0),
      materialCost: Number(materialCost || 0),
      totalCost,
      notes: notes.trim(),
      attachments: finalAttachments,
      createdBy: user?.uid || 'guest_user',
      createdByName: user?.displayName || 'เจ้าหน้าที่ BRZ',
      createdByEmail: user?.email || 'staff@lumencraft.co.th',
    });

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 md:p-5 bg-slate-850 border-b border-slate-750 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{editingJob ? 'แก้ไขข้อมูลงาน Modify' : 'สร้างงานใหม่ (New Job Form)'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  BRZ LUMENCRAFT
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                เลือกประเภทงานเพื่อจัดเก็บลง Google Sheet และ Firestore ของแผนกนั้นโดยอัตโนมัติ
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 overflow-y-auto space-y-6">
          {/* Work Category Selector (ตัวบ่งชี้ว่าจะไปเก็บ Sheet ไหน) */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>1. เลือกประเภทงาน (ตัวบ่งชี้ Sheet ปลายทาง) *</span>
              </span>
              <span className="text-[11px] text-amber-400 font-normal">
                บันทึกลง: {CATEGORY_CONFIG[category].sheetName}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Modify ทั่วไป */}
              <button
                type="button"
                onClick={() => handleCategoryChange('modify_general')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  category === 'modify_general'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white">งาน Modify ทั่วไป</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    ปรับขนาด ดัดแปลงโครงสร้างโคมไฟ
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono mt-1">
                    ➡️ Sheet_Modify_General
                  </div>
                </div>
              </button>

              {/* Option 2: งานพ่นสี */}
              <button
                type="button"
                onClick={() => handleCategoryChange('paint')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  category === 'paint'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Paintbrush className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white">งานพ่นสี</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Powder Coating, สีอบ, สีพิเศษ
                  </div>
                  <div className="text-[10px] text-cyan-400 font-mono mt-1">
                    ➡️ Sheet_Paint_Process
                  </div>
                </div>
              </button>

              {/* Option 3: งานประยุกต์ประดิษฐ์ */}
              <button
                type="button"
                onClick={() => handleCategoryChange('custom_fabrication')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  category === 'custom_fabrication'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm text-white">งานประยุกต์ประดิษฐ์</div>
                  <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                    Custom Bracket, วงจรพิเศษ
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-1">
                    ➡️ Sheet_Custom_Fabrication
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Primary Keys Section (Highlight) */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>2. ข้อมูลระบุตัวตนหลัก (Primary Keys) *</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* SO No. */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  SO No. (Sales Order) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น SO-690124"
                  value={soNo}
                  onChange={(e) => setSoNo(e.target.value)}
                  className={`w-full bg-slate-900 border ${errors.soNo ? 'border-rose-500' : 'border-slate-700'} text-sm text-amber-300 font-mono font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
                />
                {errors.soNo && <p className="text-[11px] text-rose-400 mt-1">{errors.soNo}</p>}
              </div>

              {/* Project Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Project Code *
                </label>
                <input
                  type="text"
                  placeholder="เช่น PRJ-ICON-LUX"
                  value={projectCode}
                  onChange={(e) => setProjectCode(e.target.value)}
                  className={`w-full bg-slate-900 border ${errors.projectCode ? 'border-rose-500' : 'border-slate-700'} text-sm text-amber-300 font-mono font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
                />
                {errors.projectCode && <p className="text-[11px] text-rose-400 mt-1">{errors.projectCode}</p>}
              </div>

              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Project Name (ชื่อโครงการ) *
                </label>
                <input
                  type="text"
                  placeholder="เช่น ICONSIAM Residence"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className={`w-full bg-slate-900 border ${errors.projectName ? 'border-rose-500' : 'border-slate-700'} text-sm text-white font-semibold px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
                />
                {errors.projectName && <p className="text-[11px] text-rose-400 mt-1">{errors.projectName}</p>}
              </div>
            </div>
          </div>

          {/* Reference & Request Info */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* ลำดับที่ */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">ลำดับที่</label>
              <input
                type="number"
                value={seqNo}
                onChange={(e) => setSeqNo(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* ECR No. */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">ECR No. (แบบขอเปลี่ยน)</label>
              <input
                type="text"
                placeholder="เช่น ECR-2026-089"
                value={ecrNo}
                onChange={(e) => setEcrNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* เซลล์เจ้าของงาน */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">เซลล์เจ้าของงาน</label>
              <input
                type="text"
                list="sales-list"
                placeholder="ระบุชื่อเซลล์"
                value={salesOwner}
                onChange={(e) => setSalesOwner(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <datalist id="sales-list">
                {availableSalesOwners.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            {/* สโตร์ผู้ร้องขอ */}
            <div>
              <label className="block text-xs text-slate-300 mb-1">สโตร์ผู้ร้องขอ</label>
              <input
                type="text"
                list="store-list"
                placeholder="ระบุสโตร์"
                value={storeRequester}
                onChange={(e) => setStoreRequester(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
              <datalist id="store-list">
                {availableStoreRequesters.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>

          {/* Customer Name & Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                ชื่อลูกค้า / บริษัทผู้สั่งซื้อ *
              </label>
              <input
                type="text"
                placeholder="เช่น บริษัท แมกโนเลีย ควอลิตี้ ดีเวล็อปเม้นต์ จำกัด"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full bg-slate-800 border ${errors.customerName ? 'border-rose-500' : 'border-slate-700'} text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
              />
              {errors.customerName && <p className="text-[11px] text-rose-400 mt-1">{errors.customerName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-amber-300 mb-1">
                จำนวนสินค้า / ชิ้นงาน (ชิ้น)
              </label>
              <input
                type="number"
                min="1"
                placeholder="เช่น 10, 50, 100"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-amber-300 font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Job Description (5 Lines) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-200">
                รายละเอียดงาน Modify / ข้อกำหนดเทคนิค (5 บรรทัด) *
              </label>
              <span className="text-[11px] text-slate-400">กรอกรายละเอียดขั้นตอนและสเปกงาน</span>
            </div>
            <textarea
              rows={5}
              placeholder="1. สเปกชิ้นงาน / รุ่นโคมไฟ&#10;2. การตัดแต่งโครงสร้าง / ดัดแปลงมิติ&#10;3. งานระบบไฟฟ้า / ไดร์เวอร์ / DALI&#10;4. กระบวนการพ่นสี / เบอร์สี RAL หรือสีพิเศษ&#10;5. จุดยึด ขาแขวน อุปกรณ์เสริม และข้อกำหนดพิเศษ"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className={`w-full bg-slate-800 border ${errors.jobDescription ? 'border-rose-500' : 'border-slate-700'} text-sm text-slate-100 p-3 rounded-lg focus:outline-none focus:border-amber-500 leading-relaxed font-sans`}
            />
            {errors.jobDescription && <p className="text-[11px] text-rose-400 mt-1">{errors.jobDescription}</p>}
          </div>

          {/* FILE & IMAGE UPLOAD SECTION (PDF & IMAGES) */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <Paperclip className="w-4 h-4 text-amber-400" />
                <span>3. รูปภาพหรือไฟล์ประกอบ (อัพโหลด PDF และรูปภาพจากเครื่อง)</span>
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>ไฟล์จะถูกลบอัตโนมัติเมื่อสถานะงานเป็น "เสร็จสิ้น"</span>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drop Zone & Upload Trigger Button */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                isDragging
                  ? 'border-amber-400 bg-amber-500/10'
                  : 'border-slate-700 hover:border-amber-500/60 bg-slate-900/60 hover:bg-slate-850'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  คลิกเพื่อเลือกไฟล์จากเครื่อง หรือลากไฟล์มาวางที่นี่
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  รองรับไฟล์รูปภาพ (<span className="text-slate-300">JPG, PNG, WEBP, GIF, SVG</span>) และเอกสาร (<span className="text-slate-300">PDF</span>)
                </p>
              </div>
              <button
                type="button"
                className="mt-1 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-semibold transition"
              >
                + เลือกไฟล์จากเครื่อง (Upload Files)
              </button>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Uploaded Files Preview Grid */}
            {attachments.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs text-slate-400 flex items-center justify-between">
                  <span>ไฟล์ที่แนบแล้ว ({attachments.length} รายการ):</span>
                  <button
                    type="button"
                    onClick={() => setAttachments([])}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    ลบทั้งหมด
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-750 flex items-center gap-2.5 group relative hover:border-slate-600 transition"
                    >
                      {/* Thumbnail preview */}
                      <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                        {att.type === 'image' ? (
                          <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-rose-400">
                            <FileText className="w-5 h-5" />
                            <span className="text-[8px] font-bold mt-0.5">PDF</span>
                          </div>
                        )}
                      </div>

                      {/* File Details */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="text-xs font-semibold text-slate-200 truncate" title={att.name}>
                          {att.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                          <span>{formatFileSize(att.size)}</span>
                          <span>•</span>
                          <span className="uppercase text-amber-400 font-bold">{att.type}</span>
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(att.id)}
                        title="ลบไฟล์นี้"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Dates & Timeline (with 1-Day Advance Warning logic) */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>กำหนดเวลาและการส่งมอบ (มีระบบแจ้งเตือนก่อน 1 วัน)</span>
              </span>
              <span className="text-[11px] text-cyan-300 font-normal">
                แจ้งเตือนอัตโนมัติเมื่อใกล้ถึง Shipment Date
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* วันที่รับงาน */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">วันที่รับงาน *</label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className={`w-full bg-slate-800 border ${errors.receivedDate ? 'border-rose-500' : 'border-slate-700'} text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
                />
              </div>

              {/* Shipment Date */}
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1">
                  Shipment Date (วันส่งมอบ) *
                </label>
                <input
                  type="date"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  className={`w-full bg-slate-800 border ${errors.shipmentDate ? 'border-rose-500' : 'border-amber-500/50'} text-sm text-amber-300 font-mono font-bold px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
                />
              </div>

              {/* วันที่ประมาณการ */}
              <div>
                <label className="block text-xs text-slate-300 mb-1">วันที่ประมาณการแล้วเสร็จ</label>
                <input
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Status & Technician Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status งาน */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Status งาน (สถานะปัจจุบัน) *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="รอดำเนินการ">รอดำเนินการ (Pending)</option>
                <option value="กำลังดำเนินการ">กำลังดำเนินการ (In Progress)</option>
                <option value="รอตรวจรับ">รอตรวจรับ (Quality Inspection)</option>
                <option value="เสร็จสิ้น">เสร็จสิ้น (Completed - ไฟล์แนบจะถูกลบอัตโนมัติ)</option>
                <option value="ยกเลิก">ยกเลิก (Cancelled)</option>
              </select>
              {status === 'เสร็จสิ้น' && (
                <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  <span>เมื่อบันทึกสถานะ "เสร็จสิ้น" รูปภาพและไฟล์ประกอบจะถูกล้างอัตโนมัติ</span>
                </p>
              )}
            </div>

            {/* ช่างที่ทำ / ผู้รับผิดชอบ */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                ช่างที่ทำ / ช่างผู้รับผิดชอบ *
              </label>
              <input
                type="text"
                list="tech-list"
                placeholder="เลือกหรือพิมพ์ชื่อช่าง"
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className={`w-full bg-slate-800 border ${errors.technician ? 'border-rose-500' : 'border-slate-700'} text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500`}
              />
              <datalist id="tech-list">
                {availableTechnicians.map(t => <option key={t} value={t} />)}
              </datalist>
              {errors.technician && <p className="text-[11px] text-rose-400 mt-1">{errors.technician}</p>}
            </div>
          </div>

          {/* Costs & Financials */}
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>ประมาณการค่าใช้จ่าย (คำนวณเข้าหน้าสรุปค่าใช้จ่าย)</span>
              </span>
              <span className="font-mono text-amber-400 text-sm font-bold">
                รวม: ฿{(Number(laborCost || 0) + Number(materialCost || 0)).toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">ค่าแรงช่าง (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">ค่าวัสดุ / อุปกรณ์ / สี (บาท)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={materialCost}
                  onChange={(e) => setMaterialCost(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs text-slate-300 mb-1">หมายเหตุเพิ่มเติม / ข้อควรระวัง</label>
            <input
              type="text"
              placeholder="เช่น ทดสอบแรงดันไฟ, ลูกค้าขอตัวอย่างสีพ่นก่อนเริ่มงาน 10 ชุด"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-sm text-slate-100 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{editingJob ? 'บันทึกการแก้ไข' : 'บันทึกสร้างงาน (Save Job)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

