import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';

function Chat() {
  const { currentUser, messages, sendChatMessage } = useChat();
  const [content, setContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (content.trim() === '') return;
    sendChatMessage(content);
    setContent('');
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 text-white text-lg font-semibold p-4 shadow">
        Chat Assistant
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-xs px-4 py-2 rounded-2xl shadow text-sm ${
              index % 2 === 0
                ? 'bg-blue-500 text-white self-end ml-auto'
                : 'bg-white text-gray-800 self-start mr-auto border'
            }`}
          >
            {message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t bg-white p-4 flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={handleSend}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
