"use client";

import React, { useState, useRef, useEffect } from 'react';

// --- Type Definitions ---
interface AgentLogEntry {
  id: string; // Unique ID for the log entry
  type: 'goal' | 'plan' | 'tool_execution' | 'status' | 'result' | 'error';
  text: string;
  timestamp: string;
  details?: string; // Optional details for plans, tool outputs, errors
  loading?: boolean; // For typing/processing indicators
}

const AgentBuilder: React.FC = () => {
  const [goalInput, setGoalInput] = useState<string>('');
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLog]);

  const handleStartAgent = async (): Promise<void> => {
    if (goalInput.trim() === '') return;

    setIsAgentRunning(true);
    setAgentLog([]);
    setAgentLog((prev) => [...prev, { id: `log-${Date.now()}`, type: 'goal', text: `Goal received: "${goalInput.trim()}"`, timestamp: new Date().toLocaleTimeString() }]);
    setAgentLog((prev) => [...prev, { id: `log-${Date.now()}-loading`, type: 'status', text: 'Agent is planning steps...', loading: true, timestamp: new Date().toLocaleTimeString() }]);

    try {
      const response = await fetch('http://localhost:5000/api/agents/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to start agent.');
      }

      const data = await response.json();
      setAgentLog((prev) => {
        const updatedLog = [...prev];
        const loadingIndex = updatedLog.findIndex(entry => entry.loading);
        if (loadingIndex !== -1) {
          updatedLog.splice(loadingIndex, 1); // Remove loading state
        }
        return [...updatedLog, ...data.log]; // Add the full log from the backend
      });
    } catch (error: any) {
      console.error("Agent execution error:", error);
      setAgentLog((prev) => {
        const updatedLog = [...prev];
        const loadingIndex = updatedLog.findIndex(entry => entry.loading);
        if (loadingIndex !== -1) {
          updatedLog.splice(loadingIndex, 1);
        }
        return [...updatedLog, { id: `log-${Date.now()}-error`, type: 'error', text: `Agent execution failed: ${error.message}`, timestamp: new Date().toLocaleTimeString() }];
      });
    } finally {
      setIsAgentRunning(false);
      setGoalInput('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !isAgentRunning) {
      handleStartAgent();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden h-[90vh] border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700 text-center bg-gray-700">
          <h2 className="text-3xl font-extrabold text-blue-300">AI Agent Builder</h2>
          <p className="text-sm text-gray-400 mt-1">Define goals, watch agents plan & execute tasks.</p>
        </div>
        {/* Agent Log Display */}
        <div ref={logContainerRef} className="flex-grow bg-gray-800 p-6 overflow-y-auto shadow-inner">
          {agentLog.length === 0 ? (
            <p className="text-gray-500 text-center text-sm mt-8">
              Enter a goal below to start building your autonomous agent!
            </p>
          ) : (
            agentLog.map((entry) => (
              <div key={entry.id} className={`mb-4 p-3 rounded-lg shadow-md ${
                entry.type === 'goal' ? 'bg-blue-900 text-blue-100' :
                entry.type === 'plan' ? 'bg-indigo-900 text-indigo-100' :
                entry.type === 'tool_execution' ? 'bg-purple-900 text-purple-100' :
                entry.type === 'status' ? 'bg-gray-700 text-gray-200' :
                entry.type === 'result' ? 'bg-green-700 text-green-100' :
                entry.type === 'error' ? 'bg-red-700 text-red-100' :
                'bg-gray-700 text-gray-200'
              }`}>
                <div className="flex justify-between items-center text-xs opacity-80 mb-1">
                  <span className="font-semibold uppercase">{entry.type.replace('_', ' ')}</span>
                  <span className="text-gray-400">{entry.timestamp}</span>
                </div>
                <p className="font-medium">{entry.text}</p>
                {entry.details && (
                  <pre className="mt-2 p-2 bg-gray-900 rounded-md text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap">
                    {entry.details}
                  </pre>
                )}
                {entry.loading && (
                  <span className="mt-2 block text-xs animate-pulse">Processing...</span>
                )}
              </div>
            ))
          )}
        </div>
        {/* Goal Input */}
        <div className="p-6 border-t border-gray-700 bg-gray-700 flex items-center gap-4">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAgentRunning ? "Agent is running..." : "Enter your agent's goal (e.g., 'Research AI trends')..."}
            className="flex-grow p-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-600 text-white placeholder-gray-400"
            disabled={isAgentRunning}
          />
          <button
            onClick={handleStartAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isAgentRunning || goalInput.trim() === ''}
          >
            {isAgentRunning ? 'Running...' : 'Start Agent'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilder;
