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
    } catch (error: unknown) {
      console.error("Agent execution error:", error);
      setAgentLog((prev) => {
        const updatedLog = [...prev];
        const loadingIndex = updatedLog.findIndex(entry => entry.loading);
        if (loadingIndex !== -1) {
          updatedLog.splice(loadingIndex, 1);
        }
        return [...updatedLog, { id: `log-${Date.now()}-error`, type: 'error', text: `Agent execution failed: ${error instanceof Error ? error.message:String(error)}`, timestamp: new Date().toLocaleTimeString() }];
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden h-[90vh] border border-white/20 relative z-10">
        {/* Header */}
        <div className="p-6 border-b border-white/20 text-center bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mr-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-4xl font-extrabold text-white">AI Agent Builder</h2>
          </div>
          <p className="text-lg text-blue-200 max-w-2xl mx-auto">Define goals, watch intelligent agents plan & execute complex tasks autonomously.</p>
          
          {/* Status indicators */}
          <div className="flex justify-center items-center mt-6 space-x-6">
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-300">LangGraph Ready</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-blue-300">Gemini Connected</span>
            </div>
            <div className="flex items-center text-sm">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-2 animate-pulse"></div>
              <span className="text-purple-300">Tools Available</span>
            </div>
          </div>
        </div>
        {/* Agent Log Display */}
        <div ref={logContainerRef} className="flex-grow bg-white/5 backdrop-blur-sm p-6 overflow-y-auto shadow-inner">
          {agentLog.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 text-green-400/50 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h3 className="text-2xl font-bold text-white mb-3">Ready to Build</h3>
              <p className="text-blue-200/70 text-lg max-w-md mx-auto mb-6">
                Enter a goal below to start building your autonomous agent!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h4 className="font-semibold text-blue-300 mb-2">Example Goals:</h4>
                  <ul className="text-blue-200/80 space-y-1 text-left">
                    <li>• Research AI trends in 2024</li>
                    <li>• Analyze competitor pricing</li>
                    <li>• Generate market report</li>
                  </ul>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <h4 className="font-semibold text-green-300 mb-2">Agent Capabilities:</h4>
                  <ul className="text-green-200/80 space-y-1 text-left">
                    <li>• Web research & analysis</li>
                    <li>• Data processing</li>
                    <li>• Report generation</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            agentLog.map((entry) => (
              <div key={entry.id} className={`mb-4 p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
                entry.type === 'goal' ? 'bg-blue-600/20 text-blue-100 border-blue-400/30' :
                entry.type === 'plan' ? 'bg-indigo-600/20 text-indigo-100 border-indigo-400/30' :
                entry.type === 'tool_execution' ? 'bg-purple-600/20 text-purple-100 border-purple-400/30' :
                entry.type === 'status' ? 'bg-white/10 text-gray-200 border-white/20' :
                entry.type === 'result' ? 'bg-green-600/20 text-green-100 border-green-400/30' :
                entry.type === 'error' ? 'bg-red-600/20 text-red-100 border-red-400/30' :
                'bg-white/10 text-gray-200 border-white/20'
              }`}>
                <div className="flex justify-between items-center text-xs opacity-90 mb-2">
                  <span className="font-semibold uppercase flex items-center">
                    {entry.type === 'goal' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {entry.type === 'plan' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    {entry.type === 'tool_execution' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    {entry.type === 'result' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {entry.type === 'error' && <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    {entry.type.replace('_', ' ')}
                  </span>
                  <span className="opacity-70">{entry.timestamp}</span>
                </div>
                <p className="font-medium leading-relaxed">{entry.text}</p>
                {entry.details && (
                  <pre className="mt-3 p-3 bg-black/30 backdrop-blur-sm rounded-lg text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap border border-white/10">
                    {entry.details}
                  </pre>
                )}
                {entry.loading && (
                  <div className="mt-3 flex items-center text-xs">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                    <span className="animate-pulse">Processing...</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {/* Goal Input */}
        <div className="p-6 border-t border-white/20 bg-white/5 backdrop-blur-sm flex items-center gap-4">
          <input
            type="text"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isAgentRunning ? "Agent is running..." : "Enter your agent's goal (e.g., 'Research AI trends')..."}
            className="flex-grow p-4 rounded-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/70 transition-all duration-200"
            disabled={isAgentRunning}
          />
          <button
            onClick={handleStartAgent}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center"
            disabled={isAgentRunning || goalInput.trim() === ''}
          >
            {isAgentRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m2 2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v9a2 2 0 002 2z" />
                </svg>
                Start Agent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentBuilder;
