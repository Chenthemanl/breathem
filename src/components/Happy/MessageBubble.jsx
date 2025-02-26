import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useMessage } from '../../context/MessageContext';

// The container for the speech bubble uses absolute positioning
// with coordinates calculated dynamically based on Happy's position
const BubbleWrapper = styled.div`
  position: fixed;
  left: ${props => props.$position.left}px;
  top: ${props => props.$position.top}px;
  width: ${props => props.$position.width}px;
  display: flex;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
  transition: all 0.3s ease; /* Smooth transitions when repositioning */
`;

const BubbleContainer = styled.div`
  position: relative;
  background: white;
  border: 1px solid #8F8F8F;
  border-radius: 10px;
  padding: 10px;
  max-width: min(400px, calc(100% - 40px));
  min-width: 290px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transform: translateY(${props => props.$isVisible ? 0 : -20}px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0);
  pointer-events: auto;
  
  /* Speech bubble tail pointing downward */
  &:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 30%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 5px solid transparent;
    border-top: 8px solid #8F8F8F;
  }
`;

const Text = styled.p`
  margin: 0;
  font-family: 'Kode Mono', monospace;
  font-size: clamp(12px, 2vw, 16px);
  color: #8F8F8F;
  text-align: center;
  line-height: 1.2;
  word-wrap: break-word;
`;

/**
 * The main message bubble component that displays messages from the centralized system
 * @param {Object} props - Component props
 * @param {React.RefObject} props.happyRef - Ref to the Happy component for positioning
 * @param {number} props.offsetY - Vertical offset from Happy (defaults to -80)
 */
const MessageBubble = ({ 
  happyRef,
  offsetY = -80 
}) => {
  // Get message data from the centralized context
  const { message, isVisible } = useMessage();
  
  // State to store the calculated position
  const [position, setPosition] = useState({ 
    top: 0, 
    left: 0, 
    width: 0 
  });
  
  // Calculate the bubble position based on Happy's position
  const updatePosition = () => {
    if (happyRef && happyRef.current) {
      const happyRect = happyRef.current.getBoundingClientRect();
      
      // Calculate optimal position above Happy
      setPosition({
        top: happyRect.top + offsetY, // Position above Happy with offset
        left: happyRect.left,
        width: happyRect.width
      });
    }
  };

  // Update position initially and when window resizes
  useEffect(() => {
    // Initial position calculation
    updatePosition();
    
    // Recalculate on window resize
    window.addEventListener('resize', updatePosition);
    
    // Recalculate periodically to handle dynamic changes
    const intervalId = setInterval(updatePosition, 1000);
    
    // Clean up event listeners and interval
    return () => {
      window.removeEventListener('resize', updatePosition);
      clearInterval(intervalId);
    };
  }, [happyRef, offsetY]);

  // Update position when visibility changes
  useEffect(() => {
    if (isVisible) {
      updatePosition();
    }
  }, [isVisible]);

  return (
    <BubbleWrapper $position={position}>
      <BubbleContainer $isVisible={isVisible}>
        <Text>{message}</Text>
      </BubbleContainer>
    </BubbleWrapper>
  );
};

export default MessageBubble;