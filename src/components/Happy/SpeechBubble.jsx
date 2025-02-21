import React from 'react';
import styled from 'styled-components';

const BubbleWrapper = styled.div`
  position: absolute;
  top: calc(-100% - 30px);  /* Changed from percentage-based to calculation from element's height */
  left: 0;
  right: 0;
  transform: translateY(0);  /* Removed the percentage-based transform */
  display: flex;
  justify-content: flex-end;
  padding: 0 %;
  pointer-events: none;

  @media (max-height: 500px) and (orientation: landscape) {
    top: calc(-150% - 30px);
    padding: 0 3%;
  }
`;

const BubbleContainer = styled.div`
  position: relative;
  background: white;
  border: 1px solid #000000;
  border-radius: 10px;
  padding: 10px;
  max-width: min(500px, calc(100% - 40px));
  min-width: 200px;
  opacity: ${props => props.$isVisible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: auto;
  
  @media (max-height: 500px) and (orientation: landscape) {
    max-width: min(300px, calc(100% - 20px));
    min-width: 150px;
    padding: 8px;
    font-size: 0.9em;
  }
  
  /* Speech bubble tail */
  &:after {
    content: '';
    position: absolute;
    bottom: -12px;
    right: 30px;
    width: 0;
    height: 0;
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 12px solid #8F8F8F;
  }

  &:before {
    content: '';
    position: absolute;
    bottom: -9px;
    right: 32px;
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 10px solid white;
    z-index: 1;
  }
`;

const Text = styled.p`
  margin: 0;
  font-family: 'Kode Mono', monospace;
  font-size: clamp(12px, 2vw, 16px);
  color: #8F8F8F;
  text-align: left;
  line-height: 1.4;
  word-wrap: break-word;

  @media (max-height: 500px) and (orientation: landscape) {
    font-size: clamp(11px, 1.8vw, 14px);
  }
`;

const SpeechBubble = ({ message, isVisible }) => {
  return (
    <BubbleWrapper>
      <BubbleContainer $isVisible={isVisible}>
        <Text>{message}</Text>
      </BubbleContainer>
    </BubbleWrapper>
  );
};

export default SpeechBubble;