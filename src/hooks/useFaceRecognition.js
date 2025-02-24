import { useState, useCallback } from 'react';
import { useHappy } from '../context/HappyContext';

const EMOTION_STRESS_LEVELS = {
  'angry': 3,
  'disgust': 2,
  'fear': 2,
  'sad': 1,
  'surprise': 0,
  'happy': -2,
  'neutral': 0
};

const EMOTION_RESPONSES = {
  'angry': [
    "I can sense you're angry. Let's try to calm down together.",
    "Take a deep breath. We'll work through this together.",
    "I understand you're frustrated. Would you like to try some breathing exercises?"
  ],
  'disgust': [
    "I notice you're not feeling great. Let's try to improve your mood.",
    "Sometimes things can be overwhelming. Want to meditate?",
    "Let's work on finding some peace together."
  ],
  'fear': [
    "I see you're feeling anxious. I'm here with you.",
    "It's okay to feel scared. Let's handle this together.",
    "Would you like to try some calming exercises?"
  ],
  'sad': [
    "I can see you're feeling down. I'm here to support you.",
    "It's okay to feel sad sometimes. Would you like to meditate?",
    "Let's work on lifting your spirits together."
  ],
  'surprise': [
    "Oh! You seem surprised! Take a moment to breathe.",
    "Unexpected things can be startling. Let's center ourselves.",
    "Take a moment to process. I'm here with you."
  ],
  'happy': [
    "Your smile is contagious! I'm happy to see you cheerful!",
    "What wonderful positive energy! Let's keep it going!",
    "Your happiness brightens the room! Let's celebrate with some mindful moments!"
  ],
  'neutral': [
    "How are you feeling today? Would you like to meditate?",
    "Sometimes a neutral state is perfect for meditation.",
    "This is a good time for some mindful breathing."
  ]
};

const getRandomResponse = (responses) => {
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
};

const useFaceRecognition = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [detectedEmotion, setDetectedEmotion] = useState(null);
  const { setStressLevel } = useHappy();

  const processImage = useCallback(async (imageData) => {
    setIsProcessing(true);
    try {
      // Convert base64 to blob
      const base64Response = await fetch(imageData);
      const blob = await base64Response.blob();

      // Create form data
      const formData = new FormData();
      formData.append('file', blob, 'image.jpg');

      // Send to backend
      console.log('Sending image to server...');
      const response = await fetch('http://localhost:8000/analyze-face', {
        method: 'POST',
        body: formData,
      });
      console.log('Server response status:', response.status);

      const data = await response.json();
      console.log('DeepFace analysis result:', data);

      if (data.status === 'error') {
        throw new Error(data.message);
      }

      const emotion = data.dominant_emotion;
      setDetectedEmotion(emotion);
      setRecognizedPerson(data.person);

      // Update Happy's stress level based on detected emotion
      const stressImpact = EMOTION_STRESS_LEVELS[emotion] || 0;
      setStressLevel(prevLevel => {
        const newLevel = prevLevel + stressImpact;
        return Math.max(0, Math.min(5, newLevel)); // Keep between 0 and 5
      });

      // Get base response
      const baseResponse = getRandomResponse(EMOTION_RESPONSES[emotion] || EMOTION_RESPONSES.neutral);
      
      // Personalize if we know the person
      const personalizedResponse = data.person && data.person !== 'Unknown' 
        ? baseResponse.replace("!", `, ${data.person}!`)
        : baseResponse;

      return {
        person: data.person,
        emotion: emotion,
        response: personalizedResponse,
        allEmotions: data.emotion_scores
      };

    } catch (error) {
      console.error('Error processing image:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [setStressLevel]);

  return {
    isProcessing,
    recognizedPerson,
    detectedEmotion,
    processImage
  };
};

export default useFaceRecognition;