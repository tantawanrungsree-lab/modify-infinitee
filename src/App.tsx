import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { JobTable } from './components/JobTable';
import { CostSummaryView } from './components/CostSummaryView';
import { NewJobModal } from './components/NewJobModal';
import { JobDetailModal } from './components/JobDetailModal';
import { DeadlineAlertModal } from './components/DeadlineAlertModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { LoginModal } from './components/LoginModal';
import { LeadTimeCalculatorModal } from './components/LeadTimeCalculatorModal';
import { CalendarView } from './components/CalendarView';
import { JobQueueView } from './components/JobQueueView';
import { ModifyJob, ActiveView, JobCategory, JobStatus, UserProfile, DeadlineAlertItem, CATEGORY_CONFIG } from './types';
import { INITIAL_SAMPLE_JOBS } from './lib/sampleData';
import { db, auth, logoutUser, testFirestoreConnection, saveUserProfile } from './lib/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const STORAGE_KEY = 'BRZ_LUMENCRAFT_JOBS_V2';

const DEFAULT_AUTO_USER: UserProfile = {
  uid: 'brz-admin-user',
  displayName: 'BRZ Staff User',
  email: 'staff@lumencraft.co.th',
  role: 'Production Staff',
  department: 'ฝ่ายผลิตและบริหารจัดการ'
};

