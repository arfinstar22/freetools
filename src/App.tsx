import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { HomePage } from './pages/HomePage';
import { ToolsCatalog } from './components/catalog/ToolsCatalog';
import { PrivacyPage } from './pages/PrivacyPage';
import { ToolRunner } from './components/tool/ToolRunner';
import { WorkflowRunnerModal } from './components/workflow/WorkflowRunnerModal';
import { getToolById } from './engine/registry';
import { WorkflowPlan } from './types/workflow';
import { WifiOff } from 'lucide-react';

export function App() {
  const [activeView, setActiveView] = useState<'home' | 'tools' | 'privacy' | 'tool-runner'>('home');
  const [selectedToolId, setSelectedToolId] = useState<string>('compress-pdf');
  const [preloadedFiles, setPreloadedFiles] = useState<File[]>([]);
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowPlan | null>(null);
  const [privateMode, setPrivateMode] = useState<boolean>(() => {
    return localStorage.getItem('freetools_private_mode') === 'true';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('freetools_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // default theme
  });

  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('freetools_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTogglePrivateMode = (val: boolean | ((prev: boolean) => boolean)) => {
    setPrivateMode((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      localStorage.setItem('freetools_private_mode', String(next));
      return next;
    });
  };

  const handleSelectTool = (toolId: string, files?: File[]) => {
    setSelectedToolId(toolId);
    if (files && files.length > 0) {
      setPreloadedFiles(files);
    }
    setActiveView('tool-runner');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedTool = getToolById(selectedToolId) || getToolById('compress-pdf')!;

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
      {/* Offline Banner indicator */}
      {isOffline && (
        <div className="bg-amber-500/10 dark:bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-2 text-xs flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Kamu sedang offline. FreeTools tetap bisa digunakan untuk semua tool lokal!</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeView={activeView}
        setActiveView={(v: any) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        privateMode={privateMode}
        setPrivateMode={handleTogglePrivateMode}
        onSelectTool={handleSelectTool}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Router */}
      <main className="flex-1 flex flex-col relative z-10">
        {activeView === 'home' && (
          <HomePage
            onSelectTool={handleSelectTool}
            setActiveView={(v: any) => setActiveView(v)}
            privateMode={privateMode}
            onLaunchWorkflow={(wf, files) => {
              setActiveWorkflow(wf);
              if (files && files.length > 0) {
                setPreloadedFiles(files);
              }
            }}
          />
        )}

        {activeView === 'tools' && (
          <ToolsCatalog onSelectTool={handleSelectTool} />
        )}

        {activeView === 'privacy' && (
          <PrivacyPage onBackHome={() => setActiveView('home')} />
        )}

        {activeView === 'tool-runner' && (
          <ToolRunner
            key={selectedTool.id}
            tool={selectedTool}
            initialFiles={preloadedFiles}
            onBack={() => {
              setPreloadedFiles([]);
              setActiveView('home');
            }}
            onSelectOtherTool={(toolId) => handleSelectTool(toolId)}
          />
        )}
      </main>

      {/* Workflow Modal */}
      {activeWorkflow && (
        <WorkflowRunnerModal
          plan={activeWorkflow}
          initialFiles={preloadedFiles}
          onClose={() => setActiveWorkflow(null)}
        />
      )}

      {/* Footer */}
      <Footer setActiveView={(v: any) => setActiveView(v)} theme={theme} />
    </div>
  );
}

export default App;
