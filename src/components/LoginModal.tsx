import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  User, 
  Key, 
  Sparkles,
  Database
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithGoogle } from '../lib/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const fbUser = await loginWithGoogle();
      if (fbUser) {
        onLoginSuccess({
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Staff Member',
          email: fbUser.email || 'staff@lumencraft.co.th',
          photoURL: fbUser.photoURL || undefined,
          role: 'Admin / Engineer',
          department: 'Modify Process Engineering'
        });
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'ไม่สามารถเชื่อมต่อ Google Login ได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  // Quick staff login helper
  const handleQuickLogin = (name: string, email: string, role: string, dept: string) => {
    onLoginSuccess({
      uid: `user-${Date.now()}`,
      displayName: name,
      email,
      role,
      department: dept
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                เข้าสู่ระบบ Modify Process
              </h3>
              <p className="text-xs text-slate-400">
                BRZ LUMENCRAFT • Firebase: Modify infinite
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs leading-relaxed">
              {error}
            </div>
          )}

          {/* Shared Central Database Reassurance */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <Database className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-amber-300">ฐานข้อมูลกลางหนึ่งเดียว (Central Shared Database):</span> ทุกบัญชี Gmail ที่ล็อกอินใช้งาน จะเชื่อมต่อและเห็นข้อมูลงานในฐานข้อมูล Cloud Firestore ก้อนเดียวกันทั้งหมดแบบ Real-time
            </div>
          </div>

          {/* Primary Google Login Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-white/10 transition transform active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loading ? 'กำลังเชื่อมต่อ Google...' : 'Sign in with Google'}</span>
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-3 text-xs text-slate-400 font-medium">หรือเข้าสู่ระบบด่วนตามตำแหน่งงาน</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          {/* Quick Staff Login Options */}
          <div className="space-y-2">
            <button
              onClick={() => handleQuickLogin('คุณกิตติศักดิ์ (Project Sales)', 'kittisak@lumencraft.co.th', 'Project Sales', 'แผนกขายโครงการ')}
              className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-xs">
                  K
                </div>
                <div>
                  <div className="font-semibold text-white">คุณกิตติศักดิ์ (Project Sales)</div>
                  <div className="text-[11px] text-slate-400">แผนกขายโครงการ • BRZ</div>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-medium">เลือกบัญชีนี้</span>
            </button>

            <button
              onClick={() => handleQuickLogin('ช่างปรีชา (หัวหน้าช่างเทคนิค)', 'preecha@lumencraft.co.th', 'Chief Technician', 'ฝ่ายผลิตและโมดิฟายด์')}
              className="w-full p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left transition flex items-center justify-between text-xs cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center text-xs">
                  P
                </div>
                <div>
                  <div className="font-semibold text-white">ช่างปรีชา (หัวหน้าช่าง)</div>
                  <div className="text-[11px] text-slate-400">ฝ่ายผลิตและโมดิฟายด์ • BRZ</div>
                </div>
              </div>
              <span className="text-[10px] text-cyan-400 font-medium">เลือกบัญชีนี้</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 text-center text-xs text-slate-400">
          ระบบความปลอดภัยเชื่อมต่อ Google Identity & Firebase Auth
        </div>
      </div>
    </div>
  );
};
