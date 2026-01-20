import { useState } from 'react';
import { isTauri } from '@/utils/isTauri';
import { eventLogService } from '@/services/eventLog';
import { gitService } from '@/services/git';
import { fileWatcherService } from '@/services/fileWatcher';

interface ProjectSelectorProps {
  onProjectSelected: (path: string) => void;
}

export function ProjectSelector({ onProjectSelected }: ProjectSelectorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectProject = async () => {
    try {
      setIsLoading(true);
      
      let projectPath: string;

      if (isTauri()) {
        const { open } = await import('@tauri-apps/api/dialog');
        const selected = await open({
          directory: true,
          multiple: false,
          title: 'Выберите проект',
        });

        if (!selected || typeof selected !== 'string') {
          setIsLoading(false);
          return;
        }

        projectPath = selected;
      } else {
        // Веб-версия: используем ввод или localStorage
        const saved = localStorage.getItem('canvibe_last_project');
        const input = prompt('Введите путь к проекту (для демо используйте любой текст):', saved || 'demo-project');
        if (!input) {
          setIsLoading(false);
          return;
        }
        projectPath = input;
        localStorage.setItem('canvibe_last_project', input);
      }

      // Инициализируем сервисы
      await eventLogService.initialize(projectPath);
      await gitService.initialize(projectPath);
      await fileWatcherService.initialize(projectPath);

      // Запускаем мониторинг
      await gitService.watchBranchChanges();
      await gitService.watchCommits();
      await fileWatcherService.startWatching();

      onProjectSelected(projectPath);
    } catch (error) {
      console.error('Failed to select project:', error);
      alert('Ошибка при выборе проекта');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#1a1a1a',
      color: '#e0e0e0',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '40px',
        background: '#2c2c2c',
        borderRadius: '12px',
      }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px' }}>Canvibe</h1>
        <p style={{ marginBottom: '30px', color: '#999' }}>
          Визуальный оркестратор мышления для разработки с AI
        </p>
        <button
          onClick={handleSelectProject}
          disabled={isLoading}
          style={{
            background: '#4a9eff',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
          }}
        >
          {isLoading ? 'Загрузка...' : 'Выбрать проект'}
        </button>
      </div>
    </div>
  );
}
