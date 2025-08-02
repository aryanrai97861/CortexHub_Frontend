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
    } catch (error: any) {
      console.error("PDF upload error:", error);
      setMessages((prevMessages) => [...prevMessages, { type: 'system', text: `Error processing PDF: ${error.message || 'Unknown error'}` }]);
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
    } catch (error: any) {
      console.error("AI chat error:", error);
      return `Error: ${error.message || 'Could not get a response from AI.'}`;
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden h-[90vh] border border-gray-200">
        {/* Left Panel: PDF Upload Section */}
        <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-200 flex flex-col bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Document Center</h2>
          <div className="mb-6">
            <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload PDF
            </label>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="block w-full text-sm text-gray-900
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-50 file:text-blue-700
                         hover:file:bg-blue-100 cursor-pointer rounded-lg border border-gray-300 p-2"
              disabled={processingPdf}
            />
            {pdfFile && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: <span className="font-medium text-blue-700">{pdfFile.name}</span>
              </p>
            )}
            {processingPdf && (
              <p className="mt-2 text-sm text-blue-500 animate-pulse">Processing PDF, please wait...</p>
            )}
          </div>
          <div className="flex-grow border border-gray-300 rounded-lg p-4 bg-white overflow-y-auto shadow-inner">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Processed Documents</h3>
            {processedDocumentId ? (
              <ul className="list-disc list-inside text-gray-600">
                <li>{pdfFile?.name || 'Unknown PDF'} (ID: {processedDocumentId})</li>
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No documents processed yet.</p>
            )}
          </div>
        </div>
        {/* Right Panel: Chat Section */}
        <div className="w-full md:w-2/3 flex flex-col p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Chat with AI</h2>
          <div ref={chatContainerRef} className="flex-grow bg-gray-50 p-4 rounded-lg overflow-y-auto shadow-inner mb-4 border border-gray-200">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">Upload a PDF and ask questions about it!</p>
            ) : (
              messages.map((msg, index) => (
                <div key={index} className={`flex mb-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                    msg.type === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}>
                    {msg.loading ? (
                      <span className="animate-pulse">Typing...</span>
                    ) : (
                      <>
                        {msg.text}
                        {msg.sources && msg.sources.length > 0 && (
                          <p className="text-xs mt-1 opacity-75">Sources: {msg.sources.join(', ')}</p>
                        )}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={processingPdf ? "Please wait for PDF processing..." : "Type your message..."}
              className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              disabled={processingPdf}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={processingPdf || inputMessage.trim() === ''}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoleUser;
