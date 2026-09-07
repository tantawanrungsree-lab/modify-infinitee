import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  FileCheck
} from 'lucide-react';
import { JobAttachment, ModifyJob } from '../types';

interface AttachmentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: ModifyJob | null;
  attachments?: JobAttachment[];
  jobTitle?: string;
  initialIndex?: number;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  isOpen,
  onClose,
  job,
  attachments: directAttachments,
  jobTitle: directJobTitle,
  initialIndex = 0,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const effectiveAttachments = directAttachments || job?.attachments || [];
  const effectiveTitle = directJobTitle || (job ? `${job.soNo} — ${job.projectName}` : 'เอกสารแนบ');

  // Sync index when initialIndex or job/attachments change
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
    setZoomLevel(1);
    setRotation(0);
  }, [initialIndex, isOpen, job, directAttachments]);

  if (!isOpen || effectiveAttachments.length === 0) {
    return null;
  }

  const attachments = effectiveAttachments;
  const currentItem = attachments[currentIndex] || attachments[0];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1));
    setZoomLevel(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0));
    setZoomLevel(1);
    setRotation(0);
  };

  const handleDownload = (item: JobAttachment) => {
    const link = document.createElement('a');
    link.href = item.dataUrl;
    link.download = item.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Topbar */}
        <div className="p-3 md:p-4 bg-slate-850 border-b border-slate-750 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              {currentItem.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h4 className="text-sm md:text-base font-bold text-white truncate" title={currentItem.name}>
                  {currentItem.name}
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {formatSize(currentItem.size)}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase shrink-0">
                  {currentItem.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono truncate">
                {effectiveTitle} ({currentIndex + 1}/{attachments.length})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {currentItem.type === 'image' && (
              <>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  title="ขยายรูปภาพ"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  title="ย่อรูปภาพ"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  title="หมุน 90 องศา"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              onClick={() => handleDownload(currentItem)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition"
              title="ดาวน์โหลดไฟล์ลงเครื่อง"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">ดาวน์โหลด</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Viewport */}
        <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-4">
          {currentItem.type === 'image' ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto scrollbar-thin">
              <img
                src={currentItem.dataUrl}
                alt={currentItem.name}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                }}
              />
            </div>
          ) : (
            /* PDF Document Viewer Container */
            <div className="w-full h-full flex flex-col bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-850 border-b border-slate-750 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5 font-mono">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>PDF Document Viewer: {currentItem.name}</span>
                </span>
                <a
                  href={currentItem.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>เปิดในหน้าต่างใหม่</span>
                </a>
              </div>
              <div className="flex-1 w-full bg-slate-950 flex items-center justify-center">
                <iframe
                  src={currentItem.dataUrl}
                  title={currentItem.name}
                  className="w-full h-full border-0"
                />
              </div>
            </div>
          )}

          {/* Navigation Arrows for multi-attachments */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl transition backdrop-blur"
                title="รูปก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl transition backdrop-blur"
                title="รูปถัดไป"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip at Bottom */}
        {attachments.length > 1 && (
          <div className="p-3 bg-slate-850 border-t border-slate-750 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-thin">
            {attachments.map((att, idx) => (
              <button
                key={att.id}
                onClick={() => {
                  setCurrentIndex(idx);
                  setZoomLevel(1);
                  setRotation(0);
                }}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition shrink-0 flex items-center justify-center ${
                  idx === currentIndex
                    ? 'border-amber-400 scale-105 shadow-md shadow-amber-400/20 bg-slate-800'
                    : 'border-slate-700 opacity-60 hover:opacity-100 bg-slate-900'
                }`}
              >
                {att.type === 'image' ? (
                  <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-[9px] text-rose-400 font-bold">
                    <FileText className="w-6 h-6 mb-0.5" />
                    <span>PDF</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
