"use client";
import React, { useState, useRef, useEffect } from 'react';

// Define types for message objects
interface Message {
  type: 'user' | 'ai' | 'system';
  text: string;
  loading?: boolean; // Optional property for loading state
  sources?: string[]; // Optional property for AI response citations/sources
}

const SoleUser: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [processingPdf, setProcessingPdf] = useState<boolean>(false); // New state for PDF processing
  const [processedDocumentId, setProcessedDocumentId] = useState<string | null>(null); // New state for backend document ID
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'system', text: 'Please upload a valid PDF file.' },
      ]);
      setPdfFile(null);
      return;
    }

    setPdfFile(file);
    setProcessingPdf(true); // Start PDF processing loading indicator
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'system', text: `Uploading and processing PDF: ${file.name}...` },
    ]);

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      // Simulate API call to backend for PDF upload and processing
      const response = await fetch('/api/upload-pdf', { // Replace with your actual backend endpoint
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process PDF.');
      }

      const data = await response.json();
      setProcessedDocumentId(data.documentId); // Store the document ID from the backend
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'system', text: `PDF "${file.name}" processed successfully! Document ID: ${data.documentId}` },
      ]);
    } catch (error: any) {
      console.error("PDF upload error:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'system', text: `Error processing PDF: ${error.message || 'Unknown error'}` },
      ]);
      setPdfFile(null); // Clear PDF file on error
      setProcessedDocumentId(null); // Clear document ID on error
    } finally {
      setProcessingPdf(false); // End PDF processing loading indicator
    }
  };

  const getAiResponse = async (userMessage: string): Promise<string> => {
    try {
      // API call to backend for AI chat with RAG
      const payload = {
        query: userMessage,
        documentId: processedDocumentId, // Pass the ID of the processed PDF if available
      };

      const response = await fetch('/api/chat-query', { // Replace with your actual backend endpoint
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

    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'ai', text: '...', loading: true },
    ]);

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
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden h-[90vh] border border-gray-700"> 

        {/* Left Panel: PDF Upload Section */}
        <div className="w-full md:w-1/3 p-6 border-b md:border-b-0 md:border-r border-gray-700 flex flex-col bg-gray-800"> 
          <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">Document Center</h2> 

          <div className="mb-6">
            <label htmlFor="pdf-upload" className="block text-sm font-medium text-gray-300 mb-2"> 
              Upload PDF
            </label>
            <input
              type="file"
              id="pdf-upload"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="block w-full text-sm text-gray-300
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-blue-600 file:text-white
                         hover:file:bg-blue-700 cursor-pointer rounded-lg border border-gray-600 p-2" 
              disabled={processingPdf} // Disable input while processing
            />
            {pdfFile && (
              <p className="mt-2 text-sm text-gray-400"> 
                Selected: <span className="font-medium text-blue-400">{pdfFile.name}</span> 
              </p>
            )}
            {processingPdf && (
              <p className="mt-2 text-sm text-blue-400 animate-pulse">Processing PDF, please wait...</p> 
            )}
          </div>

          <div className="flex-grow bg-gray-700 rounded-lg p-4 overflow-y-auto shadow-inner border border-gray-600"> 
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Processed Documents</h3> 
            {processedDocumentId ? (
              <ul className="list-disc list-inside text-gray-300"> 
                <li>{pdfFile?.name || 'Unknown PDF'} (ID: {processedDocumentId})</li>
                {/* In a real app, multiple listed docs will processed here */}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">No documents processed yet.</p> 
            )}
          </div>
        </div>

        {/* Right Panel: Chat Section */}
        <div className="w-full md:w-2/3 flex flex-col p-6 bg-gray-800"> 
          <h2 className="text-2xl font-bold text-gray-200 mb-6 text-center">Chat with AI</h2>

          {/* Chat Messages Display */}
          <div ref={chatContainerRef} className="flex-grow bg-gray-700 p-4 rounded-lg overflow-y-auto shadow-inner mb-4 border border-gray-600"> 
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm">Upload a PDF and ask questions about it!</p> 
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex mb-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] p-3 rounded-xl shadow-md ${
                      msg.type === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-600 text-gray-100 rounded-bl-none' 
                    }`}
                  >
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={processingPdf ? "Please wait for PDF processing..." : "Type your message..."}
              className="flex-grow p-3 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400" /* Updated border, bg, text, placeholder colors */
              disabled={processingPdf} // Disable chat input while PDF is processing
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-r-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={processingPdf || inputMessage.trim() === ''} // Disable send button
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
