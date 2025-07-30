"use client"; // This directive is necessary for client-side interactivity in Next.js

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
  const [goalInput, setGoalInput] = useState<string>(''); // User's input for the agent's goal
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]); // Log of agent's actions and responses
  const [isAgentRunning, setIsAgentRunning] = useState<boolean>(false); // State to control agent's active status
  const logContainerRef = useRef<HTMLDivElement>(null); // Ref for scrolling log to bottom

  // Scroll to the bottom of the log container when new entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [agentLog]);

  // --- Simulated Agent Logic (Frontend Placeholder) ---
  const simulateAgentRun = async (goal: string): Promise<void> => {
    setIsAgentRunning(true);
    setAgentLog([]); // Clear previous log

    const addLogEntry = (entry: Omit<AgentLogEntry, 'id' | 'timestamp'>) => {
      setAgentLog((prev) => [
        ...prev,
        { id: `log-${Date.now()}-${Math.random()}`, timestamp: new Date().toLocaleTimeString(), ...entry },
      ]);
      return new Promise(resolve => setTimeout(resolve, 800)); // Simulate typing/processing delay
    };

    try {
      await addLogEntry({ type: 'goal', text: `Goal received: "${goal}"` });
      await addLogEntry({ type: 'status', text: 'Agent is planning steps...', loading: true });

      // Simulate Planning
      await new Promise(resolve => setTimeout(resolve, 2000)); // Longer delay for planning
      await addLogEntry({
        type: 'plan',
        text: 'Plan generated:',
        details: `1. Search for relevant information on the web.
2. Analyze search results to extract key data.
3. Synthesize information to form a comprehensive answer.
4. Present the final answer.`,
        loading: false
      });
      await addLogEntry({ type: 'status', text: 'Starting execution...' });

      // Simulate Tool Execution
      await new Promise(resolve => setTimeout(resolve, 1500));
      await addLogEntry({
        type: 'tool_execution',
        text: 'Executing Tool: Web Search',
        details: 'Query: "Latest trends in AI agent development"',
      });

      await new Promise(resolve => setTimeout(resolve, 2500));
      await addLogEntry({
        type: 'status',
        text: 'Analyzing search results...',
      });

      await new Promise(resolve => setTimeout(resolve, 2000));
      await addLogEntry({
        type: 'tool_execution',
        text: 'Executing Tool: Data Extraction',
        details: 'Extracted key trends and insights from 5 articles.',
      });

      // Simulate Adaptation/Outcome
      await new Promise(resolve => setTimeout(resolve, 1500));
      await addLogEntry({
        type: 'status',
        text: 'Synthesizing information and adapting based on findings...',
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      await addLogEntry({
        type: 'result',
        text: 'Goal achieved!',
        details: `The AI agent successfully gathered and synthesized information on "Latest trends in AI agent development". Key trends include advancements in multi-modal agents, improved long-term memory, and enhanced tool-use capabilities.`,
      });

    } catch (error: any) {
      await addLogEntry({
        type: 'error',
        text: 'An error occurred during agent execution.',
        details: error.message || 'Unknown error',
      });
    } finally {
      setIsAgentRunning(false);
    }
  };

  const handleStartAgent = (): void => {
    if (goalInput.trim() === '') return;
    simulateAgentRun(goalInput.trim());
    setGoalInput(''); // Clear input after starting
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
