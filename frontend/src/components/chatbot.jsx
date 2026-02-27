import React, { useState } from "react";
import { getBotReply } from "./chatbotEngine.js";
import "./chatbot.css";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! 👋 I’m your store assistant. How can I help?" }
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { from: "user", text: input };
    const botMsg = { from: "bot", text: getBotReply(input) };

    setMessages([...messages, userMsg, botMsg]);
    setInput("");
  };

  return (
    <div className="chatbot">
      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.from}`}>
            {m.text}
          </div>
        ))}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask me about products, shipping..."
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
