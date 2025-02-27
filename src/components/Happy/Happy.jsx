import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHappy } from '../../context/HappyContext';
import { useMessage } from '../../context/MessageContext';
import useBreathing from '../../hooks/useBreathing';
import useEmotionState from '../../hooks/useEmotionState';
import Menu from '../Menu/Menu';
import Eyes from './Eyes';
import Mouth from './Mouth';
import SpeechHandler from './SpeechHandler';
import MessageBubble from './MessageBubble';
import SmartEmotionResponseBubble from './SmartEmotionResponseBubble';
import FaceRecognition from '../FaceRecognition/FaceRecognition';
import styled, { css } from 'styled-components';
import { EMOTIONAL_STATES } from '../../utils/constants';
import {
  Frame,
  Container as BaseContainer,
  ContentWrapper
} from './styles';

// Enhanced Container component with improved emotion animations and colors
const Container = styled(BaseContainer)`
  transition: all 0.5s ease;
  
  // Shake animation for angry state with smoother transitions
  ${props => props.$currentState === EMOTIONAL_STATES.ANGRY && css`
    animation: shake 0.5s cubic-bezier(0.36, 0, 0.66, -0.56) 4;
    
    @keyframes shake {
      0%, 100% { 
        transform: translateX(0) scale(${props => props.$isExercising ? 0.96 + (props.$progress * 0.1) : 1}); 
      }
      25% { 
        transform: translateX(-5px) rotate(-1deg) scale(${props => props.$isExercising ? 0.96 + (props.$progress * 0.1) : 1}); 
      }
      75% { 
        transform: translateX(5px) rotate(1deg) scale(${props => props.$isExercising ? 0.96 + (props.$progress * 0.1) : 1}); 
      }
    }
  `}

  // Enhanced background color transitions based on stress level
  background-color: ${props => {
    if (props.$stressLevel <= 0) return '#FFFFFF';
    // More granular color transitions for stress levels
    const stressColors = {
      1: '#FFE6E6',
      2: '#FFD1D1',
      3: '#FFBDBD',
      4: '#FFA8A8',
      5: '#FF9494'
    };
    return stressColors[Math.ceil(props.$stressLevel)] || '#FFFFFF';
  }};

  // Breathing exercise scaling with smoother transitions
  transform: ${props => props.$isExercising ? 
    `scale(${0.96 + (props.$progress * 0.1)})` : 
    'scale(1)'};
`;

