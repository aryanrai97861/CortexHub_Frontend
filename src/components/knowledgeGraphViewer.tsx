"use client";

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the BarChartComponent with SSR disabled
const BarChartComponent = dynamic(
  () => import('./BarChartComponent'),
  { ssr: false }
);

// Define types for the graph data
interface Concept {
  id: string;
  name: string;
  description?: string;
}

interface Relationship {
  source: string;
  target: string;
  type: string;
  description?: string;
}

interface KnowledgeGraphData {
  concepts: Concept[];
  relationships: Relationship[];
}

interface KnowledgeGraphViewerProps {
  workspaceId: string;
  onClose: () => void;
  initialActiveTab?: 'graph' | 'chart';
}

const KnowledgeGraphViewer: React.FC<KnowledgeGraphViewerProps> = ({ workspaceId, onClose, initialActiveTab = 'graph' }) => {
  const [graphData, setGraphData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'chart'>(initialActiveTab);

  useEffect(() => {
    // Automatically generate the graph when the component mounts
    generateGraph();
  }, [workspaceId]);

  const generateGraph = async () => {
    setLoading(true);
    setError(null);

    try {
      // This is the fetch call to the new backend API endpoint.
      const response = await fetch('http://localhost:5000/api/generate-knowledge-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate knowledge graph.');
      }

      const data = await response.json();
      setGraphData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderGraph = () => {
    if (loading) {
      return <div className="text-center text-blue-400 p-8">Generating graph...</div>;
    }
    if (error) {
      return <div className="text-center text-red-400 p-8">Error: {error}</div>;
    }
    if (!graphData || graphData.concepts.length === 0) {
      return <div className="text-center text-gray-400 p-8">No concepts found to generate a graph.</div>;
    }

    // A simple, visual graph rendering using inline SVG
    return (
      <div className="relative w-full h-full p-4 overflow-auto">
        <svg className="w-full h-full" viewBox="0 0 800 600">
          {/* Render relationships as lines */}
          {graphData.relationships.map((rel, index) => {
            const sourceNode = graphData.concepts.find(c => c.id === rel.source);
            const targetNode = graphData.concepts.find(c => c.id === rel.target);
            if (!sourceNode || !targetNode) return null;

            // My Comment: Simple placeholder positions for visualization
            const sourcePos = { x: 100 + index * 50, y: 100 + index * 100 };
            const targetPos = { x: 500 + index * 30, y: 300 - index * 50 };

            return (
              <g key={index}>
                <line
                  x1={sourcePos.x} y1={sourcePos.y}
                  x2={targetPos.x} y2={targetPos.y}
                  stroke="#4b5563" strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(sourcePos.x + targetPos.x) / 2} y={(sourcePos.y + targetPos.y) / 2 - 5}
                  fontSize="12" fill="#9ca3af" textAnchor="middle"
                >
                  {rel.type}
                </text>
              </g>
            );
          })}
          
          {/* Render concepts as circles and text */}
          {graphData.concepts.map((concept, index) => {
            // My Comment: Use the same placeholder positions for rendering nodes
            const pos = { x: 100 + index * 50, y: 100 + index * 100 };

            return (
              <g key={concept.id}>
                <circle cx={pos.x} cy={pos.y} r="30" fill="#2563eb" stroke="#3b82f6" strokeWidth="2" />
                <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="middle" fill="#e0e7ff" fontSize="14">
                  {concept.name}
                </text>
              </g>
            );
          })}

          <defs>
            <marker id="arrowhead" viewBox="0 -5 10 10" refX="8" refY="0" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,-5L10,0L0,5" fill="#4b5563" />
            </marker>
          </defs>
        </svg>
      </div>
    );
  };

  // Generate bar chart data from the graph data
  const barChartData = useMemo(() => {
    if (!graphData) return [];
    
    // Count relationships per concept
    const conceptMap = new Map<string, number>();
    
    // Initialize all concepts with 0 relationships
    graphData.concepts.forEach(concept => {
      conceptMap.set(concept.id, 0);
    });
    
    // Count relationships for each concept
    graphData.relationships.forEach(rel => {
      conceptMap.set(rel.source, (conceptMap.get(rel.source) || 0) + 1);
      conceptMap.set(rel.target, (conceptMap.get(rel.target) || 0) + 1);
    });
    
    // Convert to array of {name, value} objects
    return Array.from(conceptMap.entries()).map(([conceptId, count]) => {
      const concept = graphData.concepts.find(c => c.id === conceptId);
      return {
        name: concept?.name || conceptId,
        value: count
      };
    });
  }, [graphData]);

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-5/6 flex flex-col p-6">
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-200">Knowledge Visualization</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-4">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'graph' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('graph')}
          >
            Knowledge Graph
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${activeTab === 'chart' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-200'}`}
            onClick={() => setActiveTab('chart')}
          >
            Relationship Chart
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden">
          {activeTab === 'graph' ? (
            <div className="h-full">
              {renderGraph()}
            </div>
          ) : (
            <div className="h-full p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-blue-400">Loading chart data...</div>
                </div>
              ) : error ? (
                <div className="text-center text-red-400 p-8">Error: {error}</div>
              ) : (
                <BarChartComponent 
                  data={barChartData}
                  title="Concept Relationships"
                  xAxisLabel="Concepts"
                  yAxisLabel="Number of Relationships"
                  barColor="#3b82f6"
                  height={500}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraphViewer;
