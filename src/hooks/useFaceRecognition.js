import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for handling face recognition and emotion analysis
 * Provides functionality for processing images and getting emotional responses
 */
const useFaceRecognition = () => {
  // Track the processing state to prevent multiple simultaneous requests
  const [isProcessing, setIsProcessing] = useState(false);
  // Track any errors that occur during processing
  const [error, setError] = useState(null);

  /**
   * Converts a data URL to a Blob object
   * @param {string} dataUrl - The data URL containing the image data
   * @returns {Blob} A Blob object containing the image data
   */
  const dataURLtoBlob = useCallback(async (dataUrl) => {
    try {
      // Extract the base64 data from the data URL
      const base64Data = dataUrl.split(',')[1];
      // Convert to blob using fetch API
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      return blob;
    } catch (error) {
      console.error('Error converting data URL to blob:', error);
      throw new Error('Failed to process image format');
    }
  }, []);

  /**
   * Gets a friendly response based on the detected emotion
   * @param {string} emotion - The detected emotion
   * @returns {string} A friendly response message
   */
  const getEmotionResponse = useCallback((emotion) => {
    const responses = {
      happy: [
        "Your smile brightens the room! Shall we maintain this positive energy?",
        "I love seeing you happy! Would you like to enhance this joy with meditation?",
        "Your happiness is contagious! Let's channel this positive energy."
      ],
      sad: [
        "I sense some sadness. Would you like to try a gentle meditation?",
        "Sometimes we all feel down. Let's work through this together.",
        "I'm here to support you. How about some calming exercises?"
      ],
      angry: [
        "I notice you're frustrated. Let's try some deep breathing exercises.",
        "Anger is natural, but let's find a way to release it positively.",
        "I understand you're upset. Would you like to try some stress relief techniques?"
      ],
      neutral: [
        "A calm mind is ready for meditation. Shall we begin?",
        "Sometimes neutral is perfect. Would you like to explore some mindfulness?",
        "You seem centered. It's a good time for some breathing exercises."
      ],
      surprise: [
        "Something unexpected caught your attention! Let's center ourselves.",
        "Surprises can be unsettling. Would you like to find your calm?",
        "Let's take a moment to process this surprise with some breathing."
      ],
      fear: [
        "I sense some anxiety. Let's work through it together.",
        "Fear is normal, but we can manage it. How about some grounding exercises?",
        "You're safe here. Would you like to try some calming techniques?"
      ],
      disgust: [
        "Let's shift to a more comfortable state with some mindfulness.",
        "Sometimes things bother us. Shall we focus on finding peace?",
        "I notice your discomfort. How about some clearing exercises?"
      ]
    };

    // Get the array of responses for the emotion, or use neutral responses as default
    const emotionResponses = responses[emotion] || responses.neutral;
    // Randomly select one response from the array
    return emotionResponses[Math.floor(Math.random() * emotionResponses.length)];
  }, []);

  /**
   * Processes an image for face recognition and emotion analysis
   * @param {string} imageData - The image data as a base64 string or data URL
   * @returns {Promise<Object>} The processing results including emotion and person recognition
   */
  const processImage = useCallback(async (imageData) => {
    // Don't process if we're already processing an image
    if (isProcessing) {
      console.warn('Face recognition is already in progress');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Face Recognition: Sending image to server...');
      
      // Convert the image data to a blob
      const blob = await dataURLtoBlob(imageData);
      
      // Prepare the form data for upload
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');

      // Send the image to the server for processing
      const response = await fetch('http://localhost:8000/analyze-face', {
        method: 'POST',
        body: formData
      });

      console.log('Face Recognition: Server response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Log the results for debugging
      console.log('Face Recognition Results');
      console.log('Detected Emotion:', result.dominant_emotion);
      console.log('Emotion Scores:', result.emotion_scores);
      console.log('Recognized Person:', result.person);
      console.log('Full Response:', result);

      // Generate a response message based on the detected emotion
      const responseMessage = getEmotionResponse(result.dominant_emotion);

      // Return the processed results in a consistent format
      return {
        success: true,
        person: result.person,
        emotion: result.dominant_emotion,
        allEmotions: result.emotion_scores,
        response: responseMessage
      };

    } catch (error) {
      console.error('Face Recognition Error:', error);
      setError(error.message);
      
      // Return a fallback response when an error occurs
      return {
        success: false,
        person: 'Unknown',
        emotion: 'neutral',
        allEmotions: {},
        response: 'I had trouble reading your emotions. Would you like to try some breathing exercises?'
      };
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, dataURLtoBlob, getEmotionResponse]);

  // Return the hook's interface
  return {
    isProcessing,
    error,
    processImage
  };
};

export default useFaceRecognition;