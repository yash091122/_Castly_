import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';

function Chat({ messages, onSendMessage, onReact, participants, typingUsers = new Set(), sendTypingIndicator }) {
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      setShowEmojiPicker(false);
      
      // Stop typing indicator
      if (sendTypingIndicator) {
        sendTypingIndicator(false);
      }
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    
    // Send typing indicator (debounced)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Notify that user is typing
    if (sendTypingIndicator) {
      sendTypingIndicator(true);
    }
    
    // Stop typing indicator after 2 seconds of no input
    typingTimeoutRef.current = setTimeout(() => {
      if (sendTypingIndicator) {
        sendTypingIndicator(false);
      }
    }, 2000);
  };

  const onEmojiClick = (emojiObject) => {
    setInputValue(prev => prev + emojiObject.emoji);
    inputRef.current?.focus();
  };

  const handleReaction = (messageId, emoji) => {
    if (onReact) {
      onReact(messageId, emoji);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickReactions = ['❤️', '😂', '😮', '👍', '🔥'];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>
          <i className="fas fa-comments"></i> Chat
        </h3>
        <span className="participant-count">
          <i className="fas fa-users"></i> {participants?.length || 0}
        </span>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <i className="fas fa-comment-dots"></i>
            <p>No messages yet. Start the conversation! 👋</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.isMine ? 'sent' : 'received'}`}
            >
              {!message.isMine && (
                <img
                  src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${message.sender?.name || 'User'}`}
                  alt={message.sender?.name}
                  className="message-avatar"
                />
              )}
              <div className="message-content-wrapper">
                {!message.isMine && (
                  <span className="message-sender">{message.sender?.name}</span>
                )}
                <div className="message-content-group">
                  <div className="message-bubble">
                    <p>{message.text}</p>
                  </div>

                  {/* Action Bar / Reactions */}
                  <div className="message-actions">
                    {quickReactions.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(message.id, emoji)}
                        className="reaction-opt-btn"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Displayed Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="message-reactions">
                      {message.reactions.map((reaction, idx) => (
                        <span key={idx} className="reaction-badge">{reaction.emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))
        )}

        {typingUsers && typingUsers.size > 0 && (
          <div className="message received typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {typingUsers.size > 0 
                ? `${typingUsers.size} user${typingUsers.size > 1 ? 's' : ''} typing...`
                : 'Someone is typing...'
              }
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-container" onSubmit={handleSubmit}>
        {showEmojiPicker && (
          <div className="emoji-picker-popup" ref={pickerRef}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme="dark"
              width={300}
              height={400}
            />
          </div>
        )}

        <div className="chat-input-wrapper glass-input">
          <button
            type="button"
            className={`emoji-btn ${showEmojiPicker ? 'active' : ''}`}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <i className="fas fa-smile"></i>
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={inputValue}
            onChange={handleInputChange}
          />
          <button type="submit" className="send-btn" disabled={!inputValue.trim()}>
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </form>

      <style>{`
        .chat-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          background: rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .chat-header h3 {
          color: white;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
          font-weight: 600;
        }

        .chat-header h3 i {
          color: #8b5cf6;
        }

        .participant-count {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 12px;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
        }

        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: rgba(255, 255, 255, 0.4);
          text-align: center;
          gap: 15px;
        }

        .chat-empty i {
          font-size: 3rem;
          color: rgba(255, 255, 255, 0.2);
        }

        .message {
          display: flex;
          gap: 12px;
          max-width: 85%;
          animation: messageSlide 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
        }

        .message:hover .message-actions {
          opacity: 1;
          pointer-events: auto;
          transform: translateY(0);
        }

        @keyframes messageSlide {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message.sent {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .message.received {
          align-self: flex-start;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          flex-shrink: 0;
          border: 2px solid rgba(255, 255, 255, 0.1);
          object-fit: cover;
        }

        .message-content-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 100%;
        }

        .message.sent .message-content-wrapper {
          align-items: flex-end;
        }

        .message-sender {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          margin-left: 5px;
          font-weight: 500;
        }

        .message-content-group {
            position: relative;
        }

        .message-bubble {
          padding: 12px 18px;
          border-radius: 20px;
          position: relative;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        .message.sent .message-bubble {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-bottom-right-radius: 4px;
          color: white;
        }

        .message.received .message-bubble {
          background: rgba(255, 255, 255, 0.12);
          border-bottom-left-radius: 4px;
          color: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .message-bubble p {
          margin: 0;
          font-size: 0.95rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .message-time {
          font-size: 0.7rem;
          color: rgba(255, 255, 255, 0.4);
          margin: 2px 5px 0;
        }

        /* Message Actions / Reactions Bar */
        .message-actions {
            position: absolute;
            top: -35px;
            padding: 4px;
            background: rgba(30, 30, 45, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            display: flex;
            gap: 4px;
            opacity: 0;
            pointer-events: none;
            transition: all 0.2s ease;
            transform: translateY(10px);
            z-index: 10;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }

        .message.sent .message-actions {
            right: 0;
        }

        .message.received .message-actions {
            left: 0;
        }

        .reaction-opt-btn {
            background: transparent;
            border: none;
            font-size: 1.1rem;
            cursor: pointer;
            padding: 4px;
            border-radius: 50%;
            transition: transform 0.2s;
            line-height: 1;
        }

        .reaction-opt-btn:hover {
            transform: scale(1.3);
            background: rgba(255, 255, 255, 0.1);
        }

        /* Reactions Display */
        .message-reactions {
            display: flex;
            gap: 4px;
            margin-top: -8px;
            margin-bottom: 4px;
            justify-content: flex-end;
            padding-right: 5px;
            z-index: 5;
            position: relative;
        }

        .message.received .message-reactions {
            justify-content: flex-start;
            padding-left: 5px;
        }

        .reaction-badge {
            font-size: 0.8rem;
            background: rgba(30, 30, 45, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 2px 6px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 12px 18px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          border-bottom-left-radius: 4px;
          width: fit-content;
        }

        .typing-indicator span {
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .chat-input-container {
          padding: 20px;
          background: rgba(20, 20, 30, 0.4);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        .emoji-picker-popup {
            position: absolute;
            bottom: 80px;
            left: 20px;
            z-index: 100;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            border-radius: 12px;
            overflow: hidden;
        }

        .glass-input {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 30px;
          padding: 6px 8px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }

        .glass-input:focus-within {
          border-color: rgba(139, 92, 246, 0.5);
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .glass-input input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: white;
          font-size: 0.95rem;
          padding: 10px 5px;
        }

        .glass-input input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .emoji-btn, .send-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          background: transparent;
        }

        .emoji-btn {
          color: rgba(255, 255, 255, 0.6);
        }

        .emoji-btn:hover, .emoji-btn.active {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
        }

        .send-btn {
          color: white;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.3);
        }

        .send-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.5);
        }

        .send-btn:disabled {
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.3);
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>
    </div>
  );
}

export default Chat;
