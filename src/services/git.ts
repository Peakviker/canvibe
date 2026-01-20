import { invoke } from '@tauri-apps/api/tauri';
import { eventLogService } from './eventLog';
import { 
  BranchCreatedEvent, 
  CommitCreatedEvent, 
  FileCreatedEvent, 
  FileModifiedEvent,
  ThoughtEvent 
} from '@/types/events';

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  commit: string;
  message: string;
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
  diff?: string;
}

export class GitService {
  private projectPath: string | null = null;

  async initialize(projectPath: string) {
    this.projectPath = projectPath;
  }

  private async execGit(command: string[]): Promise<string> {
    if (!this.projectPath) {
      throw new Error('GitService not initialized');
    }

    try {
      const result = await invoke<string>('exec_git', {
        path: this.projectPath,
        args: command,
      });
      return result || '';
    } catch (error) {
      console.error('Git command failed:', error);
      throw error;
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.execGit(['branch', '--show-current']);
      return branch.trim();
    } catch {
      return 'main';
    }
  }

  async getBranches(): Promise<GitBranch[]> {
    try {
      const output = await this.execGit(['branch', '-v']);
      const lines = output.split('\n').filter(l => l.trim());
      const currentBranch = await this.getCurrentBranch();

      return lines.map(line => {
        const isCurrent = line.startsWith('*');
        const cleaned = line.replace(/^\*\s*/, '').trim();
        const parts = cleaned.split(/\s+/);
        
        return {
          name: parts[0],
          isCurrent: isCurrent || parts[0] === currentBranch,
          commit: parts[1] || '',
          message: parts.slice(2).join(' ') || '',
        };
      });
    } catch {
      return [];
    }
  }

  async getCommits(limit: number = 50): Promise<GitCommit[]> {
    try {
      const format = '%H|%s|%an|%ai';
      const output = await this.execGit([
        'log',
        `--format=${format}`,
        `-n${limit}`,
        '--name-only',
      ]);

      const commits: GitCommit[] = [];
      const lines = output.split('\n');
      let currentCommit: Partial<GitCommit> | null = null;
      const files: string[] = [];

      for (const line of lines) {
        if (line.includes('|')) {
          // Новый коммит
          if (currentCommit) {
            commits.push({
              ...currentCommit,
              files: [...files],
            } as GitCommit);
            files.length = 0;
          }

          const [hash, message, author, date] = line.split('|');
          currentCommit = {
            hash: hash?.trim() || '',
            message: message?.trim() || '',
            author: author?.trim() || '',
            date: date?.trim() || '',
            files: [],
          };
        } else if (line.trim() && currentCommit) {
          // Файл
          files.push(line.trim());
        }
      }

      if (currentCommit) {
        commits.push({
          ...currentCommit,
          files: [...files],
        } as GitCommit);
      }

      return commits;
    } catch {
      return [];
    }
  }

  async getDiff(filePath?: string): Promise<string> {
    try {
      const args = ['diff'];
      if (filePath) {
        args.push('--', filePath);
      }
      return await this.execGit(args);
    } catch {
      return '';
    }
  }

  async watchBranchChanges(): Promise<void> {
    // Отслеживаем изменения веток
    const previousBranches = new Set<string>();
    
    const checkBranches = async () => {
      const branches = await this.getBranches();
      const currentBranchNames = new Set(branches.map(b => b.name));

      // Находим новые ветки
      for (const branch of branches) {
        if (!previousBranches.has(branch.name)) {
          const event: BranchCreatedEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'BRANCH_CREATED',
            timestamp: new Date().toISOString(),
            actor: 'system',
            context: {
              project: this.projectPath || '',
              git_branch: branch.name,
              git_commit: branch.commit,
            },
            payload: {
              branch: branch.name,
              from: 'main', // TODO: определить родительскую ветку
            },
          };

          await eventLogService.appendEvent(event);
        }
      }

      previousBranches.clear();
      branches.forEach(b => previousBranches.add(b.name));
    };

    // Проверяем каждые 2 секунды
    setInterval(checkBranches, 2000);
    await checkBranches();
  }

  async watchCommits(): Promise<void> {
    const previousCommits = new Set<string>();
    
    const checkCommits = async () => {
      const commits = await this.getCommits(10);
      
      for (const commit of commits) {
        if (!previousCommits.has(commit.hash)) {
          const event: CommitCreatedEvent = {
            id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'COMMIT_CREATED',
            timestamp: new Date().toISOString(),
            actor: 'human',
            context: {
              project: this.projectPath || '',
              git_branch: await this.getCurrentBranch(),
              git_commit: commit.hash,
            },
            payload: {
              message: commit.message,
              linked_intents: [], // TODO: связать с intent через анализ сообщения
              files: commit.files,
            },
          };

          await eventLogService.appendEvent(event);
          previousCommits.add(commit.hash);
        }
      }
    };

    setInterval(checkCommits, 3000);
    await checkCommits();
  }
}

export const gitService = new GitService();
