import { ThoughtEvent } from '@/types/events';
import { invoke } from '@tauri-apps/api/tauri';
import { readTextFile, writeTextFile, createDir, exists } from '@tauri-apps/api/fs';
import { join } from '@tauri-apps/api/path';

const EVENT_LOG_DIR = '.thoughtlog';
const EVENT_LOG_FILE = 'events.ndjson';

export class EventLogService {
  private projectPath: string | null = null;

  async initialize(projectPath: string) {
    this.projectPath = projectPath;
    const logDir = await join(projectPath, EVENT_LOG_DIR);
    const logFile = await join(logDir, EVENT_LOG_FILE);

    // Создаём директорию если её нет
    try {
      const dirExists = await exists(logDir);
      if (!dirExists) {
        await createDir(logDir, { recursive: true });
      }
    } catch (error) {
      // Если не удалось проверить/создать, пробуем создать напрямую
      try {
        await createDir(logDir, { recursive: true });
      } catch (e) {
        console.error('Failed to create log directory:', e);
      }
    }

    // Создаём файл если его нет
    try {
      const fileExists = await exists(logFile);
      if (!fileExists) {
        await writeTextFile(logFile, '');
      }
    } catch (error) {
      // Если файла нет, создаём его
      try {
        await writeTextFile(logFile, '');
      } catch (e) {
        console.error('Failed to create log file:', e);
      }
    }
  }

  private async getLogPath(): Promise<string> {
    if (!this.projectPath) {
      throw new Error('EventLog not initialized');
    }
    return await join(this.projectPath, EVENT_LOG_DIR, EVENT_LOG_FILE);
  }

  async appendEvent(event: ThoughtEvent): Promise<void> {
    const logPath = await this.getLogPath();
    const line = JSON.stringify(event) + '\n';
    
    // Append-only: добавляем в конец файла
    const existing = await readTextFile(logPath);
    await writeTextFile(logPath, existing + line);
  }

  async readEvents(): Promise<ThoughtEvent[]> {
    const logPath = await this.getLogPath();
    const content = await readTextFile(logPath);
    
    if (!content.trim()) {
      return [];
    }

    return content
      .split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line) as ThoughtEvent);
  }

  async getEventsByType(type: ThoughtEvent['type']): Promise<ThoughtEvent[]> {
    const events = await this.readEvents();
    return events.filter(e => e.type === type);
  }

  async getEventsByIntent(intentId: string): Promise<ThoughtEvent[]> {
    const events = await this.readEvents();
    return events.filter(e => {
      if ('payload' in e && typeof e.payload === 'object') {
        return (
          (e.payload as any).intent_id === intentId ||
          (e.payload as any).linked_intent === intentId ||
          ((e.payload as any).linked_intents || []).includes(intentId)
        );
      }
      return false;
    });
  }
}

export const eventLogService = new EventLogService();
