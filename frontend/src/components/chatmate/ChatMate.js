import React, { useState } from "react";
import "./ChatMate.css";

const ChatMate = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  const handleSendMessage = async () => {
    if (inputValue.trim()) {
      setMessages([...messages, { type: "user", text: inputValue }]);

      try {
        const response = await fetch("http://127.0.0.1:5000/chat-boat-promp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: inputValue }),
        });

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          { type: "bot", text: data.reply || "No response from the bot." },
        ]);
      } catch (error) {
        console.error("Error fetching bot response:", error);
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Oops! Something went wrong. Please try again later.",
          },
        ]);
      }

      // Clear the input field
      setInputValue("");
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
              message.type === "user" ? "user" : "bot"
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
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
        />
        <button className="chatmate-send-button" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatMate;
