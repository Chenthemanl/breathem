import React, { useEffect, useRef, useState } from 'react';
import { useHappy } from '../../context/HappyContext';
import { useMessage } from '../../context/MessageContext';
import { TRIGGER_PHRASES } from '../../utils/constants';

// We keep these basic responses separate from triggers for better user interaction
const RESPONSES = {
  GREETING: [
    "Hello! I'm Happy, nice to meet you!",
    "Hi there! How are you feeling today?",
    "Hey! I'm here to help you stay mindful!"
  ],
  MEDITATION: [
    "Would you like to start a meditation session?",
    "Let's meditate together!",
    "Taking time to meditate is always good."
  ],
  BREATHING: [
    "Let's do some breathing exercises!",
    "Remember to breathe deeply.",
    "Focus on your breath..."
  ],
  MOOD: {
    CALM: {
      HIGH: [
        "I can feel your peaceful energy!",
        "This tranquility is wonderful.",
        "You're in such a calm state!"
      ],
      MEDIUM: [
        "That's the spirit! You're doing great.",
        "I can sense you're feeling better.",
        "Let's maintain this peaceful mood."
      ],
      LOW: [
        "Every small step toward peace counts.",
        "That's a good start to feeling better.",
        "Let's build on this positive feeling."
      ]
    },
    STRESS: {
      HIGH: [
        "I understand you're feeling very frustrated. Let's work through this together.",
        "I hear how stressed you are. Let's try some deep breathing.",
        "That sounds really challenging. I'm here to help you calm down."
      ],
      MEDIUM: [
        "I can sense your anxiety. Would you like to meditate?",
        "Let's work on reducing that stress together.",
        "Things will get better. Shall we try some calming exercises?"
      ],
      LOW: [
        "Taking a break sounds like a good idea.",
        "Sometimes things can be overwhelming. Let's take it step by step.",
        "I'm here to help you feel more relaxed."
      ]
    }
  }
};

const SpeechHandler = ({ onEmotionalStateChange }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Get Happy context functions
  const { toggleMeditation, toggleBreathing } = useHappy();
  
  // Get the message context for centralized message display
  const { showMessage } = useMessage();

  // Helper function to get a random response from an array
  const getRandomResponse = (responses) => {
    const index = Math.floor(Math.random() * responses.length);
    return responses[index];
  };

  // Enhanced speech processing with intensity levels
  const processSpeech = (transcript) => {
    console.log('Processing speech:', transcript);
    const text = transcript.toLowerCase();
    let maxIntensity = 0;
    let type = null;
    let foundResponse = false;

    // Helper function to check triggers and update state
    const checkTriggers = (category, triggerType) => {
      Object.entries(TRIGGER_PHRASES[category]).forEach(([level, triggers]) => {
        // Check full phrases first
        triggers.PHRASES.forEach(phrase => {
          if (text.includes(phrase)) {
            const intensity = level === 'HIGH' ? 3 : level === 'MEDIUM' ? 2 : 1;
            if (intensity > maxIntensity) {
              maxIntensity = intensity;
              type = triggerType;
              // Set appropriate response based on intensity
              const messageText = getRandomResponse(RESPONSES.MOOD[category][level]);
              showMessage(messageText, 2); // Priority 2 for voice responses
              foundResponse = true;
            }
          }
        });

        // Then check individual words
        triggers.WORDS.forEach(word => {
          if (text.split(' ').includes(word)) {
            const intensity = level === 'HIGH' ? 3 : level === 'MEDIUM' ? 2 : 1;
            if (intensity > maxIntensity) {
              maxIntensity = intensity;
              type = triggerType;
              // Set appropriate response based on intensity
              const messageText = getRandomResponse(RESPONSES.MOOD[category][level]);
              showMessage(messageText, 2); // Priority 2 for voice responses
              foundResponse = true;
            }
          }
        });
      });
    };

    // Check for meditation-related words
    if (text.includes('meditate') || text.includes('meditation')) {
      toggleMeditation();
      const messageText = getRandomResponse(RESPONSES.MEDITATION);
      showMessage(messageText, 3); // Priority 3 for direct commands
      foundResponse = true;
    }
    // Check for breathing-related words
    else if (text.includes('breathe') || text.includes('breathing')) {
      toggleBreathing();
      const messageText = getRandomResponse(RESPONSES.BREATHING);
      showMessage(messageText, 3); // Priority 3 for direct commands
      foundResponse = true;
    }
    else {
      // Check stress triggers
      checkTriggers('STRESS', 'stress');
      // Check calm triggers if no stress triggers found
      if (!foundResponse) {
        checkTriggers('CALM', 'calm');
      }
    }

    // If we found emotional triggers, notify the parent component
    if (type && maxIntensity > 0) {
      console.log(`Emotional trigger detected: ${type} with intensity ${maxIntensity}`);
      onEmotionalStateChange && onEmotionalStateChange(type, maxIntensity);
    }

    // If no triggers were found, give a generic response
    if (!foundResponse) {
      showMessage("I heard you, but I'm not sure how to help..", 1);
    }
  };

  // Speech recognition initialization and control
  const startRecognition = async () => {
    if (!recognitionRef.current || isListening) return;

    try {
      await recognitionRef.current.start();
      setIsListening(true);
      console.log('Recognition started successfully');
    } catch (error) {
      console.error('Failed to start recognition:', error);
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(startRecognition, 2000);
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    console.log('SpeechHandler mounted');

    if (!('webkitSpeechRecognition' in window)) {
      console.error('Speech recognition not supported in this browser');
      return;
    }

    console.log('Speech recognition is available');

    if (!recognitionRef.current) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Heard:', transcript);
        processSpeech(transcript);
      };

      recognition.onerror = (event) => {
        console.log('Recognition error:', event.error);
        setIsListening(false);
        
        if (event.error !== 'aborted') {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(startRecognition, 2000);
        }
      };

      recognition.onend = () => {
        console.log('Recognition ended normally');
        setIsListening(false);
        
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(startRecognition, 1000);
      };

      recognitionRef.current = recognition;
    }

    const initialStartTimeout = setTimeout(() => {
      startRecognition();
    }, 1000);

    return () => {
      console.log('Cleaning up speech recognition');
      clearTimeout(initialStartTimeout);
      clearTimeout(retryTimeoutRef.current);
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, [toggleMeditation, toggleBreathing, onEmotionalStateChange, showMessage]);

  // No need to return anything since we're using the centralized message system
  return null;
};

export default SpeechHandler;