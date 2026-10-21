import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { SyllabusUploadModal } from '../syllabus/SyllabusUploadModal';
import { ProfileModal } from '../profile/ProfileModal';
import { ProfessorPanic } from '../companion/ProfessorPanic';
import { useSyllaborn } from '../../hooks/useSyllaborn';
import { triggerLevelUpCelebration } from '../../lib/celebration';

export const AppLayout: React.FC = () => {
  const { profile, levelInfo } = useSyllaborn();
  const location = useLocation();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Track level changes to trigger celebratory fanfare
  const previousLevelRef = useRef<number>(levelInfo.level);

  useEffect(() => {
    if (levelInfo.level > previousLevelRef.current) {
      triggerLevelUpCelebration();
    }
    previousLevelRef.current = levelInfo.level;
  }, [levelInfo.level]);

  // First-time onboarding trigger
  const needsOnboarding = profile === null;

  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex flex-col antialiased neo-canvas-grid">
      {/* Sidebar for Desktop & Mobile Drawer */}
      <Sidebar
        onUploadClick={() => setIsUploadModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />


      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <TopNavbar
          onMobileMenuToggle={() => setIsMobileSidebarOpen((prev) => !prev)}
          onUploadClick={() => setIsUploadModalOpen(true)}
          onProfileClick={() => setIsProfileModalOpen(true)}
        />

        {/* Dynamic Route View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          <Outlet />
        </main>
      </div>

      {/* Floating Professor Panic Companion */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
        <ProfessorPanic />
      </div>

      {/* Syllabus Upload Modal */}
      <SyllabusUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Player Profile & Onboarding Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen || needsOnboarding}
        isOnboarding={needsOnboarding}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
