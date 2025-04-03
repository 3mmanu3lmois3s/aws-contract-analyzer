import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// ✅ Mover nodos y edges FUERA del componente para evitar advertencias
const nodes = [
  {
    id: '1',
    data: { label: '📁 S3 (Upload)' },
    position: { x: 100, y: 0 },
    style: { background: '#ebf8ff', padding: 10, border: '1px solid #90cdf4' },
  },
  {
    id: '2',
    data: { label: '⚡ API Gateway' },
    position: { x: 100, y: 100 },
    style: { background: '#ffffcc', padding: 10, border: '1px solid #f6e05e' },
  },
  {
    id: '3',
    data: { label: '⚙️ Lambda (Análisis)' },
    position: { x: 100, y: 200 },
    style: { background: '#fee2e2', padding: 10, border: '1px solid #f56565' },
  },
  {
    id: '4',
    data: { label: '🗃️ DynamoDB (Resultados)' },
    position: { x: 100, y: 300 },
    style: { background: '#ccfbf1', padding: 10, border: '1px solid #38b2ac' },
  },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e3-4', source: '3', target: '4' },
];

function AwsFlow() {
  return (
    <div className="w-full h-[500px] rounded bg-white border shadow">
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default AwsFlow;