const formatCurrentDateTime = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${min}`;
};

export default function App() {
  // Main State - Load existing jobs from localStorage
  const [jobs, setJobs] = useState<ModifyJob[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing stored jobs:', e);
      }
    }
    return INITIAL_SAMPLE_JOBS;
  });

  const [activeView, setActiveView] = useState<ActiveView>('modify_general');
  // Auto-login as BRZ Staff User
  const [user, setUser] = useState<UserProfile | null>(DEFAULT_AUTO_USER);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [firebaseOnline, setFirebaseOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modal States
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState<boolean>(false);
  const [newJobInitialCat, setNewJobInitialCat] = useState<JobCategory>('modify_general');
  const [newJobPrefillData, setNewJobPrefillData] = useState<{
    category?: JobCategory;
    receivedDate?: string;
    shipmentDate?: string;
    estimatedDate?: string;
    jobDescription?: string;
    notes?: string;
    quantity?: number;
  } | null>(null);
  const [editingJob, setEditingJob] = useState<ModifyJob | null>(null);
  const [viewingJob, setViewingJob] = useState<ModifyJob | null>(null);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState<boolean>(false);
  const [isSheetsModalOpen, setIsSheetsModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLeadTimeModalOpen, setIsLeadTimeModalOpen] = useState<boolean>(false);
  const [leadTimeInitialCat, setLeadTimeInitialCat] = useState<JobCategory>('modify_general');

  // Save to localStorage whenever jobs change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  }, [jobs]);

  // Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const profile: UserProfile = {
          uid: fbUser.uid,
          displayName: fbUser.displayName || 'Staff Member',
          email: fbUser.email || 'staff@lumencraft.co.th',
          photoURL: fbUser.photoURL || undefined,
          role: 'Admin / Engineer',
          department: 'Modify Process Engineering'
        };
        setUser(profile);
        saveUserProfile(profile);
      }
    });

    testFirestoreConnection().then((connected) => {
      setFirebaseOnline(connected);
    });

    return () => unsubscribe();
  }, []);

  // Firestore Realtime Listener (Syncs across devices in real time)
  useEffect(() => {
    let unsubscribe: () => void = () => {};
    try {
      const jobsCol = collection(db, 'jobs');
      unsubscribe = onSnapshot(jobsCol, (snapshot) => {
        if (!snapshot.empty) {
          const remoteJobs: ModifyJob[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteJobs.push({ id: docSnap.id, ...data } as ModifyJob);
          });
          // Sort by seqNo
          remoteJobs.sort((a, b) => (a.seqNo || 0) - (b.seqNo || 0));
          setJobs(remoteJobs);
          setFirebaseOnline(true);
        } else {
          // If Firestore is truly empty and no local records exist, retain current state
          setFirebaseOnline(true);
        }
      }, (err) => {
        console.warn('Firestore offline / cached mode active:', err.message);
      });
    } catch (e) {
      console.warn('Using local persistence engine:', e);
    }

    return () => unsubscribe();
  }, []);

  // 1-Day Advance Deadline Alert Calculation
  const urgentAlerts: DeadlineAlertItem[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const alerts: DeadlineAlertItem[] = [];

    jobs.forEach((job) => {
      if (job.status === 'เสร็จสิ้น' || job.status === 'ยกเลิก') return;

      const shipDate = new Date(job.shipmentDate);
      shipDate.setHours(0, 0, 0, 0);

      const diffTime = shipDate.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Overdue
        alerts.push({
          job,
          daysRemaining: diffDays,
          isOverdue: true,
          isUrgent1Day: false,
          targetDate: job.shipmentDate,
          targetType: 'shipment'
        });
      } else if (diffDays <= 1) {
        // Due today or tomorrow (1 day alert)
        alerts.push({
          job,
          daysRemaining: diffDays,
          isOverdue: false,
          isUrgent1Day: true,
          targetDate: job.shipmentDate,
          targetType: 'shipment'
        });
      }
    });

    return alerts;
  }, [jobs]);

  // Handlers for Jobs
  const handleSaveJob = async (jobData: Omit<ModifyJob, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSyncing(true);
    const now = new Date().toISOString();

    if (editingJob) {
      // Update existing
      const shouldClearAttachments = jobData.status === 'เสร็จสิ้น';
      const isFinishing = jobData.status === 'เสร็จสิ้น';
      const autoCompletedDate = isFinishing 
        ? (jobData.completedDate || editingJob.completedDate || formatCurrentDateTime())
        : undefined;

      const updated: ModifyJob = {
        ...editingJob,
        ...jobData,
        completedDate: autoCompletedDate,
        attachments: shouldClearAttachments ? [] : (jobData.attachments ?? editingJob.attachments ?? []),
        updatedAt: now,
      };

      setJobs((prev) => prev.map((j) => (j.id === editingJob.id ? updated : j)));

      try {
        await updateDoc(doc(db, 'jobs', editingJob.id), updated as any);
      } catch (err) {
        console.warn('Local update synced:', err);
      }
    } else {
      // Create new with robust unique ID
      const newId = `job_${jobData.category}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const shouldClearAttachments = jobData.status === 'เสร็จสิ้น';
      const isFinishing = jobData.status === 'เสร็จสิ้น';
      const autoCompletedDate = isFinishing 
        ? (jobData.completedDate || formatCurrentDateTime())
        : undefined;

      const newJob: ModifyJob = {
        ...jobData,
        completedDate: autoCompletedDate,
        attachments: shouldClearAttachments ? [] : (jobData.attachments ?? []),
        id: newId,
        createdBy: user?.uid,
        createdByName: user?.displayName,
        createdByEmail: user?.email,
        createdAt: now,
        updatedAt: now,
      };

      setJobs((prev) => [newJob, ...prev]);

      // Navigate to the target job category tab (e.g., 'paint' for งานพ่นสี)
      if (jobData.category) {
        setActiveView(jobData.category);
      }

      try {
        await setDoc(doc(db, 'jobs', newId), newJob);
      } catch (err) {
        console.warn('Local create saved:', err);
      }
    }

    setIsSyncing(false);
    setEditingJob(null);
  };

  const handleStatusChange = async (jobId: string, newStatus: JobStatus) => {
    const now = new Date().toISOString();
    const shouldClearAttachments = newStatus === 'เสร็จสิ้น';
    const completionTimestamp = newStatus === 'เสร็จสิ้น' ? formatCurrentDateTime() : undefined;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const finalCompletedDate = newStatus === 'เสร็จสิ้น' ? (j.completedDate || completionTimestamp) : undefined;
          return {
            ...j,
            status: newStatus,
            completedDate: finalCompletedDate,
            attachments: shouldClearAttachments ? [] : j.attachments,
            updatedAt: now,
          };
        }
        return j;
      })
    );

    try {
      const existingJob = jobs.find(j => j.id === jobId);
      const finalCompletedDate = newStatus === 'เสร็จสิ้น' ? (existingJob?.completedDate || completionTimestamp) : null;
      const updateData: any = { 
        status: newStatus, 
        completedDate: finalCompletedDate,
        updatedAt: now 
      };
      if (shouldClearAttachments) {
        updateData.attachments = [];
      }
      await updateDoc(doc(db, 'jobs', jobId), updateData);
    } catch (err) {
      console.warn('Status change local:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    let confirmed = true;
    try {
      confirmed = window.confirm('คุณต้องการลบรายการงานนี้ใช่หรือไม่?');
    } catch {
      confirmed = true;
    }
    if (confirmed) {
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      try {
        await deleteDoc(doc(db, 'jobs', jobId));
      } catch (err) {
        console.warn('Local delete:', err);
      }
    }
  };

  const handleOpenNewJobForCategory = (cat: JobCategory) => {
    setNewJobInitialCat(cat);
    setEditingJob(null);
    setIsNewJobModalOpen(true);
  };

  const handleEditJob = (job: ModifyJob) => {
    setEditingJob(job);
    setIsNewJobModalOpen(true);
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const snapshot = await getDocs(collection(db, 'jobs'));
      if (!snapshot.empty) {
        const remoteJobs: ModifyJob[] = [];
        snapshot.forEach((docSnap) => {
          remoteJobs.push({ id: docSnap.id, ...docSnap.data() } as ModifyJob);
        });
        remoteJobs.sort((a, b) => a.seqNo - b.seqNo);
        setJobs(remoteJobs);
        setFirebaseOnline(true);
      }
    } catch (err) {
      console.warn('Manual sync check:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 600);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
  };

  const handleOpenLeadTimeCalculator = (cat?: unknown) => {
    if (typeof cat === 'string' && (cat === 'modify_general' || cat === 'paint' || cat === 'custom_fabrication')) {
      setLeadTimeInitialCat(cat as JobCategory);
    } else if (activeView !== 'cost_summary' && (activeView === 'modify_general' || activeView === 'paint' || activeView === 'custom_fabrication')) {
      setLeadTimeInitialCat(activeView as JobCategory);
    } else {
      setLeadTimeInitialCat('modify_general');
    }
    setIsLeadTimeModalOpen(true);
  };

  const handleApplyLeadTimeToNewJob = (data: {
    category: JobCategory;
    receivedDate: string;
    quantity: number;
    estimatedDate: string;
    shipmentDate: string;
    summaryText: string;
  }) => {
    setEditingJob(null);
    setNewJobInitialCat(data.category);
    setNewJobPrefillData({
      category: data.category,
      receivedDate: data.receivedDate,
      estimatedDate: data.estimatedDate,
      shipmentDate: data.shipmentDate,
      jobDescription: `ปรับแต่ง/ผลิตงาน ${CATEGORY_CONFIG[data.category].title} (จำนวน ${data.quantity} ชิ้น)`,
      notes: data.summaryText,
      quantity: data.quantity,
    });
    setIsNewJobModalOpen(true);
  };

  // Filter jobs based on global search if entered
  const displayedJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    const q = searchQuery.toLowerCase();
    return jobs.filter(
      (j) =>
        j.soNo.toLowerCase().includes(q) ||
        j.projectCode.toLowerCase().includes(q) ||
        j.projectName.toLowerCase().includes(q) ||
        j.customerName.toLowerCase().includes(q) ||
        j.ecrNo.toLowerCase().includes(q) ||
        j.technician.toLowerCase().includes(q) ||
        j.salesOwner.toLowerCase().includes(q) ||
        j.jobDescription.toLowerCase().includes(q)
    );
  }, [jobs, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Navbar */}
      <Navbar
        urgentAlerts={urgentAlerts}
        user={user}
        onOpenNewJob={() => {
          setEditingJob(null);
          setNewJobPrefillData(null);
          setNewJobInitialCat(activeView === 'cost_summary' || activeView === 'calendar' || activeView === 'job_queue' ? 'modify_general' : activeView);
          setIsNewJobModalOpen(true);
        }}
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
        onOpenSheetsModal={() => setIsSheetsModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        firebaseOnline={firebaseOnline}
      />

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side Navigation Bar */}
        <Sidebar
          activeView={activeView}
          onSelectView={setActiveView}
          onOpenNewJob={() => {
            setEditingJob(null);
            setNewJobPrefillData(null);
            setNewJobInitialCat(activeView === 'cost_summary' || activeView === 'calendar' || activeView === 'job_queue' ? 'modify_general' : activeView);
            setIsNewJobModalOpen(true);
          }}
          onOpenLeadTimeCalculator={handleOpenLeadTimeCalculator}
          jobs={jobs}
          urgentAlerts={urgentAlerts}
        />

        {/* Dynamic Full-Size Viewport */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 min-h-[calc(100vh-4rem)]">
          {activeView === 'job_queue' ? (
            <JobQueueView
              jobs={displayedJobs}
              urgentAlerts={urgentAlerts}
              onViewJob={setViewingJob}
              onEditJob={handleEditJob}
              onDeleteJob={handleDeleteJob}
              onStatusChange={handleStatusChange}
              onOpenNewJob={() => {
                setEditingJob(null);
                setNewJobPrefillData(null);
                setNewJobInitialCat('modify_general');
                setIsNewJobModalOpen(true);
              }}
              onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
            />
          ) : activeView === 'calendar' ? (
            <CalendarView
              jobs={displayedJobs}
              urgentAlerts={urgentAlerts}
              onViewJob={setViewingJob}
              onEditJob={handleEditJob}
              onDeleteJob={handleDeleteJob}
              onStatusChange={handleStatusChange}
              onOpenNewJob={() => {
                setEditingJob(null);
                setNewJobPrefillData(null);
                setNewJobInitialCat('modify_general');
                setIsNewJobModalOpen(true);
              }}
              onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
            />
          ) : activeView === 'cost_summary' ? (
            <CostSummaryView
              jobs={displayedJobs}
              onViewJob={setViewingJob}
              onEditJob={handleEditJob}
              onDeleteJob={handleDeleteJob}
              onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
            />
          ) : (
            <JobTable
              category={activeView as JobCategory}
              jobs={displayedJobs}
              urgentAlerts={urgentAlerts}
              onViewJob={setViewingJob}
              onEditJob={handleEditJob}
              onDeleteJob={handleDeleteJob}
              onStatusChange={handleStatusChange}
              onOpenNewJobForCategory={handleOpenNewJobForCategory}
              onOpenSheetsSync={() => setIsSheetsModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals & Popups */}
      <NewJobModal
        isOpen={isNewJobModalOpen}
        onClose={() => {
          setIsNewJobModalOpen(false);
          setEditingJob(null);
          setNewJobPrefillData(null);
        }}
        onSaveJob={handleSaveJob}
        initialCategory={newJobInitialCat}
        existingJobs={jobs}
        user={user}
        editingJob={editingJob}
        prefillData={newJobPrefillData}
        onOpenLeadTimeCalculator={() => {
          setLeadTimeInitialCat(newJobInitialCat);
          setIsLeadTimeModalOpen(true);
        }}
      />

      <LeadTimeCalculatorModal
        isOpen={isLeadTimeModalOpen}
        onClose={() => setIsLeadTimeModalOpen(false)}
        onApplyToNewJob={handleApplyLeadTimeToNewJob}
        initialCategory={leadTimeInitialCat}
      />

      <JobDetailModal
        job={viewingJob}
        onClose={() => setViewingJob(null)}
        onEdit={(job) => {
          setViewingJob(null);
          handleEditJob(job);
        }}
        onDelete={handleDeleteJob}
        onStatusChange={handleStatusChange}
        alert={viewingJob ? urgentAlerts.find((a) => a.job.id === viewingJob.id) : undefined}
      />

      <DeadlineAlertModal
        isOpen={isAlertsModalOpen}
        onClose={() => setIsAlertsModalOpen(false)}
        alerts={urgentAlerts}
        onViewJob={(job) => {
          setIsAlertsModalOpen(false);
          setViewingJob(job);
        }}
        onStatusChange={handleStatusChange}
      />

      <GoogleSheetsSyncModal
        isOpen={isSheetsModalOpen}
        onClose={() => setIsSheetsModalOpen(false)}
        jobs={jobs}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
}
