import { Arrow } from 'react-konva';
import { CanvasEdge } from '@/types/nodes';
import { CanvasNode } from '@/types/nodes';

interface EdgeProps {
  edge: CanvasEdge;
  fromNode: CanvasNode;
  toNode: CanvasNode;
}

export function Edge({ edge, fromNode, toNode }: EdgeProps) {
  const getColor = () => {
    switch (edge.type) {
      case 'causality':
        return '#e74c3c';
      case 'hierarchy':
        return '#3498db';
      case 'reference':
        return '#95a5a6';
      default:
        return '#7f8c8d';
    }
  };

  // Вычисляем координаты стрелки
  const fromX = fromNode.x + fromNode.width / 2;
  const fromY = fromNode.y + fromNode.height / 2;
  const toX = toNode.x + toNode.width / 2;
  const toY = toNode.y + toNode.height / 2;

  return (
    <Arrow
      points={[fromX, fromY, toX, toY]}
      stroke={getColor()}
      strokeWidth={2}
      fill={getColor()}
      opacity={0.6}
      pointerLength={8}
      pointerWidth={8}
    />
  );
}
