import { isTauri } from '@/utils/isTauri';
import { eventLogService } from './eventLog';
import { FileCreatedEvent, FileModifiedEvent, ChangeRevertedEvent } from '@/types/events';
import { gitService } from './git';

export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: string;
}

export class FileWatcherService {
  private projectPath: string | null = null;
  private watchedFiles = new Map<string, string>(); // path -> last content hash
  private isWatching = false;

  async initialize(projectPath: string) {
    this.projectPath = projectPath;
    await this.scanInitialFiles();
  }

  private async scanInitialFiles() {
    if (!this.projectPath) return;

    if (!isTauri()) {
      console.warn('File watching not available in web mode');
      return;
    }

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      const files = await invoke<string[]>('list_files', {
        path: this.projectPath,
      });

      for (const file of files) {
        try {
          const fullPath = `${this.projectPath}/${file}`;
          const content = await this.getFileContent(fullPath);
          const hash = this.hashContent(content);
          this.watchedFiles.set(fullPath, hash);
        } catch (error) {
          // Пропускаем файлы, которые не удалось прочитать
          console.warn(`Failed to read file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to scan initial files:', error);
    }
  }

  private async getFileContent(filePath: string): Promise<string> {
    if (!isTauri()) {
      return '';
    }

    try {
      const { invoke } = await import('@tauri-apps/api/tauri');
      return await invoke<string>('read_file', {
        path: filePath,
      });
    } catch {
      return '';
    }
  }

  private hashContent(content: string): string {
    // Простой хеш для определения изменений
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  async startWatching() {
    if (this.isWatching || !this.projectPath) return;
    this.isWatching = true;

    const checkFiles = async () => {
      if (!isTauri()) {
        return;
      }

      try {
        const { invoke } = await import('@tauri-apps/api/tauri');
        const files = await invoke<string[]>('list_files', {
          path: this.projectPath,
        });

        // Проверяем существующие файлы
        for (const file of files) {
          try {
            const fullPath = `${this.projectPath}/${file}`;
            const content = await this.getFileContent(fullPath);
            const newHash = this.hashContent(content);
            const oldHash = this.watchedFiles.get(fullPath);

            if (!oldHash) {
              // Новый файл
              await this.handleFileCreated(fullPath);
              this.watchedFiles.set(fullPath, newHash);
            } else if (oldHash !== newHash) {
              // Изменённый файл
              await this.handleFileModified(fullPath, content);
              this.watchedFiles.set(fullPath, newHash);
            }
          } catch (error) {
            // Пропускаем файлы с ошибками
            console.warn(`Error processing file ${file}:`, error);
          }
        }

        // Проверяем удалённые файлы
        const currentFiles = new Set(files.map(f => `${this.projectPath}/${f}`));
        for (const [filePath] of this.watchedFiles) {
          if (!currentFiles.has(filePath)) {
            await this.handleFileDeleted(filePath);
            this.watchedFiles.delete(filePath);
          }
        }
      } catch (error) {
        console.error('File watching error:', error);
      }
    };

    // Проверяем каждые 1 секунду
    setInterval(checkFiles, 1000);
    await checkFiles();
  }

  private async handleFileCreated(filePath: string) {
    const branch = await gitService.getCurrentBranch();
    
    const event: FileCreatedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'FILE_CREATED',
      timestamp: new Date().toISOString(),
      actor: 'system',
      context: {
        project: this.projectPath || '',
        git_branch: branch,
        git_commit: null,
      },
      payload: {
        path: filePath,
      },
    };

    await eventLogService.appendEvent(event);
  }

  private async handleFileModified(filePath: string, content: string) {
    const branch = await gitService.getCurrentBranch();
    const diff = await gitService.getDiff(filePath);

    // Подсчитываем изменения
    const lines = content.split('\n');
    const added = diff.split('\n').filter(l => l.startsWith('+')).length;
    const removed = diff.split('\n').filter(l => l.startsWith('-')).length;

    const event: FileModifiedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'FILE_MODIFIED',
      timestamp: new Date().toISOString(),
      actor: 'system',
      context: {
        project: this.projectPath || '',
        git_branch: branch,
        git_commit: null,
      },
      payload: {
        path: filePath,
        diff_stats: {
          added,
          removed,
        },
      },
    };

    await eventLogService.appendEvent(event);
  }

  private async handleFileDeleted(filePath: string) {
    const branch = await gitService.getCurrentBranch();

    const event: ChangeRevertedEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'CHANGE_REVERTED',
      timestamp: new Date().toISOString(),
      actor: 'system',
      context: {
        project: this.projectPath || '',
        git_branch: branch,
        git_commit: null,
      },
      payload: {
        path: filePath,
        reason: 'File deleted',
      },
    };

    await eventLogService.appendEvent(event);
  }

  stopWatching() {
    this.isWatching = false;
  }
}

export const fileWatcherService = new FileWatcherService();
