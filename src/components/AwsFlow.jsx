import React from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';

const initialNodes = [
  {
    id: '1',
    position: { x: 0, y: 0 },
    data: { label: '📁 S3 (Upload)' },
    style: { background: '#f0f9ff', border: '1px solid #3b82f6' }
  },
  {
    id: '2',
    position: { x: 0, y: 100 },
    data: { label: '🧩 API Gateway' },
    style: { background: '#fefce8', border: '1px solid #facc15' }
  },
  {
    id: '3',
    position: { x: 0, y: 200 },
    data: { label: '⚙️ Lambda (Análisis)' },
    style: { background: '#fef2f2', border: '1px solid #ef4444' }
  },
  {
    id: '4',
    position: { x: 0, y: 300 },
    data: { label: '🗃️ DynamoDB (Resultados)' },
    style: { background: '#ecfdf5', border: '1px solid #10b981' }
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

const AwsFlow = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default AwsFlow;
