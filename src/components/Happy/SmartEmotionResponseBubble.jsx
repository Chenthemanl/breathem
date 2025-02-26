import React, { useRef, useState, useEffect } from 'react';
import { useMessage } from '../../context/MessageContext';

/**
 * A smart emotion response system that controls message frequency 
 * and sends messages to the centralized message system
 */
const SmartEmotionResponseBubble = ({ 
  emotionData, 
  recognizedPerson
}) => {
  // Get the message context for centralized message display
  const { showMessage } = useMessage();
  
  // Refs for tracking and control
  const lastEmotionRef = useRef(null);
  const lastShownTimeRef = useRef(0);
  const recognizedPersonsRef = useRef({});
  
  // Constants for frequency control
  const NEW_PERSON_COOLDOWN = 30000; // 30 seconds when recognizing a new person
  const ROUTINE_MESSAGE_COOLDOWN = 30000; // 5 minutes between routine messages
  const RANDOM_MESSAGE_PROBABILITY = 0.2; // 20% chance to show a message after cooldown
  
  // Previously shown messages to avoid repetition
  const messageHistoryRef = useRef([]);
  const MAX_HISTORY = 5; // Number of recent messages to avoid repeating

  // Track session time for frequency adjustments
  const sessionStartTimeRef = useRef(Date.now());
  
  /**
   * Get a personalized greeting for a recognized person
   */
  const getPersonalizedGreeting = (personName) => {
    // Store greetings for known individuals
    const personalGreetings = {
      'John': ['Welcome back, John!', 'Great to see you, John!'],
      'Emma': ['Hello Emma, nice to see you today!', 'Emma, looking well today!'],
      // Add more people as needed
    };
    
    // Get greeting for this person, or use a default
    const greetings = personalGreetings[personName] || 
      [`Hello ${personName}!`, `Nice to see you, ${personName}!`];
    
    // Return a random greeting from the options
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  /**
   * Determines if we should show a message based on various factors
   */
  const shouldShowMessage = (emotion, person) => {
    const now = Date.now();
    const timeSinceLastMessage = now - lastShownTimeRef.current;
    const sessionDuration = now - sessionStartTimeRef.current;
    
    // Check if this is a new person we haven't seen this session
    const isNewPerson = person && 
                       person !== 'Unknown' && 
                       !recognizedPersonsRef.current[person];
    
    // Always show messages for new people with a minimum cooldown
    if (isNewPerson && timeSinceLastMessage > NEW_PERSON_COOLDOWN) {
      console.log(`Showing message for new person: ${person}`);
      return true;
    }
    
    // For routine emotion messages, use longer cooldown and probability
    if (timeSinceLastMessage > ROUTINE_MESSAGE_COOLDOWN) {
      // Apply random probability after cooldown
      const shouldShow = Math.random() < RANDOM_MESSAGE_PROBABILITY;
      
      if (shouldShow) {
        console.log(`Showing routine message after ${timeSinceLastMessage/1000}s`);
        return true;
      }
    }
    
    // Special case: For first 10 seconds of session, 50% chance to show welcome
    if (sessionDuration < 10000 && !lastShownTimeRef.current && Math.random() < 0.5) {
      console.log('Showing welcome message at session start');
      return true;
    }
    
    return false;
  };

  /**
   * Create a message appropriate for the current emotion
   */
  const createEmotionMessage = (emotion, person) => {
    // Add personalization if we know the person
    const personPrefix = person && person !== 'Unknown' 
      ? `${person}, ` 
      : '';
    
    // For new people, use a greeting
    if (person && person !== 'Unknown' && !recognizedPersonsRef.current[person]) {
      recognizedPersonsRef.current[person] = true;
      return getPersonalizedGreeting(person);
    }
    
    // Mapping of emotions to possible messages
    const emotionMessages = {
      'happy': [
        `${personPrefix}I see your smile! It's contagious!`,
        `${personPrefix}Your happiness brightens the room!`,
        `${personPrefix}You look pleased today. Wonderful!`
      ],
      'sad': [
        `${personPrefix}You seem a bit down. Would a meditation help?`,
        `${personPrefix}I notice you look sad. Let's do something calming.`,
        `${personPrefix}When you're feeling blue, breathing exercises can help.`
      ],
      'angry': [
        `${personPrefix}I sense some frustration. Let's breathe together.`,
        `${personPrefix}You seem tense. Would you like to try a calming exercise?`,
        `${personPrefix}Anger is natural, but let's find your center again.`
      ],
      'fear': [
        `${personPrefix}You look concerned. Breathing might help you relax.`,
        `${personPrefix}I notice you seem worried. Let's find some calm.`,
        `${personPrefix}When anxiety appears, meditation can create space.`
      ],
      'surprise': [
        `${personPrefix}Something surprised you? Let's take a moment to center.`,
        `${personPrefix}Unexpected things happen! Let's breathe together.`,
        `${personPrefix}Surprises can be jarring. Would you like to meditate?`
      ],
      'neutral': [
        `${personPrefix}Would you like to try a meditation session?`,
        `${personPrefix}This is a perfect time for mindfulness practice.`,
        `${personPrefix}How about we do some breathing exercises?`
      ],
      'default': [
        `${personPrefix}I'm here to help you find balance.`,
        `${personPrefix}Would you like to meditate with me?`,
        `${personPrefix}Let's practice mindfulness together.`
      ]
    };
    
    // Get message options for this emotion (or default if not found)
    const messageOptions = emotionMessages[emotion] || emotionMessages.default;
    
    // Filter out recent messages to avoid repetition
    const freshOptions = messageOptions.filter(
      msg => !messageHistoryRef.current.includes(msg)
    );
    
    // Use filtered list if available, otherwise use all options
    const options = freshOptions.length > 0 ? freshOptions : messageOptions;
    
    // Select random message from options
    const message = options[Math.floor(Math.random() * options.length)];
    
    // Update message history and trim to max size
    messageHistoryRef.current.push(message);
    if (messageHistoryRef.current.length > MAX_HISTORY) {
      messageHistoryRef.current.shift();
    }
    
    return message;
  };

  // Process emotion data and apply frequency control
  useEffect(() => {
    // Skip if no emotion data
    if (!emotionData || !emotionData.emotion) return;
    
    // Determine if we should show a message
    if (shouldShowMessage(emotionData.emotion, recognizedPerson)) {
      // Create appropriate message
      const newMessage = createEmotionMessage(
        emotionData.emotion, 
        recognizedPerson
      );
      
      // Use the centralized message system with priority 2
      // (emotions are important but not as important as direct commands)
      showMessage(newMessage, 2);
      
      // Update tracking
      lastEmotionRef.current = emotionData.emotion;
      lastShownTimeRef.current = Date.now();
      
      // Record person as recognized in this session
      if (recognizedPerson && recognizedPerson !== 'Unknown') {
        recognizedPersonsRef.current[recognizedPerson] = true;
      }
    }
  }, [emotionData, recognizedPerson, showMessage]);

  // No need to return anything since we're using the centralized message system
  return null;
};

export default SmartEmotionResponseBubble;