"use client";

import React, { useState, useRef, useEffect } from 'react';
import KnowledgeGraphViewer from '../../components/knowledgeGraphViewer';


// --- Type Definitions ---
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  documentId?: string;
}

interface AiResponseContent {
  analysisText?: string;
  chartData?: string;
  sources?: string[];
  nextSteps?: string[];
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  content?: AiResponseContent;
  loading?: boolean;
}

const UniversalReader: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isProcessingFiles, setIsProcessingFiles] = useState<boolean>(false);
  const [showVisualizations, setShowVisualizations] = useState<boolean>(false);
  const [activeVisualizationTab, setActiveVisualizationTab] = useState<'graph' | 'chart'>('chart');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  // Hardcoded ID for this workspace, matches backend placeholder
  const universalWorkspaceId = "universal-reader-workspace-id-002";

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to handle file uploads
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Create a new array of files to upload
    const filesToUpload: File[] = Array.from(files);
    
    // Create a temporary state for files to show in UI
    const newFiles: UploadedFile[] = filesToUpload.map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'pending',
    }));
    setUploadedFiles((prev) => [...prev, ...newFiles]);

    setIsProcessingFiles(true); // Start global processing indicator

    for (const file of filesToUpload) {
      // Added unique ID for each message to avoid key conflicts
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}-${file.name}`, type: 'system', text: `Uploading and processing "${file.name}"...`, timestamp: new Date().toLocaleTimeString() }]);

      const formData = new FormData();
      // The as unknown as Blob cast is unnecessary and could cause issues. Reverted to a direct append.
      formData.append('file', file);
      formData.append('workspaceId', universalWorkspaceId); // Ensure workspaceId is also sent

      try {
        // Send a request for each file
        const response = await fetch('http://localhost:5000/api/universal-upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to process ${file.name}.`);
        }

        const data = await response.json();
        // Updated the state update logic to be more reliable by matching file name instead of a potentially stale ID
        setUploadedFiles((prev) =>
          prev.map((f) => f.name === file.name ? { ...f, status: 'processed', documentId: data.documentId } : f)
        );
        // Added unique ID for each message to avoid key conflicts
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}-${file.name}-success`, type: 'system', text: `"${file.name}" processed successfully!`, timestamp: new Date().toLocaleTimeString() }]);
      } catch (error: any) {
        console.error("File upload error:", error);
        setUploadedFiles((prev) => prev.map((f) => (f.name === file.name ? { ...f, status: 'failed' } : f)));
        // Ensure messages are updated in a closure that prevents stale state issues.
        setMessages((prevMessages) => [...prevMessages, { id: `msg-${Date.now()}-${file.name}-error`, type: 'system', text: `Error processing "${file.name}": ${error.message || 'Unknown error'}`, timestamp: new Date().toLocaleTimeString() }]);
      }
    }
    setIsProcessingFiles(false);
  };

  const getAiResponse = async (userQuery: string): Promise<any> => {
    try {
      const payload = {
        query: userQuery,
        workspaceId: universalWorkspaceId,
      };

      const response = await fetch('http://localhost:5000/api/universal-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to get AI response.');
      }
      return await response.json();
    } catch (error: any) {
      console.error("AI chat error:", error);
      return { answer: `Error: ${error.message || 'Could not get a response from AI.'}`, citations: [], nextSteps: [] };
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (inputMessage.trim() === '') return;

    const userQuery = inputMessage.trim();
    const newUserMessage: Message = { id: `msg-${Date.now()}`, type: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString() };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');

    const aiLoadingMessageId = `msg-${Date.now()}-loading`;
    setMessages((prevMessages) => [...prevMessages, { id: aiLoadingMessageId, type: 'ai', text: '...', loading: true, timestamp: new Date().toLocaleTimeString() }]);

    const aiResponseContent = await getAiResponse(userQuery);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const loadingMessageIndex = updatedMessages.findIndex(msg => msg.id === aiLoadingMessageId);
      if (loadingMessageIndex !== -1) {
        updatedMessages[loadingMessageIndex] = {
          id: aiLoadingMessageId,
          type: 'ai',
          text: aiResponseContent.answer || '',
          timestamp: new Date().toLocaleTimeString(),
          content: {
            analysisText: aiResponseContent.answer,
            chartData: aiResponseContent.chartData,
            sources: aiResponseContent.citations,
            nextSteps: aiResponseContent.nextSteps,
          },
          loading: false,
        };
      } else {
        updatedMessages.push({
          id: `msg-${Date.now()}`,
          type: 'ai',
          text: aiResponseContent.answer || '',
          timestamp: new Date().toLocaleTimeString(),
          content: {
            analysisText: aiResponseContent.answer,
            chartData: aiResponseContent.chartData,
            sources: aiResponseContent.citations,
            nextSteps: aiResponseContent.nextSteps,
          },
        });
      }
      return updatedMessages;
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !isProcessingFiles) {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {showVisualizations && (
        <KnowledgeGraphViewer 
          workspaceId={universalWorkspaceId} 
          onClose={() => setShowVisualizations(false)}
          initialActiveTab={activeVisualizationTab}
        />
      )}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden h-[90vh] border border-white/20 relative z-10">
        <div className="p-6 border-b border-white/20 bg-white/5 backdrop-blur-sm">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-4xl font-extrabold text-white">Universal Document Reader</h2>
            </div>
            <p className="text-lg text-blue-200 max-w-2xl mx-auto">Upload any file, ask questions, get instant, cited answers powered by advanced AI.</p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-6">
            <label className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl cursor-pointer transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Files
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="relative group">
              <button 
                onClick={() => {
                  setActiveVisualizationTab('chart');
                  setShowVisualizations(true);
                }}
                className="group bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Visualizations
              </button>
              <div className="absolute right-0 mt-1 w-56 bg-white/90 backdrop-blur-sm text-gray-800 rounded-xl shadow-2xl py-2 z-10 hidden group-hover:block border border-white/20">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVisualizationTab('chart');
                    setShowVisualizations(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-blue-50 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Relationship Chart
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveVisualizationTab('graph');
                    setShowVisualizations(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  View Knowledge Graph
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-white/20 flex flex-col bg-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Uploaded Files
            </h3>
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-blue-200 mb-3">
                Drag & Drop or Choose Files
              </label>
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.csv,.xlsx,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-white
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-600 file:text-white
                           hover:file:bg-blue-700 cursor-pointer rounded-lg border border-white/30 bg-white/10 p-3 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={isProcessingFiles}
              />
              {isProcessingFiles && (
                <div className="mt-3 flex items-center text-sm text-blue-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  Processing files, please wait...
                </div>
              )}
            </div>
            <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-xl p-4 overflow-y-auto shadow-inner border border-white/20">
              {uploadedFiles.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-blue-400/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-blue-200/70 text-sm">No files uploaded yet.</p>
                  <p className="text-blue-200/50 text-xs mt-1">Upload documents to get started</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <li key={file.id} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex justify-between items-center text-sm shadow-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <div>
                        <span className="font-medium text-white">{file.name}</span>
                        <p className="text-xs text-blue-200">
                          {file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        file.status === 'processed' ? 'bg-green-500/80 text-white border border-green-400/50' :
                        file.status === 'processing' ? 'bg-blue-500/80 text-white animate-pulse border border-blue-400/50' :
                        file.status === 'failed' ? 'bg-red-500/80 text-white border border-red-400/50' :
                        'bg-gray-500/80 text-white border border-gray-400/50'
                      }`}>
                        {file.status.toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="w-full md:w-3/4 flex flex-col p-6 bg-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contextual Q&A
            </h3>
            <div ref={chatContainerRef} className="flex-grow bg-white/5 backdrop-blur-sm p-4 rounded-xl overflow-y-auto shadow-inner mb-4 border border-white/20">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-purple-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-blue-200/70 text-lg">Upload files and ask questions about their content!</p>
                  <p className="text-blue-200/50 text-sm mt-2">Get instant, AI-powered insights from your documents</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                      msg.type === 'user' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg' 
                        : msg.type === 'system'
                        ? 'bg-gradient-to-r from-purple-600/80 to-purple-700/80 text-white rounded-lg backdrop-blur-sm'
                        : 'bg-white/20 backdrop-blur-sm text-white rounded-bl-none border border-white/30'
                    }`}>
                      <span className="font-semibold text-xs opacity-90 mb-1 flex items-center">
                        <div className="w-2 h-2 bg-current rounded-full mr-2 opacity-60"></div>
                        {msg.type === 'user' ? 'You' : msg.type === 'system' ? 'System' : 'AI'} 
                        <span className="font-normal opacity-70 ml-2">at {msg.timestamp}</span>
                      </span>
                      {msg.loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span className="animate-pulse">Typing...</span>
                        </div>
                      ) : (
                        <>
                          {msg.content?.analysisText && (<p className="mb-2">{msg.content.analysisText}</p>)}
                          {msg.content?.chartData && (<div className="bg-white/10 backdrop-blur-sm p-3 rounded-lg mt-2 mb-2 border border-white/30">
                              <p className="font-medium text-blue-300 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Chart Data:
                              </p>
                              <p className="text-sm text-blue-200 italic">{msg.content.chartData}</p>
                              <div className="w-full h-32 bg-white/5 rounded-md flex items-center justify-center text-blue-200/70 text-xs mt-2 border border-white/20">
                                [Visual Chart Rendered Here by Backend/Library]
                              </div>
                            </div>)}
                          {msg.content?.sources && msg.content.sources.length > 0 && (<div className="mt-2 text-xs text-blue-200 border-t border-white/20 pt-2">
                              <p className="font-semibold mb-1 flex items-center">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                Sources:
                              </p>
                              <ul className="list-disc list-inside">
                                {msg.content.sources.map((source, idx) => (<li key={idx} className="mb-0.5">{source}</li>))}
                              </ul>
                            </div>)}
                          {msg.content?.nextSteps && msg.content.nextSteps.length > 0 && (<div className="mt-3 p-3 bg-yellow-500/20 backdrop-blur-sm rounded-lg border border-yellow-400/50 shadow-md">
                              <p className="font-semibold text-yellow-300 mb-1 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                Suggested Next Steps:
                              </p>
                              <ul className="list-disc list-inside text-sm text-yellow-100">
                                {msg.content.nextSteps.map((step, idx) => (<li key={idx} className="mb-0.5">{step}</li>))}
                              </ul>
                            </div>)}
                          {!msg.content && msg.text && <p>{msg.text}</p>}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isProcessingFiles ? "Please wait for files to process..." : "Ask a question about your documents..."}
                className="flex-grow p-4 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/70 transition-all duration-200"
                disabled={isProcessingFiles}
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={isProcessingFiles || inputMessage.trim() === '' || uploadedFiles.filter(f => f.status === 'processed').length === 0}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalReader;