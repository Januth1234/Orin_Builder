import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
      {/* / → main builder workspace (auth required) */}
      <Route path="/" element={<WorkspaceRoute />} />
      {/* /home → marketing landing page (public) */}
      <Route path="/home" element={<LandingPage />} />
      {/* Catch-all → redirect to / */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
