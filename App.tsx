import React, { useEffect } from 'react';
import AuthGate from './components/AuthGate';
import BuilderApp from './components/BuilderApp';
import { useBuilderStore } from './services/builderStore';

const App: React.FC = () => {
  const { user, loadProjects } = useBuilderStore();

  // Load user's projects once authenticated
  useEffect(() => {
    if (user) loadProjects();
  }, [user?.id]);

  return (
    <AuthGate>
      <BuilderApp />
    </AuthGate>
  );
};

export default App;
