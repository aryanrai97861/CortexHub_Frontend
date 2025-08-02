// src/components/TeamWorkspace.tsx

"use client";

import React, { useState, useRef, useEffect } from 'react';

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
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden h-[90vh] border border-gray-700">

        {/* Top Bar: Workspace Info / Creation */}
        <div className="p-6 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-700">
          {!currentWorkspace ? (
            <>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="New workspace name"
                  value={workspaceNameInput}
                  onChange={(e) => setWorkspaceNameInput(e.target.value)}
                  className="p-2 rounded-lg bg-gray-600 border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                />
                <button
                  onClick={handleCreateWorkspace}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                >
                  Create Workspace
                </button>
              </div>
              <span className="text-gray-400">OR</span>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Join via invite link"
                  value={inviteLinkInput}
                  onChange={(e) => setInviteLinkInput(e.target.value)}
                  className="p-2 rounded-lg bg-gray-600 border border-gray-500 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                />
                <button
                  onClick={handleJoinWorkspace}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 w-full sm:w-auto"
                >
                  Join Workspace
                </button>
              </div>
            </>
          ) : (
            <div className="w-full text-center sm:text-left">
              <h2 className="text-3xl font-extrabold text-blue-300">
                {currentWorkspace.name}
              </h2>
              <p className="text-sm text-gray-400">
                Members: {currentWorkspace.members.join(', ')} | Invite Link:{" "}
                <span className="font-mono text-blue-400 text-xs break-all">
                  {currentWorkspace.inviteLink}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Main Content Area: Files & Chat */}
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel: Uploaded Files */}
          <div className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-800">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Shared Files</h3>
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
                Upload New File
              </label>
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-500 file:text-white
                           hover:file:bg-blue-600 cursor-pointer rounded-lg border border-gray-600 p-2"
                disabled={!currentWorkspace || uploadingFile}
              />
              {uploadingFile && (
                <p className="mt-2 text-sm text-blue-400 animate-pulse">Uploading and processing...</p>
              )}
            </div>

            <div className="flex-grow bg-gray-700 rounded-lg p-4 overflow-y-auto shadow-inner border border-gray-600">
              {currentWorkspace?.files.length === 0 ? (
                <p className="text-gray-400 text-sm">No files uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {currentWorkspace?.files.map((file) => (
                    <li key={file.id} className="bg-gray-600 p-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
                      <div>
                        <span className="font-medium text-gray-100">{file.name}</span>
                        <p className="text-xs text-gray-400">by {file.uploadedBy} at {file.timestamp}</p>
                      </div>
                      <span className="text-xs text-gray-400 uppercase bg-gray-700 px-2 py-1 rounded-full">{file.type}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Panel: AI Chat */}
          <div className="w-full md:w-3/4 flex flex-col p-6 bg-gray-800">
            <h3 className="text-xl font-bold text-gray-200 mb-4 text-center">Contextual AI Chat</h3>

            {/* Chat Messages Display */}
            <div ref={chatContainerRef} className="flex-grow bg-gray-700 p-4 rounded-lg overflow-y-auto shadow-inner mb-4 border border-gray-600">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">Create/join a workspace to start chatting!</p>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={msg.id}
                    className={`flex mb-4 ${msg.type === 'user' ? 'justify-end' : 'justify-start'} ${msg.isReply ? 'ml-8' : ''}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                        msg.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : msg.type === 'ai'
                          ? 'bg-gray-600 text-gray-100 rounded-bl-none'
                          : 'bg-gray-500 text-gray-200 rounded-lg' // System messages
                      }`}
                    >
                      <span className="font-semibold text-xs opacity-80 mb-1 block">
                        {msg.sender} <span className="font-normal text-gray-400">at {msg.timestamp}</span>
                      </span>
                      {msg.loading ? (
                        <span className="animate-pulse">Typing...</span>
                      ) : (
                        <>
                          {msg.text}
                          {msg.sources && msg.sources.length > 0 && (
                            <p className="text-xs mt-1 opacity-75 text-gray-300">
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
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={!currentWorkspace ? "Create or join a workspace to chat..." : (uploadingFile ? "Processing file, please wait..." : "Ask AI a question...")}
                className="flex-grow p-3 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                disabled={!currentWorkspace || uploadingFile}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!currentWorkspace || uploadingFile || inputMessage.trim() === ''}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamWorkspace;
