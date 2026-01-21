import { Stage, Layer } from 'react-konva';
import { useRef, useState, useEffect } from 'react';
import { Node } from './Node';
import { Edge } from './Edge';
import { projectionService } from '@/services/projection';
import { eventLogService } from '@/services/eventLog';
import { CanvasNode, CanvasEdge } from '@/types/nodes';

export function Canvas() {
  const stageRef = useRef<any>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [failureLens, setFailureLens] = useState(false);

  useEffect(() => {
    // Загружаем события и проецируем на холст
    loadProjection();
  }, [failureLens]);

  const loadProjection = async () => {
    try {
      const events = await eventLogService.readEvents();
      const projection = failureLens
        ? projectionService.projectFailureLens(events)
        : projectionService.projectEvents(events);
      
      setNodes(projection.nodes);
      setEdges(projection.edges);
    } catch (error) {
      console.error('Failed to load projection:', error);
    }
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    setZoom(newScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setPosition(newPos);
  };

  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f0f0f', position: 'relative' }}>
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: '#1a1a1a',
        padding: '10px',
        borderRadius: '8px',
      }}>
        <button
          onClick={() => setFailureLens(!failureLens)}
          style={{
            background: failureLens ? '#e74c3c' : '#2c3e50',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {failureLens ? 'Failure Lens ON' : 'Failure Lens OFF'}
        </button>
      </div>
      
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={zoom}
        scaleY={zoom}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        draggable
        onDragEnd={(e) => {
          setPosition({ x: e.target.x(), y: e.target.y() });
        }}
      >
        <Layer>
          {/* Рисуем связи */}
          {edges.map(edge => {
            const fromNode = getNodeById(edge.from);
            const toNode = getNodeById(edge.to);
            if (!fromNode || !toNode) return null;
            return <Edge key={edge.id} edge={edge} fromNode={fromNode} toNode={toNode} />;
          })}
          
          {/* Рисуем узлы */}
          {nodes.map(node => (
            <Node key={node.id} node={node} />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
