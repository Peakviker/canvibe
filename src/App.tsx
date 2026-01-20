import { useState } from 'react';
import { Canvas } from './components/Canvas';
import { ProjectSelector } from './components/ProjectSelector';
import './App.css';

function App() {
  const [projectPath, setProjectPath] = useState<string | null>(null);

  if (!projectPath) {
    return <ProjectSelector onProjectSelected={setProjectPath} />;
  }

  return (
    <div className="app">
      <Canvas />
    </div>
  );
}

export default App;
