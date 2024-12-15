import React, { useState } from 'react';
import './ChatMate.css';

const ChatMate = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      setMessages([...messages, { type: 'user', text: inputValue }]);
      // Simulate a bot response
      setMessages((prev) => [
        ...prev,
        { type: 'bot', text: 'This is a sample bot response.' },
      ]);
      setInputValue('');
    }
  };

  return (
    <div className="chatmate">
      <div className="chatmate-header">ChatMate</div>
      <div className="chatmate-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chatmate-message ${
              message.type === 'user' ? 'user' : 'bot'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="chatmate-input-container">
        <input
          type="text"
          className="chatmate-input"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button className="chatmate-send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatMate;
