import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { AppShell } from '@/components/layout/app-shell';
import Dashboard from '@/pages/dashboard';
import CreateClass from '@/pages/create-class';
import Session from '@/pages/session';
import ProgressPage from '@/pages/progress';
import RevisionPage from '@/pages/revision';
import RoadmapPage from '@/pages/roadmap';
import LandingPage from '@/pages/landing';
import SettingsPage from '@/pages/settings';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing Publishable Key. Please set VITE_CLERK_PUBLISHABLE_KEY in .env.local");
}

import { TooltipProvider } from '@/components/ui/tooltip';

function App() {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <TooltipProvider delayDuration={0}>
        <BrowserRouter>
          <Routes>
            {/* Landing page — accessible without auth */}
            <Route path="/" element={
              <>
                <SignedIn>
                  <Navigate to="/dashboard" replace />
                </SignedIn>
                <SignedOut>
                  <LandingPage />
                </SignedOut>
              </>
            } />

            {/* Protected Routes */}
            <Route path="/*" element={
              <>
                <SignedIn>
                  <AppShell>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/create" element={<CreateClass />} />
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/session/:classId" element={<Session />} />
                      <Route path="/progress/:classId" element={<ProgressPage />} />
                      <Route path="/revision/:classId" element={<RevisionPage />} />
                      <Route path="/roadmap/:classId" element={<RoadmapPage />} />
                    </Routes>
                  </AppShell>
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ClerkProvider>
  );
}

export default App;
