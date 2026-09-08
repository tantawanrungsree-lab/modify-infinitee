import React from 'react';
import { 
  Bell, 
  Flame, 
  Search, 
  Layers, 
  FileSpreadsheet, 
  User as UserIcon, 
  LogIn, 
  LogOut, 
  Plus, 
  AlertTriangle,
  RefreshCw,
  Database,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { UserProfile, DeadlineAlertItem } from '../types';

interface NavbarProps {
  urgentAlerts: DeadlineAlertItem[];
  user: UserProfile | null;
  onOpenNewJob: () => void;
  onOpenAlerts: () => void;
  onOpenSheetsModal: () => void;
  onOpenLoginModal: () => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isSyncing: boolean;
  onManualSync: () => void;
  firebaseOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  urgentAlerts,
  user,
  onOpenNewJob,
  onOpenAlerts,
  onOpenSheetsModal,
  onOpenLoginModal,
  onLogout,
  searchQuery,
  onSearchChange,
  isSyncing,
  onManualSync,
  firebaseOnline,
}) => {
  const urgentCount = urgentAlerts.length;

  return (
    <header className="h-16 bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between gap-4">
      {/* Brand & System Identity */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black shadow-lg shadow-amber-500/20">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Modify Process</span>
              <span className="text-amber-400 font-extrabold">BRZ LUMENCRAFT</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              v2.6 Enterprise
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              Firebase: <span className="text-cyan-300 font-medium">Modify infinite</span>
            </span>
            <span>•</span>
            <span className={firebaseOnline ? "text-emerald-400 font-medium flex items-center gap-1" : "text-amber-400"}>
              {firebaseOnline ? "Cloud Firestore Sync" : "Local Cached Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Global Quick Search */}
      <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหา SO No., ECR, Project Name/Code, ช่าง, ลูกค้า..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700 text-sm text-slate-100 pl-9 pr-4 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white bg-slate-700 px-1.5 py-0.5 rounded"
            >
              ล้าง
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons & Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* 1-Day Advance Deadline Alert Button */}
        <button
          onClick={onOpenAlerts}
          title="แจ้งเตือนก่อนถึงกำหนด 1 วัน"
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition border ${
            urgentCount > 0
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 hover:bg-rose-500/25 animate-pulse'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Bell className={`w-4 h-4 ${urgentCount > 0 ? 'text-rose-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">แจ้งเตือนเร่งด่วน</span>
          {urgentCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold rounded-full bg-rose-500 text-white">
              {urgentCount}
            </span>
          )}
        </button>

        {/* Quick New Job Button */}
        <button
          onClick={onOpenNewJob}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs md:text-sm rounded-lg transition shadow-md shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>New Job</span>
        </button>

        {/* Auth / User Section */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName} 
                className="w-8 h-8 rounded-full border border-amber-500/50"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 text-xs font-bold">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="hidden xl:block text-left">
              <div className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                {user.displayName}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user.email}
              </div>
            </div>
            <button
              onClick={onLogout}
              title="ออกจากระบบ"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenLoginModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs md:text-sm font-medium rounded-lg transition cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">เข้าสู่ระบบ</span>
          </button>
        )}
      </div>
    </header>
  );
};
