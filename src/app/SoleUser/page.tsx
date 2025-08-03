"use client";

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  type: 'user' | 'ai' | 'system';
  text: string;
  loading?: boolean;
  sources?: string[];
}

const SoleUser: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processingPdf, setProcessingPdf] = useState<boolean>(false);
  const [processedDocumentId, setProcessedDocumentId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const soloWorkspaceId = "solo-user-workspace-id-001"; // Hardcoded ID for solo user's workspace

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessages((prevMessages) => [...prevMessages, { type: 'system', text: 'Please upload a valid PDF file.' }]);
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setProcessingPdf(true);
    setMessages((prevMessages) => [...prevMessages, { type: 'system', text: `Uploading and processing PDF: ${file.name}...` }]);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('workspaceId', soloWorkspaceId); // Send hardcoded workspace ID

    try {
      const response = await fetch('http://localhost:5000/api/universal-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process PDF.');
      }

      const data = await response.json();
      setProcessedDocumentId(data.documentId);
      setMessages((prevMessages) => [...prevMessages, { type: 'system', text: `PDF "${file.name}" processed successfully! Document ID: ${data.documentId}` }]);
    } catch (error: unknown) {
      console.error("PDF upload error:", error);
      setMessages((prevMessages) => [...prevMessages, { type: 'system', text: `Error processing PDF: ${error instanceof Error ? error.message || 'Unknown error':String(error)}` }]);
      setPdfFile(null);
      setProcessedDocumentId(null);
    } finally {
      setProcessingPdf(false);
    }
  };

  const getAiResponse = async (userMessage: string): Promise<string> => {
    try {
      const payload = {
        query: userMessage,
        workspaceId: soloWorkspaceId, // Send hardcoded workspace ID
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
      return data.answer + (data.citations ? ` (Sources: ${data.citations.join(', ')})` : '');
    } catch (error: unknown) {
      console.error("AI chat error:", error);
      return `Error: ${error instanceof Error ? error.message || 'Could not get a response from AI.':String(error)}`;
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    if (inputMessage.trim() === '') return;

    const newUserMessage: Message = { type: 'user', text: inputMessage.trim() };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setInputMessage('');

    setMessages((prevMessages) => [...prevMessages, { type: 'ai', text: '...', loading: true }]);

    const aiResponseText = await getAiResponse(newUserMessage.text);

    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const loadingMessageIndex = updatedMessages.findIndex(msg => msg.loading);
      if (loadingMessageIndex !== -1) {
        updatedMessages[loadingMessageIndex] = { type: 'ai', text: aiResponseText, loading: false };
      } else {
        updatedMessages.push({ type: 'ai', text: aiResponseText });
      }
      return updatedMessages;
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col md:flex-row overflow-hidden h-[90vh] border border-white/20 relative">
        {/* Left Panel: PDF Upload Section */}
        <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-white/20 flex flex-col bg-white/5 backdrop-blur-sm">
          <div className="flex items-center justify-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Document Center</h2>
          </div>
          <div className="mb-6">
            <label htmlFor="pdf-upload" className="block text-sm font-medium text-blue-200 mb-3">
              Upload PDF
            </label>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="block w-full text-sm text-white
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-600 file:text-white
                         hover:file:bg-blue-700 cursor-pointer rounded-lg border border-white/30 bg-white/10 p-3 backdrop-blur-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
              disabled={processingPdf}
            />
            {pdfFile && (
              <p className="mt-3 text-sm text-blue-200">
                Selected: <span className="font-medium text-blue-300">{pdfFile.name}</span>
              </p>
            )}
            {processingPdf && (
              <div className="mt-3 flex items-center text-sm text-blue-300">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                Processing PDF, please wait...
              </div>
            )}
          </div>
          <div className="flex-grow border border-white/30 rounded-xl p-4 bg-white/5 backdrop-blur-sm overflow-y-auto shadow-inner">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Processed Documents
            </h3>
            {processedDocumentId ? (
              <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3 animate-pulse"></div>
                  <div>
                    <p className="text-white font-medium">{pdfFile?.name || 'Unknown PDF'}</p>
                    <p className="text-xs text-blue-200 mt-1">ID: {processedDocumentId}</p>
                  </div>
                </div>
              </div>
              
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-blue-400/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-blue-200/70 text-sm">No documents processed yet.</p>
              </div>
            )}
          </div>
        </div>
        {/* Right Panel: Chat Section */}
        <div className="w-full md:w-2/3 flex flex-col p-6">
          <div className="flex items-center justify-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Chat with AI</h2>
          </div>
          <div ref={chatContainerRef} className="flex-grow bg-white/5 backdrop-blur-sm p-4 rounded-xl overflow-y-auto shadow-inner mb-4 border border-white/20">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-blue-400/50 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-blue-200/70 text-lg">Upload a PDF and ask questions about it!</p>
                <p className="text-blue-200/50 text-sm mt-2">Your AI assistant is ready to help analyze your documents</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex mb-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-none shadow-lg' 
                      : msg.type === 'system'
                      ? 'bg-gradient-to-r from-purple-600/80 to-purple-700/80 text-white rounded-lg backdrop-blur-sm'
                      : 'bg-white/20 backdrop-blur-sm text-white rounded-bl-none border border-white/30'
                  }`}>
                    {msg.loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        <span className="animate-pulse">Typing...</span>
                      </div>
                    ) : (
                      <>
                        {msg.text}
                        {msg.sources && msg.sources.length > 0 && (
                          <p className="text-xs mt-2 opacity-75 border-t border-white/20 pt-2">Sources: {msg.sources.join(', ')}</p>
                        )}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={processingPdf ? "Please wait for PDF processing..." : "Type your message..."}
              className="flex-grow p-4 border border-white/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/10 backdrop-blur-sm text-white placeholder-blue-200/70 transition-all duration-200"
              disabled={processingPdf}
            />
            <button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={processingPdf || inputMessage.trim() === ''}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoleUser;
