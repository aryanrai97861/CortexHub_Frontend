// src/components/TeamWorkspace.tsx

"use client";

import React, { useState, useRef, useEffect } from 'react';
import KnowledgeGraphViewer from '../../components/knowledgeGraphViewer';

// --- Type Definitions ---
interface Message {
  id: string; // Unique ID for the message
  type: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
  sender: string; // e.g., 'User A', 'AI'
  sources?: string[]; // For AI responses
  threadId?: string; // To group messages into threads (e.g., AI response and its follow-ups)
  isReply?: boolean; // To visually indent replies
  loading?: boolean; // To indicate if the AI message is currently being generated
}

interface UploadedFile {
  id: string;
  name: string;
  uploadedBy: string;
  timestamp: string;
  type: string; // e.g., 'pdf', 'note', 'slide'
}

interface Workspace {
  id: string;
  name: string;
  inviteLink: string;
  members: string[]; // List of member names/IDs
  files: UploadedFile[];
}

const TeamWorkspace: React.FC = () => {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaceNameInput, setWorkspaceNameInput] = useState<string>('');
  const [inviteLinkInput, setInviteLinkInput] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [showKnowledgeGraph, setShowKnowledgeGraph] = useState<boolean>(false);
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = "User A"; // Simulate current user

  // Scroll to the bottom of the chat container when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Workspace Management ---
  const handleCreateWorkspace = async (): Promise<void> => {
    if (workspaceNameInput.trim() === '') return;
    
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, type: 'system', text: `Creating workspace "${workspaceNameInput}"...`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
    ]);

    try {
      const response = await fetch('http://localhost:5000/api/workspaces/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceName: workspaceNameInput.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to create workspace.');
      }

      const data = await response.json();
      const newWorkspace: Workspace = {
        id: data.workspaceId,
        name: workspaceNameInput.trim(),
        inviteLink: data.inviteLink,
        members: [currentUser], // Start with the current user
        files: [], // Initially no files
      };

      setCurrentWorkspace(newWorkspace);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-success`,
          type: 'system',
          text: `Workspace "${newWorkspace.name}" created! Share this link to invite others: ${newWorkspace.inviteLink}`,
          timestamp: new Date().toLocaleTimeString(),
          sender: 'System',
        },
      ]);
      setWorkspaceNameInput('');
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-error`, type: 'system', text: `Error creating workspace: ${error.message}`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
      ]);
    }
  };

  const handleJoinWorkspace = async (): Promise<void> => {
    if (inviteLinkInput.trim() === '') return;

    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, type: 'system', text: `Attempting to join workspace via link...`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
    ]);

    try {
      // The API expects the inviteLink as a URL parameter
      const response = await fetch(`http://localhost:5000/api/workspaces/join/${inviteLinkInput.trim()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Invalid or expired invite link.');
      }

      const data = await response.json();
      const joinedWorkspace: Workspace = {
        id: data.workspaceId,
        name: data.workspaceName,
        inviteLink: data.inviteLink,
        members: ["User A", "User B", "User C"], // Simulate fetching existing members
        files: [], // Files will be fetched separately
      };
      
      // In a real app, you would also fetch the files for this workspace.
      // For this example, we'll simulate fetching documents as well.
      const filesResponse = await fetch(`http://localhost:5000/api/workspaces/${data.workspaceId}/documents`);
      const filesData = await filesResponse.json();
      joinedWorkspace.files = filesData.documents.map((doc: any) => ({
        id: doc._id,
        name: doc.filename,
        uploadedBy: doc.ownerId || 'Unknown',
        timestamp: new Date(doc.uploadedAt).toLocaleTimeString(),
        type: doc.originalType.split('/')[1] || 'unknown',
      }));

      setCurrentWorkspace(joinedWorkspace);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-success`,
          type: 'system',
          text: `Joined workspace "${joinedWorkspace.name}"!`,
          timestamp: new Date().toLocaleTimeString(),
          sender: 'System',
        },
      ]);
      setInviteLinkInput('');
    } catch (error: any) {
      console.error('Error joining workspace:', error);
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-error`, type: 'system', text: `Error joining workspace: ${error.message}`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
      ]);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file || !currentWorkspace) return;

    setUploadingFile(true);
    setMessages((prev) => [
      ...prev,
      { id: `msg-${Date.now()}`, type: 'system', text: `${currentUser} is uploading and processing "${file.name}"...`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
    ]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', currentWorkspace.id); // Pass workspaceId with the file
    
    try {
      const response = await fetch('http://localhost:5000/api/universal-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process file.');
      }

      const data = await response.json();
      const newFile: UploadedFile = {
        id: data.documentId, // Use the new documentId from the backend
        name: file.name,
        uploadedBy: currentUser,
        timestamp: new Date().toLocaleTimeString(),
        type: file.type.split('/')[1] || 'unknown',
      };

      setCurrentWorkspace((prev) => prev ? { ...prev, files: [...prev.files, newFile] } : null);
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-success`, type: 'system', text: `"${newFile.name}" uploaded by ${currentUser} and processed successfully!`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
      ]);
    } catch (error: any) {
      console.error("File upload error:", error);
      setMessages((prev) => [
        ...prev,
        { id: `msg-${Date.now()}-error`, type: 'system', text: `Error uploading "${file.name}": ${error.message || 'Unknown error'}`, timestamp: new Date().toLocaleTimeString(), sender: 'System' },
      ]);
    } finally {
      setUploadingFile(false);
    }
  };


  const getAiResponse = async (userMessage: string, lastMessageId?: string): Promise<Message> => {
    if (!currentWorkspace) {
      return { id: `msg-${Date.now()}`, type: 'ai', text: 'Please create or join a workspace first.', timestamp: new Date().toLocaleTimeString(), sender: 'AI', threadId: lastMessageId };
    }

    try {
      const payload = {
        query: userMessage,
        workspaceId: currentWorkspace.id, // Pass workspaceId to the backend
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

      const data = await response.json();
      const aiText = data.answer || "I'm sorry, I couldn't find an answer based on the provided context.";
      const aiSources = data.citations || [];

      return {
        id: `msg-${Date.now()}`,
        type: 'ai',
        text: aiText,
        timestamp: new Date().toLocaleTimeString(),
        sender: 'AI',
        sources: aiSources,
        threadId: lastMessageId || `thread-${Date.now()}`,
      };
    } catch (error: any) {
      console.error("AI chat error:", error);
      return {
        id: `msg-${Date.now()}`,
        type: 'ai',
        text: `Error: ${error.message || 'Could not get a response from AI.'}`,
        timestamp: new Date().toLocaleTimeString(),
        sender: 'AI',
        threadId: lastMessageId,
      };
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (inputMessage.trim() === '') return;

    const currentMessageId = `msg-${Date.now()}`;
    const newUserMessage: Message = {
      id: currentMessageId,
      type: 'user',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString(),
      sender: currentUser,
      threadId: messages.length > 0 ? messages[messages.length - 1].threadId : currentMessageId,
      isReply: messages.length > 0 && messages[messages.length - 1].type === 'ai',
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');

    const aiLoadingMessageId = `msg-${Date.now()}-loading`;
    setMessages((prevMessages) => [
      ...prevMessages,
      { id: aiLoadingMessageId, type: 'ai', text: '...', loading: true, timestamp: new Date().toLocaleTimeString(), sender: 'AI', threadId: newUserMessage.threadId },
    ]);

    const aiResponse = await getAiResponse(newUserMessage.text, newUserMessage.threadId);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const loadingMessageIndex = updatedMessages.findIndex(msg => msg.id === aiLoadingMessageId);
      if (loadingMessageIndex !== -1) {
        updatedMessages[loadingMessageIndex] = aiResponse;
      } else {
        updatedMessages.push(aiResponse);
      }
      return updatedMessages;
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter' && !uploadingFile) {
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
      
      {showKnowledgeGraph && currentWorkspace && ( // My Comment: Conditionally render the graph viewer
        <KnowledgeGraphViewer
          workspaceId={currentWorkspace.id}
          onClose={() => setShowKnowledgeGraph(false)}
        />
      )}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-7xl flex flex-col overflow-hidden h-[90vh] border border-white/20 relative z-10">

        {/* Top Bar: Workspace Info / Creation */}
        <div className="p-6 border-b border-white/20 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 backdrop-blur-sm">
          {!currentWorkspace ? (
            <div className="w-full">
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-white mb-2">Team Collaboration Hub</h1>
                <p className="text-blue-200">Create or join a workspace to start collaborating</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="New workspace name"
                  value={workspaceNameInput}
                  onChange={(e) => setWorkspaceNameInput(e.target.value)}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent w-full sm:w-auto transition-all duration-200"
                />
                <button
                  onClick={handleCreateWorkspace}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 w-full sm:w-auto shadow-lg transform hover:scale-105"
                >
                  Create Workspace
                </button>
              </div>
              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-white/20"></div>
                <span className="px-4 text-blue-200/70 text-sm">OR</span>
                <div className="flex-grow h-px bg-white/20"></div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Join via invite link"
                  value={inviteLinkInput}
                  onChange={(e) => setInviteLinkInput(e.target.value)}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/30 text-white placeholder-blue-200/70 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent w-full sm:w-auto transition-all duration-200"
                />
                <button
                  onClick={handleJoinWorkspace}
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 w-full sm:w-auto shadow-lg transform hover:scale-105"
                >
                  Join Workspace
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-white mb-2 flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    {currentWorkspace.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center text-blue-200">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Members: {currentWorkspace.members.join(', ')}
                    </div>
                    <div className="flex items-center text-blue-300">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="font-mono text-xs break-all bg-white/10 px-2 py-1 rounded">
                        {currentWorkspace.inviteLink}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowKnowledgeGraph(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium py-2 px-4 rounded-xl transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  View Graph
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Area: Files & Chat */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Uploaded Files */}
          <div className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-white/20 flex flex-col bg-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Shared Files
            </h3>
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-blue-200 mb-3">
                Upload New File
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                className="block w-full text-sm text-white
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-600 file:text-white
                           hover:file:bg-blue-700 cursor-pointer rounded-lg border border-white/30 bg-white/10 p-3 backdrop-blur-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                disabled={!currentWorkspace || uploadingFile}
              />
              {uploadingFile && (
                <div className="mt-3 flex items-center text-sm text-blue-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                  Uploading and processing...
                </div>
              )}
            </div>

            <div className="flex-grow bg-white/5 backdrop-blur-sm rounded-xl p-4 overflow-y-auto shadow-inner border border-white/20">
              {currentWorkspace?.files.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-blue-400/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-blue-200/70 text-sm">No files uploaded yet.</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {currentWorkspace?.files.map((file) => (
                    <li key={file.id} className="bg-white/10 backdrop-blur-sm p-3 rounded-lg flex justify-between items-center text-sm shadow-sm border border-white/20 hover:bg-white/20 transition-all duration-200">
                      <div>
                        <span className="font-medium text-white">{file.name}</span>
                        <p className="text-xs text-blue-200">by {file.uploadedBy} at {file.timestamp}</p>
                      </div>
                      <span className="text-xs text-blue-300 uppercase bg-blue-600/30 px-2 py-1 rounded-full border border-blue-400/30">{file.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Panel: AI Chat */}
          <div className="w-full md:w-3/4 flex flex-col p-6 bg-white/5 backdrop-blur-sm">
            <h3 className="text-xl font-bold text-white mb-4 text-center flex items-center justify-center">
              <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contextual AI Chat
            </h3>

            {/* Chat Messages Display */}
            <div ref={chatContainerRef} className="flex-grow bg-white/5 backdrop-blur-sm p-4 rounded-xl overflow-y-auto shadow-inner mb-4 border border-white/20">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-purple-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-blue-200/70 text-lg">Create/join a workspace to start chatting!</p>
                  <p className="text-blue-200/50 text-sm mt-2">Collaborate with your team using AI-powered insights</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.isReply ? 'ml-8' : ''}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                        msg.type === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg'
                          : msg.type === 'ai'
                          ? 'bg-white/20 backdrop-blur-sm text-white rounded-bl-none border border-white/30'
                          : 'bg-gradient-to-r from-purple-600/80 to-purple-700/80 text-white rounded-lg backdrop-blur-sm' // System messages
                      }`}
                    >
                      <span className="font-semibold text-xs opacity-90 mb-1 flex items-center">
                        <div className="w-2 h-2 bg-current rounded-full mr-2 opacity-60"></div>
                        {msg.sender} <span className="font-normal opacity-70 ml-2">at {msg.timestamp}</span>
                      </span>
                      {msg.loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          <span className="animate-pulse">Typing...</span>
                        </div>
                      ) : (
                        <>
                          {msg.text}
                          {msg.sources && msg.sources.length > 0 && (
                            <p className="text-xs mt-2 opacity-75 border-t border-white/20 pt-2">
                              Sources: {msg.sources.join(', ')}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={!currentWorkspace ? "Create or join a workspace to chat..." : (uploadingFile ? "Processing file, please wait..." : "Ask AI a question...")}
                className="flex-grow p-4 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/70 transition-all duration-200"
                disabled={!currentWorkspace || uploadingFile}
              />
              <button
                onClick={handleSendMessage}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                disabled={!currentWorkspace || uploadingFile || inputMessage.trim() === ''}
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

export default TeamWorkspace;
