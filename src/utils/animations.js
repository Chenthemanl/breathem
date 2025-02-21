import { keyframes } from 'styled-components';
import { ANIMATION_TIMING } from './constants';

// Basic breathing animation
export const normalBreathing = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.98); }
`;

// Deep breathing animation
export const deepBreathing = keyframes`
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.02); }
  50% { transform: scale(0.975); }
  75% { transform: scale(1.01); }
`;

// Box breathing animation
export const boxBreathing = keyframes`
  0% { transform: scale(1); }
  25% { transform: scale(1.02); }
  50% { transform: scale(1.02); }
  75% { transform: scale(0.98); }
  100% { transform: scale(1); }
`;

// Happy bounce animation
export const happyBounce = keyframes`
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.02); }
`;

// Menu slide animation
export const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

// Menu fade animation
export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Animation durations and timings
export const timings = {
  breathingCycle: `${ANIMATION_TIMING.BREATHING_CYCLE}ms ease-in-out infinite`,
  menuTransition: `${ANIMATION_TIMING.MENU_TRANSITION}ms ease-out`,
  stateTransition: `${ANIMATION_TIMING.STATE_TRANSITION}ms ease-in-out`,
};

// Animation utility functions
export const getBreathingAnimation = (pattern) => {
  switch (pattern) {
    case 'deep':
      return deepBreathing;
    case 'box':
      return boxBreathing;
    case 'happy':
      return happyBounce;
    default:
      return normalBreathing;
  }
};

// Helper function to generate transition strings
export const createTransition = (properties, duration = 300) => {
  return properties
    .map(prop => `${prop} ${duration}ms ease-in-out`)
    .join(', ');
};