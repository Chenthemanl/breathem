// In hooks/useSpeechRecognition.js

import { useState, useEffect, useRef, useCallback } from 'react';
import { TRIGGER_PHRASES } from '../utils/constants';

const useSpeechRecognition = (onTriggerDetected) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);

  const processTranscript = useCallback((transcript) => {
    const text = transcript.toLowerCase().trim();
    let maxStressLevel = 0;
    let type = null;

    // Check for phrases first (they take precedence over single words)
    const checkPhrases = (category, intensity) => {
      Object.entries(TRIGGER_PHRASES[category]).forEach(([level, triggers]) => {
        triggers.PHRASES.forEach(phrase => {
          if (text.includes(phrase)) {
            const stressAmount = 
              level === 'HIGH' ? 2 : 
              level === 'MEDIUM' ? 1 : 0.5;
            
            if (stressAmount > maxStressLevel) {
              maxStressLevel = stressAmount;
              type = category.toLowerCase();
            }
          }
        });
      });
    };

    // Check for individual words if no phrases matched
    const checkWords = (category) => {
      Object.entries(TRIGGER_PHRASES[category]).forEach(([level, triggers]) => {
        triggers.WORDS.forEach(word => {
          if (text.split(' ').includes(word)) {
            const stressAmount = 
              level === 'HIGH' ? 2 : 
              level === 'MEDIUM' ? 1 : 0.5;
            
            if (stressAmount > maxStressLevel) {
              maxStressLevel = stressAmount;
              type = category.toLowerCase();
            }
          }
        });
      });
    };

    // Process both stress and calm triggers
    checkPhrases('STRESS');
    checkPhrases('CALM');
    
    if (maxStressLevel === 0) {
      checkWords('STRESS');
      checkWords('CALM');
    }

    // If we found any triggers, notify the callback
    if (maxStressLevel > 0 && type) {
      onTriggerDetected(type, maxStressLevel);
    }
  }, [onTriggerDetected]);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Restart if we're supposed to be listening
      if (isListening) {
        recognition.start();
      }
    };

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          processTranscript(event.results[i][0].transcript);
        }
      }
    };

    try {
      recognition.start();
    } catch (error) {
      setError(`Failed to start speech recognition: ${error.message}`);
    }

    return () => {
      recognition.stop();
      setIsListening(false);
    };
  }, [isListening, processTranscript]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    const cleanup = startListening();
    return () => {
      if (cleanup) cleanup();
    };
  }, [startListening]);

  return {
    isListening,
    error,
    startListening,
    stopListening
  };
};

export default useSpeechRecognition;