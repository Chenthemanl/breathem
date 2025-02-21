import styled, { keyframes, css } from 'styled-components';

const normalBreathing = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.975); }
`;

export const Frame = styled.div`
  width: 94%;
  max-width: calc(min(901px, 100vw - 80px));
  margin: auto;
  position: relative;
  
  @media (max-width: 600px) {
    max-width: calc(min(901px, 100vw - 40px));
    width: 94%;
  }

  @media (max-height: 500px) and (orientation: landscape) {
    width: 50%;
    max-width: calc(min(901px, 60vh * 1.6));
    margin: auto;
  }
`;

export const Container = styled.div`
  width: 100%;
  height: 0;
  padding-bottom: 56.827%;
  border: 1px solid #8F8F8F;
  border-radius: min(calc(29 * 100vw / 901), 20px);
  position: relative;
  background-color: ${({ $stressLevel }) => {
    const stressColors = {
      1: '#FFE0E0',
      2: '#FFC1C1',
      3: '#FFA2A2',
      4: '#FF8383',
      5: '#FF6464'
    };
    return stressColors[$stressLevel] || '#FFFFFF';
  }};

  ${props => props.$isExercising ? css`
    transform: scale(${0.96 + (props.$progress * 0.1)});
  ` : css`
    animation: ${normalBreathing} 5s ease-in-out infinite;
  `}
  
  transform-origin: center center;
  transition: transform 0.05s linear, background-color 2s ease;
  cursor: pointer;

  @media (max-width: 600px) {
    padding-bottom: min(56.827%, calc(100vh - 60px));
  }

  @media (max-height: 500px) and (orientation: landscape) {
    padding-bottom: min(56.827%, calc(70vh - 40px));
    max-height: 60vh;
  }
`;

export const ContentWrapper = styled.div`
  position: absolute;
  top: calc(73 * 100% / 512);  // This maintains the exact same proportion in all views
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  width: 100%;
  height: auto;
  
  /* Remove the different top values for different views */
  @media (max-height: 500px) and (orientation: landscape) {
    transform: scale(1);  // Keep the scaling if needed
  }
`;