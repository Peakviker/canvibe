import { ThoughtEvent } from '@/types/events';
import { CanvasNode, CanvasEdge, CanvasProjection, BranchGroup } from '@/types/nodes';

export class ProjectionService {
  projectEvents(events: ThoughtEvent[]): CanvasProjection {
    const nodes: CanvasNode[] = [];
    const edges: CanvasEdge[] = [];
    const groups: BranchGroup[] = [];
    const branchMap = new Map<string, BranchGroup>();

    let yOffset = 100;
    const nodeSpacing = 150;

    // Проходим по событиям и создаём узлы
    for (const event of events) {
      switch (event.type) {
        case 'INTENT_DECLARED':
          nodes.push({
            id: `node_${event.id}`,
            type: 'intent',
            x: 100,
            y: yOffset,
            width: 200,
            height: 80,
            data: {
              text: event.payload.text,
              intent_id: event.payload.intent_id,
            },
            eventId: event.id,
          });
          yOffset += nodeSpacing;
          break;

        case 'AI_RESPONSE_RECEIVED':
          nodes.push({
            id: `node_${event.id}`,
            type: 'ai_thought',
            x: 350,
            y: yOffset,
            width: 250,
            height: 120,
            data: {
              prompt: event.payload.prompt,
              response: event.payload.response,
              model: event.payload.model,
              ai_session_id: event.payload.ai_session_id,
            },
            eventId: event.id,
          });
          
          // Связь с intent если есть
          if (event.payload.linked_intent) {
            const intentNode = nodes.find(n => 
              n.type === 'intent' && 
              n.data.intent_id === event.payload.linked_intent
            );
            if (intentNode) {
              edges.push({
                id: `edge_${event.id}_intent`,
                from: intentNode.id,
                to: `node_${event.id}`,
                type: 'causality',
              });
            }
          }
          yOffset += nodeSpacing;
          break;

        case 'HYPOTHESIS_ACCEPTED':
        case 'HYPOTHESIS_REJECTED':
          nodes.push({
            id: `node_${event.id}`,
            type: 'decision',
            x: 650,
            y: yOffset,
            width: 180,
            height: 60,
            data: {
              accepted: event.type === 'HYPOTHESIS_ACCEPTED',
              excerpt: event.payload.excerpt,
              reason: event.payload.reason,
              ai_session_id: event.payload.ai_session_id,
            },
            eventId: event.id,
          });
          
          // Связь с AI-узлом
          const aiNode = nodes.find(n => 
            n.type === 'ai_thought' && 
            n.data.ai_session_id === event.payload.ai_session_id
          );
          if (aiNode) {
            edges.push({
              id: `edge_${event.id}_ai`,
              from: aiNode.id,
              to: `node_${event.id}`,
              type: 'causality',
            });
          }
          yOffset += nodeSpacing;
          break;

        case 'BRANCH_CREATED':
          const branchGroup: BranchGroup = {
            id: `branch_${event.payload.branch}`,
            branch: event.payload.branch,
            x: 100,
            y: yOffset,
            width: 800,
            height: 400,
            nodes: [],
          };
          branchMap.set(event.payload.branch, branchGroup);
          groups.push(branchGroup);
          yOffset += 500;
          break;

        case 'FILE_CREATED':
          const branch = event.context.git_branch || 'main';
          const branchGroupForFile = branchMap.get(branch);
          
          nodes.push({
            id: `node_${event.id}`,
            type: 'file',
            x: branchGroupForFile ? branchGroupForFile.x + 50 : 100,
            y: yOffset,
            width: 200,
            height: 50,
            data: {
              path: event.payload.path,
              branch: branch,
            },
            eventId: event.id,
          });
          
          if (branchGroupForFile) {
            branchGroupForFile.nodes.push(`node_${event.id}`);
          }
          yOffset += nodeSpacing;
          break;

        case 'COMMIT_CREATED':
          nodes.push({
            id: `node_${event.id}`,
            type: 'commit',
            x: 100,
            y: yOffset,
            width: 300,
            height: 70,
            data: {
              message: event.payload.message,
              commit: event.context.git_commit,
              files: event.payload.files,
            },
            eventId: event.id,
          });
          yOffset += nodeSpacing;
          break;
      }
    }

    return { nodes, edges, groups };
  }

  // Фильтр для Failure Lens
  projectFailureLens(events: ThoughtEvent[]): CanvasProjection {
    const failureEvents = events.filter(e => 
      e.type === 'HYPOTHESIS_REJECTED' ||
      e.type === 'CHANGE_REVERTED' ||
      e.type === 'BRANCH_ABANDONED' ||
      (e.type === 'TASK_STATE_CHANGED' && 
       (e.payload.to === 'frozen' || e.payload.to === 'cancelled'))
    );

    return this.projectEvents(failureEvents);
  }
}

export const projectionService = new ProjectionService();
