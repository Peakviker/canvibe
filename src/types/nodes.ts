export type NodeType =
  | 'intent'
  | 'ai_thought'
  | 'decision'
  | 'file'
  | 'commit'
  | 'branch';

export interface CanvasNode {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width: number;
  height: number;
  data: any;
  eventId: string; // Ссылка на событие в event-log
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  type: 'causality' | 'hierarchy' | 'reference';
}

export interface CanvasProjection {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  groups: BranchGroup[];
}

export interface BranchGroup {
  id: string;
  branch: string;
  x: number;
  y: number;
  width: number;
  height: number;
  nodes: string[]; // IDs узлов внутри группы
}
