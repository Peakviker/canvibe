import { Rect, Text, Group } from 'react-konva';
import { CanvasNode } from '@/types/nodes';

interface NodeProps {
  node: CanvasNode;
  onSelect?: (node: CanvasNode) => void;
}

export function Node({ node, onSelect }: NodeProps) {
  const getColor = () => {
    switch (node.type) {
      case 'intent':
        return '#4a9eff';
      case 'ai_thought':
        return '#9b59b6';
      case 'decision':
        return node.data.accepted ? '#2ecc71' : '#e74c3c';
      case 'file':
        return '#3498db';
      case 'commit':
        return '#f39c12';
      case 'branch':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  const getText = () => {
    switch (node.type) {
      case 'intent':
        return node.data.text || 'Intent';
      case 'ai_thought':
        return node.data.prompt?.substring(0, 30) + '...' || 'AI Thought';
      case 'decision':
        return node.data.accepted ? '✓ Accepted' : '✗ Rejected';
      case 'file':
        return node.data.path?.split('/').pop() || 'File';
      case 'commit':
        return node.data.message || 'Commit';
      default:
        return node.type;
    }
  };

  return (
    <Group
      x={node.x}
      y={node.y}
      onClick={() => onSelect?.(node)}
      onTap={() => onSelect?.(node)}
    >
      <Rect
        width={node.width}
        height={node.height}
        fill={getColor()}
        opacity={0.8}
        cornerRadius={8}
        shadowBlur={5}
        shadowColor="black"
        shadowOpacity={0.3}
      />
      <Text
        x={10}
        y={10}
        width={node.width - 20}
        height={node.height - 20}
        text={getText()}
        fontSize={14}
        fill="white"
        align="center"
        verticalAlign="middle"
        wrap="word"
      />
    </Group>
  );
}
