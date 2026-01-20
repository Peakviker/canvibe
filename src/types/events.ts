// Канонические типы событий из концепции

export type EventType =
  | 'INTENT_DECLARED'
  | 'AI_RESPONSE_RECEIVED'
  | 'HYPOTHESIS_ACCEPTED'
  | 'HYPOTHESIS_REJECTED'
  | 'BRANCH_CREATED'
  | 'FILE_CREATED'
  | 'FILE_MODIFIED'
  | 'CHANGE_REVERTED'
  | 'COMMIT_CREATED'
  | 'TASK_STATE_CHANGED'
  | 'BRANCH_ABANDONED';

export type Actor = 'human' | 'ai' | 'system';

export interface EventContext {
  project: string;
  git_branch: string | null;
  git_commit: string | null;
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: string;
  actor: Actor;
  context: EventContext;
  payload: Record<string, any>;
}

// Специфичные типы событий
export interface IntentDeclaredEvent extends BaseEvent {
  type: 'INTENT_DECLARED';
  payload: {
    intent_id: string;
    text: string;
    source: 'canvas' | 'cursor' | 'manual';
  };
}

export interface AIResponseReceivedEvent extends BaseEvent {
  type: 'AI_RESPONSE_RECEIVED';
  actor: 'ai';
  payload: {
    ai_session_id: string;
    model: string;
    prompt: string;
    response: string;
    linked_intent?: string;
  };
}

export interface HypothesisAcceptedEvent extends BaseEvent {
  type: 'HYPOTHESIS_ACCEPTED';
  actor: 'human';
  payload: {
    ai_session_id: string;
    excerpt: string;
    reason?: string;
  };
}

export interface HypothesisRejectedEvent extends BaseEvent {
  type: 'HYPOTHESIS_REJECTED';
  actor: 'human';
  payload: {
    ai_session_id: string;
    excerpt: string;
    reason: string;
  };
}

export interface BranchCreatedEvent extends BaseEvent {
  type: 'BRANCH_CREATED';
  actor: 'system';
  payload: {
    branch: string;
    from: string;
    linked_intent?: string;
  };
}

export interface FileCreatedEvent extends BaseEvent {
  type: 'FILE_CREATED';
  actor: 'system';
  payload: {
    path: string;
    linked_ai_session?: string;
  };
}

export interface FileModifiedEvent extends BaseEvent {
  type: 'FILE_MODIFIED';
  actor: 'system';
  payload: {
    path: string;
    diff_stats: {
      added: number;
      removed: number;
    };
  };
}

export interface ChangeRevertedEvent extends BaseEvent {
  type: 'CHANGE_REVERTED';
  actor: 'human';
  payload: {
    path: string;
    reason: string;
  };
}

export interface CommitCreatedEvent extends BaseEvent {
  type: 'COMMIT_CREATED';
  actor: 'human';
  context: EventContext & { git_commit: string };
  payload: {
    message: string;
    linked_intents: string[];
    files: string[];
  };
}

export interface TaskStateChangedEvent extends BaseEvent {
  type: 'TASK_STATE_CHANGED';
  actor: 'human';
  payload: {
    intent_id: string;
    from: 'active' | 'frozen' | 'completed' | 'cancelled';
    to: 'active' | 'frozen' | 'completed' | 'cancelled';
    reason?: string;
  };
}

export interface BranchAbandonedEvent extends BaseEvent {
  type: 'BRANCH_ABANDONED';
  actor: 'human';
  payload: {
    branch: string;
    reason?: string;
  };
}

export type ThoughtEvent =
  | IntentDeclaredEvent
  | AIResponseReceivedEvent
  | HypothesisAcceptedEvent
  | HypothesisRejectedEvent
  | BranchCreatedEvent
  | FileCreatedEvent
  | FileModifiedEvent
  | ChangeRevertedEvent
  | CommitCreatedEvent
  | TaskStateChangedEvent
  | BranchAbandonedEvent;
