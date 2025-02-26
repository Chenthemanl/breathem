import React, { createContext, useState, useRef, useContext, useCallback, useRef } from 'react';

// Create the context
const MessageContext = createContext();

/**
 * MessageProvider component to manage all speech bubbles in one place
 * This creates a centralized system for displaying messages to the user
 */
export function MessageProvider({ children }) {
  // Central state for the message
  const [message, setMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  
  // Queue for managing multiple messages
  const messageQueue = useRef([]);
  const timeoutRef = useRef(null);
  
  // Set a message with priority level (higher number = higher priority)
  const showMessage = useCallback((text, priority = 1, duration = 7000) => {
    // If no text, ignore
    if (!text) return;
    
    // Add to queue with priority
    messageQueue.current.push({
      text,
      priority,
      duration,
      timestamp: Date.now()
    });
    
    // Sort the queue by priority (highest first)
    messageQueue.current.sort((a, b) => b.priority - a.priority);
    
    // If no message is currently showing, show the next one
    if (!isVisible) {
      displayNextMessage();
    }
  }, [isVisible]);
  
  // Display the next message in the queue
  const displayNextMessage = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // If the queue is empty, hide the message
    if (messageQueue.current.length === 0) {
      setIsVisible(false);
      setMessage('');
      return;
    }
    
    // Get the highest priority message
    const nextMessage = messageQueue.current.shift();
    
    // Show the message
    setMessage(nextMessage.text);
    setIsVisible(true);
    
    // Set a timeout to display the next message
    timeoutRef.current = setTimeout(() => {
      displayNextMessage();
    }, nextMessage.duration);
  }, []);
  
  // Clear all messages
  const clearMessages = useCallback(() => {
    messageQueue.current = [];
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
    setMessage('');
  }, []);
  
  // The value we'll provide to consumers
  const contextValue = {
    message,
    isVisible,
    showMessage,
    clearMessages
  };
  
  return (
    <MessageContext.Provider value={contextValue}>
      {children}
    </MessageContext.Provider>
  );
}

// Custom hook to use the message context
export function useMessage() {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
}