"use client";

import React, { useState, useRef, useEffect } from 'react';

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
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const universalWorkspaceId = "universal-reader-workspace-id-002"; // Hardcoded ID for this workspace

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `file-${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'pending',
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setIsProcessingFiles(true);

    for (const file of newFiles) {
      setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, type: 'system', text: `Uploading and processing "${file.name}"...`, timestamp: new Date().toLocaleTimeString() }]);

      const formData = new FormData();
      formData.append('file', file as unknown as Blob);
      formData.append('workspaceId', universalWorkspaceId); // Send hardcoded workspace ID

      try {
        const response = await fetch('http://localhost:5000/api/universal-upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to process ${file.name}.`);
        }

        const data = await response.json();
        setUploadedFiles((prev) =>
          prev.map((f) => f.id === file.id ? { ...f, status: 'processed', documentId: data.documentId } : f)
        );
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}`, type: 'system', text: `"${file.name}" processed successfully!`, timestamp: new Date().toLocaleTimeString() }]);
      } catch (error: any) {
        console.error("File upload error:", error);
        setUploadedFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: 'failed' } : f)));
        setMessages((prevMessages) => [...prevMessages, { id: `msg-${Date.now()}`, type: 'system', text: `Error processing "${file.name}": ${error.message || 'Unknown error'}`, timestamp: new Date().toLocaleTimeString() }]);
      }
    }
    setIsProcessingFiles(false);
  };

  const getAiResponse = async (userQuery: string, processedDocIds: string[]): Promise<any> => {
    try {
      const payload = {
        query: userQuery,
        workspaceId: universalWorkspaceId, // Send hardcoded workspace ID
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
      return { analysisText: `Error: ${error.message || 'Could not get a response from AI.'}`, sources: [], nextSteps: [] };
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (inputMessage.trim() === '') return;

    const userQuery = inputMessage.trim();
    const processedDocIds = uploadedFiles.filter(f => f.status === 'processed' && f.documentId).map(f => f.documentId!);

    const newUserMessage: Message = { id: `msg-${Date.now()}`, type: 'user', text: userQuery, timestamp: new Date().toLocaleTimeString() };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');

    const aiLoadingMessageId = `msg-${Date.now()}-loading`;
    setMessages((prevMessages) => [...prevMessages, { id: aiLoadingMessageId, type: 'ai', text: '...', loading: true, timestamp: new Date().toLocaleTimeString() }]);

    const aiResponseContent = await getAiResponse(userQuery, processedDocIds);

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
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl flex flex-col overflow-hidden h-[90vh] border border-gray-700">
        <div className="p-6 border-b border-gray-700 text-center bg-gray-700">
          <h2 className="text-3xl font-extrabold text-blue-300">Universal Document Reader</h2>
          <p className="text-sm text-gray-400 mt-1">Upload any file, ask questions, get instant, cited answers.</p>
        </div>
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-1/4 p-6 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-800">
            <h3 className="text-xl font-bold text-gray-200 mb-4">Uploaded Files</h3>
            <div className="mb-4">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-300 mb-2">
                Drag & Drop or Choose Files
              </label>
              <input
                type="file"
                id="file-upload"
                multiple
                accept=".pdf,.doc,.docx,.csv,.xlsx,.txt"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-300
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-full file:border-0
                           file:text-sm file:font-semibold
                           file:bg-blue-500 file:text-white
                           hover:file:bg-blue-600 cursor-pointer rounded-lg border border-gray-600 p-2"
                disabled={isProcessingFiles}
              />
              {isProcessingFiles && (
                <p className="mt-2 text-sm text-blue-400 animate-pulse">Processing files, please wait...</p>
              )}
            </div>
            <div className="flex-grow bg-gray-700 rounded-lg p-4 overflow-y-auto shadow-inner border border-gray-600">
              {uploadedFiles.length === 0 ? (
                <p className="text-gray-400 text-sm">No files uploaded yet.</p>
              ) : (
                <ul className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <li key={file.id} className="bg-gray-600 p-3 rounded-lg flex justify-between items-center text-sm shadow-sm">
                      <div>
                        <span className="font-medium text-gray-100">{file.name}</span>
                        <p className="text-xs text-gray-400">
                          {file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        file.status === 'processed' ? 'bg-green-500 text-white' :
                        file.status === 'processing' ? 'bg-blue-500 text-white animate-pulse' :
                        file.status === 'failed' ? 'bg-red-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {file.status.toUpperCase()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="w-full md:w-3/4 flex flex-col p-6 bg-gray-800">
            <h3 className="text-xl font-bold text-gray-200 mb-4 text-center">Contextual Q&A</h3>
            <div ref={chatContainerRef} className="flex-grow bg-gray-700 p-4 rounded-lg overflow-y-auto shadow-inner mb-4 border border-gray-600">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">Upload files and ask questions about their content!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`mb-4 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl shadow-md ${
                      msg.type === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-600 text-gray-100 rounded-bl-none'
                    }`}>
                      <span className="font-semibold text-xs opacity-80 mb-1 block">
                        {msg.type === 'user' ? 'You' : 'AI'} <span className="font-normal text-gray-400">at {msg.timestamp}</span>
                      </span>
                      {msg.loading ? (
                        <span className="animate-pulse">Typing...</span>
                      ) : (
                        <>
                          {msg.content?.analysisText && (<p className="mb-2">{msg.content.analysisText}</p>)}
                          {msg.content?.chartData && (<div className="bg-gray-800 p-3 rounded-lg mt-2 mb-2 border border-gray-600">
                              <p className="font-medium text-blue-300">Chart Placeholder:</p>
                              <p className="text-sm text-gray-300 italic">{msg.content.chartData}</p>
                              <div className="w-full h-32 bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs mt-2">
                                [Visual Chart Rendered Here by Backend/Library]
                              </div>
                            </div>)}
                          {msg.content?.sources && msg.content.sources.length > 0 && (<div className="mt-2 text-xs text-gray-300">
                              <p className="font-semibold mb-1">Sources:</p>
                              <ul className="list-disc list-inside">
                                {msg.content.sources.map((source, idx) => (<li key={idx} className="mb-0.5">{source}</li>))}
                              </ul>
                            </div>)}
                          {msg.content?.nextSteps && msg.content.nextSteps.length > 0 && (<div className="mt-3 p-3 bg-gray-800 rounded-lg border border-yellow-500 shadow-md">
                              <p className="font-semibold text-yellow-300 mb-1">Suggested Next Steps:</p>
                              <ul className="list-disc list-inside text-sm text-gray-200">
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
            <div className="flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isProcessingFiles ? "Please wait for files to process..." : "Ask a question about your documents..."}
                className="flex-grow p-3 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                disabled={isProcessingFiles}
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isProcessingFiles || inputMessage.trim() === '' || uploadedFiles.filter(f => f.status === 'processed').length === 0}
              >
                Ask AI
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalReader;
