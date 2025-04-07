import React from "react";
import ReactFlow, { Background, Controls, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";

function AwsFlow({ activeNodeId }) {
  // Función que devuelve estilos dependiendo del nodo activo
  const getStyle = (nodeId, defaultColor, activeColor, borderColor) => ({
    background: activeNodeId === nodeId ? activeColor : defaultColor,
    padding: 10,
    border: `2px solid ${borderColor}`,
    boxShadow:
      activeNodeId === nodeId
        ? "0 0 10px rgba(0, 0, 0, 0.3)"
        : "0 0 0 rgba(0, 0, 0, 0)",
    transition: "all 0.3s ease-in-out",
  });

  const nodes = [
    {
      id: "1",
      data: { label: "📁 S3 (Upload)" },
      position: { x: 100, y: 0 },
      style: getStyle("1", "#ebf8ff", "#bae6fd", "#3182ce"),
    },
    {
      id: "2",
      data: { label: "⚡ API Gateway" },
      position: { x: 100, y: 100 },
      style: getStyle("2", "#ffffcc", "#fef08a", "#d69e2e"),
    },
    {
      id: "3",
      data: { label: "⚙️ Lambda (Análisis)" },
      position: { x: 100, y: 200 },
      style: getStyle("3", "#fee2e2", "#fecaca", "#e53e3e"),
    },
    {
      id: "4",
      data: { label: "🗃️ DynamoDB (Resultados)" },
      position: { x: 100, y: 300 },
      style: getStyle("4", "#ccfbf1", "#99f6e4", "#2c7a7b"),
    },
  ];

  const edges = [
    { id: "e1-2", source: "1", target: "2" },
    { id: "e2-3", source: "2", target: "3" },
    { id: "e3-4", source: "3", target: "4" },
  ];

  return (
    <div className="w-full h-full rounded bg-white border shadow">
      <ReactFlowProvider>
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}

export default AwsFlow;
