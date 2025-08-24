import React, { useState, useRef, useEffect } from 'react';
import './ChatInput.css';

const ChatInput = ({ 
  onSendMessage, 
  onAttachFile, 
  replyTo, 
  onCancelReply,
  disabled = false,
  placeholder = "Type a message...",
  showAttachment = true,
  showVoice = false,
  onStartTyping,
  onStopTyping
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Handle typing indicator
    if (message && !isTyping) {
      setIsTyping(true);
      onStartTyping?.();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    if (message) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onStopTyping?.();
      }, 1000);
    } else if (isTyping) {
      setIsTyping(false);
      onStopTyping?.();
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onStartTyping, onStopTyping]);

  const handleSend = async () => {
    if (!message.trim() || isSending || disabled) return;

    setIsSending(true);
    try {
      await onSendMessage({
        text: message.trim(),
        replyTo: replyTo?.id || null
      });
      setMessage('');
      onCancelReply?.();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && onAttachFile) {
      onAttachFile(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handleVoiceMessage = () => {
    // Implement voice recording logic
    console.log('Voice message feature coming soon');
  };

  return (
    <div className="chat-input-container">
      {/* Reply Preview */}
      {replyTo && (
        <div className="reply-preview">
          <div className="reply-content">
            <span>Replying to {replyTo.senderName}</span>
            <p>{replyTo.text || 'Media message'}</p>
          </div>
          <button 
            type="button"
            className="cancel-reply"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 8.586L4.707 3.293 3.293 4.707 8.586 10l-5.293 5.293 1.414 1.414L10 11.414l5.293 5.293 1.414-1.414L11.414 10l5.293-5.293-1.414-1.414L10 8.586z"/>
            </svg>
          </button>
        </div>
      )}

      {/* Main Input Area */}
      <div className="chat-input-area">
        {/* Attachment Button */}
        {showAttachment && (
          <>
            <button 
              type="button"
              className="input-action-btn attach-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-label="Attach file"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </>
        )}

        {/* Text Input */}
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            className="message-input"
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled || isSending}
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck="true"
          />
        </div>

        {/* Voice or Send Button */}
        {message.trim() ? (
          <button 
            type="button"
            className="input-action-btn send-btn"
            onClick={handleSend}
            disabled={disabled || isSending || !message.trim()}
            aria-label="Send message"
          >
            {isSending ? (
              <div className="sending-spinner"></div>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            )}
          </button>
        ) : showVoice ? (
          <button 
            type="button"
            className="input-action-btn voice-btn"
            onClick={handleVoiceMessage}
            disabled={disabled}
            aria-label="Record voice message"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
            </svg>
          </button>
        ) : null}
      </div>

      {/* Character Counter (optional) */}
      {message.length > 200 && (
        <div className="character-counter">
          {500 - message.length} characters remaining
        </div>
      )}
    </div>
  );
};

export default ChatInput;