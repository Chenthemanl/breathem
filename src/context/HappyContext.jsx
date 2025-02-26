import React, { createContext, useContext, useRef, useState, useEffect } from 'react';

// Create the context
const HappyContext = createContext();

// State configurations for different emotional states
const stateConfigs = {
  normal: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8F8F8F',
    breathingPattern: 'normal'
  },
  meditating: {
    backgroundColor: '#F0F8FF',
    borderColor: '#8F8F8F',
    breathingPattern: 'deep'
  }
};

export function HappyProvider({ children }) {
  // Core state management
  const [currentState, setCurrentState] = useState('normal');
  const [stressLevel, setStressLevel] = useState(0);
  const [isMeditating, setIsMeditating] = useState(false);
  const [isBreathing, setIsBreathing] = useState(false);

  // Get current state configuration
  const getCurrentState = () => stateConfigs[currentState];

  // Toggle meditation state
  const toggleMeditation = () => {
    setIsMeditating(!isMeditating);
    setCurrentState(state => state === 'meditating' ? 'normal' : 'meditating');
  };

  // Toggle breathing exercise
  const toggleBreathing = () => {
    setIsBreathing(!isBreathing);
  };

  // The value object that will be passed to children
  const value = {
    currentState,
    stressLevel,
    isMeditating,
    isBreathing,
    getCurrentState,
    toggleMeditation,
    toggleBreathing,
    setStressLevel
  };

  return (
    <HappyContext.Provider value={value}>
      {children}
    </HappyContext.Provider>
  );
}

// Custom hook to use Happy's context
export function useHappy() {
  const context = useContext(HappyContext);
  if (!context) {
    throw new Error('useHappy must be used within a HappyProvider');
  }
  return context;
}