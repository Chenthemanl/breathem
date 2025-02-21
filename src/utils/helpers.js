/**
 * This file contains utility functions used throughout the Happy meditation app.
 * These functions handle common operations like time formatting, data storage,
 * and session management.
 */

// Formats time from seconds into a human-readable MM:SS format
export const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Calculates the current meditation streak based on stored session dates
  export const calculateStreak = (dates) => {
    if (!dates || dates.length === 0) return 0;
  
    const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a));
    let streak = 1;
    let currentDate = new Date(sortedDates[0]);
    
    for (let i = 1; i < sortedDates.length; i++) {
      const previousDate = new Date(sortedDates[i]);
      const diffDays = Math.floor(
        (currentDate - previousDate) / (1000 * 60 * 60 * 24)
      );
      
      if (diffDays === 1) {
        streak++;
        currentDate = previousDate;
      } else {
        break;
      }
    }
    
    return streak;
  };
  
  // Stores data in localStorage with an expiration time
  export const storeWithExpiry = (key, value, ttl) => {
    const item = {
      value,
      expiry: new Date().getTime() + ttl,
    };
    localStorage.setItem(key, JSON.stringify(item));
  };
  
  // Retrieves data from localStorage and checks if it has expired
  export const getWithExpiry = (key) => {
    const itemStr = localStorage.getItem(key);
    if (!itemStr) return null;
  
    const item = JSON.parse(itemStr);
    if (new Date().getTime() > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  };
  
  // Generates a unique session ID for tracking meditation sessions
  export const generateSessionId = () => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  };
  
  // Formats a date into a readable string (e.g., "Today", "Yesterday", or the date)
  export const formatDate = (date) => {
    const now = new Date();
    const inputDate = new Date(date);
    const diffTime = Math.abs(now - inputDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return inputDate.toLocaleDateString();
  };
  
  // Calculates total meditation time in minutes from session data
  export const calculateTotalMeditationTime = (sessions) => {
    if (!sessions || sessions.length === 0) return 0;
    return sessions.reduce((total, session) => total + (session.duration || 0), 0);
  };
  
  // Validates and formats user preferences
  export const validatePreferences = (prefs) => {
    return {
      darkMode: Boolean(prefs?.darkMode),
      soundEnabled: prefs?.soundEnabled !== false,
      notifications: prefs?.notifications !== false,
      breathingPattern: prefs?.breathingPattern || 'normal',
      meditationDuration: Number(prefs?.meditationDuration) || 10,
    };
  };
  
  // Creates a debounced function that delays execution
  export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  // Safely parses JSON with a fallback value
  export const safeJSONParse = (str, fallback = null) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      return fallback;
    }
  };
  
  // Groups meditation sessions by date for statistics
  export const groupSessionsByDate = (sessions) => {
    return sessions.reduce((groups, session) => {
      const date = new Date(session.startTime).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    }, {});
  };