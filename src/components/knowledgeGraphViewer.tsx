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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl h-5/6 flex flex-col p-6 border border-white/20">
        <div className="flex justify-between items-center border-b border-white/20 pb-4 mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white">Knowledge Visualization</h3>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-white/20 mb-4">
          <button
            className={`px-6 py-3 font-medium text-sm rounded-t-xl transition-all duration-200 flex items-center ${
              activeTab === 'graph' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('graph')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Knowledge Graph
          </button>
          <button
            className={`px-6 py-3 font-medium text-sm rounded-t-xl transition-all duration-200 flex items-center ${
              activeTab === 'chart' 
                ? 'text-blue-400 border-b-2 border-blue-400 bg-white/5' 
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setActiveTab('chart')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Relationship Chart
          </button>
        </div>
        
        <div className="flex-grow overflow-hidden bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20">
          {activeTab === 'graph' ? (
            <div className="h-full">
              {renderGraph()}
            </div>
          ) : (
            <div className="h-full p-4">
              {loading ? (
                <div className="flex items-center justify-center h-full text-blue-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mr-3"></div>
                  Loading chart data...
                </div>
              ) : error ? (
                <div className="text-center text-red-400 p-8 flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Error: {error}
                </div>
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
