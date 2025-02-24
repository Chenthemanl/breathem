import React, { useState, useCallback, useEffect } from 'react';
import { useHappy } from '../../context/HappyContext';
import useBreathing from '../../hooks/useBreathing';
import useEmotionState from '../../hooks/useEmotionState';
import Menu from '../Menu/Menu';
import Eyes from './Eyes';
import Mouth from './Mouth';
import SpeechHandler from './SpeechHandler';
import styled, { css } from 'styled-components';
import { EMOTIONAL_STATES } from '../../utils/constants';
import {
  Frame,
  Container as BaseContainer,
  ContentWrapper
} from './styles';

// Enhanced Container with emotion animations
const Container = styled(BaseContainer)`
  transition: background-color 0.5s ease;
  
  ${props => props.$currentState === EMOTIONAL_STATES.ANGRY && css`
    animation: shake 0.5s ease-in-out;
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px) rotate(-1deg); }
      75% { transform: translateX(5px) rotate(1deg); }
      50% { transform: translateX(5px) rotate(1deg); }
    }
  `}

  background-color: ${props => {
    if (props.$stressLevel <= 0) return '#FFFFFF';
    const stressColors = {
      1: '#FFE0E0',
      2: '#FFC1C1',
      3: '#FFA2A2',
      4: '#FF8383',
      5: '#FF6464'
    };
    return stressColors[Math.ceil(props.$stressLevel)] || '#FFFFFF';
  }};
`;

const Happy = () => {
  // State management
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuType, setMenuType] = useState('main');
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  
  // Get context and hooks
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

  // Enhanced emotional state handling with debugging
  const handleEmotionalStateChange = useCallback((type, intensity) => {
    console.log('Emotional state change:', { type, intensity, currentStressLevel: stressLevel });
    
    // First update the emotional state
    handleEmotionalTrigger(type, intensity);
    
    // Then update the message based on the type and intensity
    let newMessage = '';
    if (type === 'stress') {
      if (intensity >= 3) {
        newMessage = "I can feel your intense frustration. Let's try some deep breathing exercises.";
        increaseStress(3);
      } else if (intensity >= 2) {
        newMessage = "I can feel your frustration. Let's try some breathing exercises.";
        increaseStress(2);
      } else {
        newMessage = "Things will get better. Would you like to meditate?";
        increaseStress(1);
      }
    } else if (type === 'calm') {
      if (intensity >= 3) {
        newMessage = "You're radiating such peaceful energy!";
        decreaseStress(3);
      } else if (intensity >= 2) {
        newMessage = "I'm so glad you're feeling better!";
        decreaseStress(2);
      } else {
        newMessage = "That's the spirit! Keep going!";
        decreaseStress(1);
      }
    }
    
    if (newMessage) {
      setMessage(newMessage);
      setShowMessage(true);
    }

    console.log('Updated emotional state:', { 
      newStressLevel: stressLevel, 
      currentState 
    });
  }, [handleEmotionalTrigger, increaseStress, decreaseStress, stressLevel, currentState]);

  // Hide message after delay
  useEffect(() => {
    if (showMessage) {
      const timer = setTimeout(() => {
        setShowMessage(false);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [showMessage]);

  // Handle left eye click - Meditation
  const handleLeftEyeClick = useCallback(() => {
    toggleMeditation();
    setMessage("Let's meditate together.");
    setShowMessage(true);
    decreaseStress(1); // Meditation reduces stress
  }, [toggleMeditation, decreaseStress]);

  // Handle right eye click - Breathing or Close Menu
  const handleRightEyeClick = useCallback(() => {
    if (menuOpen) {
      setMenuOpen(false);
      setMenuType('main');
    } else {
      if (isExercising) {
        stopExercise();
      } else {
        startExercise();
        setMessage("Focus on your breath...");
        setShowMessage(true);
        decreaseStress(1); // Breathing exercises reduce stress
      }
      toggleBreathing();
    }
  }, [menuOpen, isExercising, startExercise, stopExercise, toggleBreathing, decreaseStress]);

  // Handle mouth click - Open Menu
  const handleMouthClick = useCallback(() => {
    setMenuOpen(true);
    setMenuType('main');
  }, []);

  // Handle menu navigation
  const handleMenuNavigate = useCallback((page) => {
    switch (page) {
      case 'settings':
        setMenuType('settings');
        break;
      case 'meditation':
        setMenuOpen(false);
        toggleMeditation();
        setMessage("Starting meditation session...");
        setShowMessage(true);
        decreaseStress(1);
        break;
      case 'breathing':
        setMenuOpen(false);
        if (!isExercising) {
          startExercise();
          setMessage("Let's practice breathing together.");
          setShowMessage(true);
          decreaseStress(1);
        }
        toggleBreathing();
        break;
      default:
        setMenuOpen(false);
    }
  }, [toggleMeditation, toggleBreathing, isExercising, startExercise, decreaseStress]);

  // Handle clicking outside menu
  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
    setMenuType('main');
  }, []);

  return (
    <Frame>
      <Container
        $stressLevel={stressLevel}
        $isExercising={isExercising}
        $progress={progress}
        $currentState={currentState}
      >
        <ContentWrapper>
          <SpeechHandler 
            onEmotionalStateChange={handleEmotionalStateChange}
            currentState={currentState}
            stressLevel={stressLevel}
          />
          
          <Eyes 
            isMenuOpen={menuOpen}
            onLeftEyeClick={handleLeftEyeClick}
            onRightEyeClick={handleRightEyeClick}
          />
          
          <Mouth onMenuTrigger={handleMouthClick} />
        </ContentWrapper>
      </Container>

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