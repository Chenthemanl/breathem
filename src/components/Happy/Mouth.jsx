import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';

const MouthContainer = styled.div`
  width: clamp(189.97px, calc(516 * 100% / 901), 516px);
  height: auto;
  cursor: pointer;
  pointer-events: auto;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const Mouth = ({ onMenuTrigger }) => {
  return (
    <MouthContainer 
      onClick={onMenuTrigger}
      title="Open menu"
      aria-label="Click mouth to open menu"
    >
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 516 54" 
        fill="none"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d="M2 0 C100 52 416 52 514 0"
          stroke="#8F8F8F"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </MouthContainer>
  );
};

export default Mouth;