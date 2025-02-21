import { useState, useCallback, useEffect } from 'react';
import { EMOTIONAL_STATES, STATE_THEMES } from '../utils/constants';

const useEmotionState = () => {
  // Initialize our core state variables
  // Think of these like the vital signs we're monitoring
  const [currentState, setCurrentState] = useState(EMOTIONAL_STATES.NORMAL);
  const [stressLevel, setStressLevel] = useState(0);
  const [lastMeditationDate, setLastMeditationDate] = useState(
    localStorage.getItem('lastMeditationDate')
  );
  const [angerTimeout, setAngerTimeout] = useState(null);

  // This effect handles stress level changes and emotional state transitions
  // Think of it like a thermostat that monitors and adjusts the emotional temperature
  useEffect(() => {
    if (stressLevel >= 5) {
      // When stress reaches critical level (like a temperature getting too high)
      setCurrentState(EMOTIONAL_STATES.ANGRY);
      
      // Set a cool-down timer
      const timeout = setTimeout(() => {
        // After 30 seconds, reduce stress level if it's still high
        setStressLevel(prev => Math.max(0, prev - 1));
      }, 30000);
      
      // Clear any existing cool-down timer before setting a new one
      if (angerTimeout) {
        clearTimeout(angerTimeout);
      }
      setAngerTimeout(timeout);
    } else if (stressLevel <= 0) {
      // When stress is gone, return to normal state
      setCurrentState(EMOTIONAL_STATES.NORMAL);
    }

    // Cleanup function to prevent memory leaks
    return () => {
      if (angerTimeout) {
        clearTimeout(angerTimeout);
      }
    };
  }, [stressLevel]); // Only re-run this effect when stress level changes

  // This effect monitors meditation practice consistency
  // Like a fitness tracker checking if you've kept up with your exercise routine
  useEffect(() => {
    const checkMeditationStreak = () => {
      // Skip check if no previous meditation date exists
      if (!lastMeditationDate) return;

      // Calculate days since last meditation
      const lastMeditation = new Date(lastMeditationDate);
      const today = new Date();
      const diffTime = Math.abs(today - lastMeditation);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If more than a day has passed, increase stress
      if (diffDays > 1) {
        setStressLevel(prev => Math.min(5, prev + 1));
      }
    };

    checkMeditationStreak();
  }, [lastMeditationDate]); // Only check when meditation date changes

  // Functions to modify stress level
  // These are like the controls on our emotional thermostat
  const increaseStress = useCallback((amount) => {
    setStressLevel(prev => {
      const newLevel = Math.min(5, prev + amount);
      console.log('Increasing stress to:', newLevel);
      return newLevel;
    });
  }, []); // No dependencies needed as it's a simple state update

  const decreaseStress = useCallback((amount) => {
    setStressLevel(prev => {
      const newLevel = Math.max(0, prev - amount);
      console.log('Decreasing stress to:', newLevel);
      return newLevel;
    });
  }, []); // No dependencies needed as it's a simple state update

  // Handle incoming emotional triggers
  // This is like the main control panel that processes emotional inputs
  const handleEmotionalTrigger = useCallback((type, intensity) => {
    console.log('Processing emotional trigger:', { type, intensity });
    if (type === 'stress') {
      increaseStress(intensity);
    } else if (type === 'calm') {
      decreaseStress(intensity);
    }
  }, [increaseStress, decreaseStress]);

  // Record meditation sessions
  // Like marking attendance in a meditation class
  const recordMeditation = useCallback(() => {
    const today = new Date().toISOString();
    setLastMeditationDate(today);
    localStorage.setItem('lastMeditationDate', today);
    decreaseStress(2); // Meditation reduces stress significantly
  }, [decreaseStress]);

  // Get the current visual theme based on emotional state
  // Like choosing the right color palette for the current mood
  const getCurrentTheme = useCallback(() => {
    return STATE_THEMES[currentState];
  }, [currentState]);

  // Set a temporary emotional state
  // Like a brief mood shift that will return to normal
  const setTemporaryState = useCallback((state, duration) => {
    const previousState = currentState;
    setCurrentState(state);
    
    const timeout = setTimeout(() => {
      setCurrentState(previousState);
    }, duration);

    // Return cleanup function
    return () => clearTimeout(timeout);
  }, [currentState]);

  // Return all the functions and state that other components might need
  return {
    currentState,
    stressLevel,
    increaseStress,
    decreaseStress,
    handleEmotionalTrigger,
    recordMeditation,
    getCurrentTheme,
    setTemporaryState,
    lastMeditationDate
  };
};

export default useEmotionState;