const Happy = () => {
  // Core state management
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuType, setMenuType] = useState('main');
  const [recognizedPerson, setRecognizedPerson] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  
  // Ref for the Happy container to track its position for speech bubbles
  const happyContainerRef = useRef(null);
  
  // Refs for managing animations
  const emotionProcessingRef = useRef(false);

  // Get access to the centralized message system
  const { showMessage } = useMessage();

  // Custom hooks for different functionalities
  const {
    getCurrentState,
    toggleMeditation,
    toggleBreathing,
  } = useHappy();

  const { 
    isExercising, 
    progress, 
    startExercise, 
    stopExercise 
  } = useBreathing();

  const {
    currentState,
    stressLevel,
    handleEmotionalTrigger,
    increaseStress,
    decreaseStress
  } = useEmotionState();

  // Enhanced emotion state handler with debouncing and validation - For speech input
  const handleEmotionalStateChange = useCallback((type, intensity) => {
    // Prevent rapid emotion state changes
    if (emotionProcessingRef.current) return;
    emotionProcessingRef.current = true;

    console.log('Processing emotional state change:', { 
      type, 
      intensity, 
      currentStressLevel: stressLevel 
    });

    try {
      // Validate emotion type and intensity
      const validTypes = ['stress', 'calm', 'angry', 'fear', 'sad', 'happy', 'neutral'];
      const validatedType = validTypes.includes(type) ? type : 'neutral';
      const validatedIntensity = Math.max(1, Math.min(3, intensity));

      // Update emotional state
      handleEmotionalTrigger(validatedType, validatedIntensity);

      // Generate appropriate response based on emotion type and intensity
      let newMessage = '';
      if (['stress', 'angry', 'fear', 'sad'].includes(validatedType)) {
        if (validatedIntensity >= 3) {
          newMessage = "I sense strong emotions. Let's try deep breathing to help you feel better.";
          increaseStress(3);
        } else if (validatedIntensity >= 2) {
          newMessage = "You seem troubled. Would you like to try some calming exercises?";
          increaseStress(2);
        } else {
          newMessage = "I'm here to help. Should we meditate together?";
          increaseStress(1);
        }
      } else if (['calm', 'happy', 'neutral'].includes(validatedType)) {
        if (validatedIntensity >= 3) {
          newMessage = "Your positive energy is inspiring! Let's maintain this wonderful state.";
          decreaseStress(3);
        } else if (validatedIntensity >= 2) {
          newMessage = "You're doing great! Would you like to enhance this feeling?";
          decreaseStress(2);
        } else {
          newMessage = "Every moment of peace is precious. Let's build on this.";
          decreaseStress(1);
        }
      }

      // Update message display using centralized system
      if (newMessage) {
        showMessage(newMessage, 2);
      }

      console.log('Emotional state updated:', {
        newStressLevel: stressLevel,
        currentState,
        message: newMessage
      });
    } catch (error) {
      console.error('Error processing emotional state:', error);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        emotionProcessingRef.current = false;
      }, 1000);
    }
  }, [handleEmotionalTrigger, increaseStress, decreaseStress, stressLevel, currentState, showMessage]);

  // Modified face emotion detection handler that sets emotion data
  const handleFaceEmotionDetected = useCallback((result) => {
    if (!result || !result.emotion) {
      console.warn('Invalid face detection result received');
      return;
    }
  
    console.log('Processing face emotion:', result);
    
    // Store the recognized person
    if (result.person && result.person !== 'Unknown') {
      setRecognizedPerson(result.person);
    }
    
    // Create a completely new object with timestamp to ensure React detects the change
    setEmotionData({
      emotion: result.emotion,
      person: result.person,
      timestamp: Date.now(),
      isNew: true // Additional flag to force update
    });
    
    console.log('Emotion data set:', result.emotion);
    
  }, []);

  // Enhanced interaction handlers
  const handleLeftEyeClick = useCallback(() => {
    toggleMeditation();
    
    // Use personalized message if we know who the person is
    if (recognizedPerson) {
      showMessage(`Let's meditate together, ${recognizedPerson}!`, 3);
    } else {
      showMessage("Let's share a peaceful meditation moment together.", 3);
    }
    
    decreaseStress(1);
  }, [toggleMeditation, decreaseStress, recognizedPerson, showMessage]);

  const handleRightEyeClick = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
      setMenuType('main');
    } else {
      if (isExercising) {
        stopExercise();
      } else {
        startExercise();
        
        // Use personalized message if we know who the person is
        if (recognizedPerson) {
          showMessage(`Follow my lead, ${recognizedPerson}, as we breathe together...`, 3);
        } else {
          showMessage("Follow my lead as we breathe together...", 3);
        }
        
        decreaseStress(1);
      }
      toggleBreathing();
    }
  }, [menuOpen, isExercising, startExercise, stopExercise, toggleBreathing, decreaseStress, recognizedPerson, showMessage]);

  const handleMouthClick = useCallback(() => {
    setMenuOpen(true);
    setMenuType('main');
  }, []);

  // Enhanced menu navigation handler
  const handleMenuNavigate = useCallback((page) => {
    switch (page) {
      case 'settings':
        setMenuType('settings');
        break;
      case 'meditation':
        setMenuOpen(false);
        toggleMeditation();
        
        // Use personalized message if we know who the person is
        if (recognizedPerson) {
          showMessage(`Let's find our center through meditation, ${recognizedPerson}...`, 3);
        } else {
          showMessage("Finding our center through meditation...", 3);
        }
        
        decreaseStress(1);
        break;
      case 'breathing':
        setMenuOpen(false);
        if (!isExercising) {
          startExercise();
          
          // Use personalized message if we know who the person is
          if (recognizedPerson) {
            showMessage(`Let's find calm through mindful breathing, ${recognizedPerson}.`, 3);
          } else {
            showMessage("Let's find calm through mindful breathing.", 3);
          }
          
          decreaseStress(1);
        }
        toggleBreathing();
        break;
      default:
        setMenuOpen(false);
    }
  }, [toggleMeditation, toggleBreathing, isExercising, startExercise, decreaseStress, recognizedPerson, showMessage]);

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
    setMenuType('main');
  }, []);

  return (
    <Frame>
      {/* Single centralized message bubble */}
      <MessageBubble 
        happyRef={happyContainerRef}
        offsetY={-80}
      />
      
      {/* Smart emotion processor (no UI, just logic) */}
      <SmartEmotionResponseBubble 
        emotionData={emotionData} 
        recognizedPerson={recognizedPerson}
      />
      
      {/* The Happy container with ref for position tracking */}
      <Container
        ref={happyContainerRef}
        $stressLevel={stressLevel}
        $isExercising={isExercising}
        $progress={progress}
        $currentState={currentState}
      >
        <ContentWrapper>
          <Eyes 
            isMenuOpen={menuOpen}
            onLeftEyeClick={handleLeftEyeClick}
            onRightEyeClick={handleRightEyeClick}
          />
          <Mouth onMenuTrigger={handleMouthClick} />
        </ContentWrapper>
      </Container>

      <FaceRecognition onEmotionDetected={handleFaceEmotionDetected} />
          
      {/* Speech handler for voice-based interaction (no UI, just logic) */}
      <SpeechHandler 
        onEmotionalStateChange={handleEmotionalStateChange}
      />
    
      {menuOpen && (
        <Menu
          type={menuType}
          onNavigate={handleMenuNavigate}
          onClose={handleMenuClose}
        />
      )}
    </Frame>
  );
};

export default Happy;