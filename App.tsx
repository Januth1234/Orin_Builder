import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import AuthGate from './components/AuthGate';
import BuilderApp from './components/BuilderApp';
import LandingPage from './components/LandingPage';
import { useBuilderStore } from './services/builderStore';

const WorkspaceRoute: React.FC = () => {
  const { user, loadProjects } = useBuilderStore();
  useEffect(() => { if (user) loadProjects(); }, [user?.id]);
  return (
    <AuthGate>
      <BuilderApp />
    </AuthGate>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<WorkspaceRoute />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <Analytics />
  </BrowserRouter>
);

export default App;
