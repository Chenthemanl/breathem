import React from 'react';
import styled from 'styled-components';

const EyesContainer = styled.div`
  display: flex;
  justify-content: space-between;
  width: calc(351 * 100% / 901);
  margin-bottom: calc(20 * 100% / 512);
  pointer-events: auto;
  transform: scale(0.9);

  @media (max-height: 500px) and (orientation: landscape) {
    width: calc(351 * 100% / 901);
    margin-bottom: calc(20 * 100% / 512);
    transform: scale(0.9);
  }
`;

const Eye = styled.div`
  width: clamp(12.94px, calc(35 * 100vw / 901), 35px);
  height: clamp(12.57px, calc(34 * 100vw / 901), 34px);
  background-color: #8F8F8F;
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;
  cursor: pointer;
  position: relative;

  @media (max-height: 500px) and (orientation: landscape) {
    width: clamp(12.94px, calc(35 * 100vh / 901), 35px);
    height: clamp(12.57px, calc(34 * 100vh / 901), 34px);
  }

  &:hover {
    transform: scale(1.1);
  }
`;

const RightEye = styled(Eye)`
  ${props => props.$isMenuOpen && `
    background-color: transparent;
    position: relative;
    
    &::before,
    &::after,
    & span {
      content: '';
      position: absolute;
      width: 100%;
      height: 2px;
      background-color: #8F8F8F;
      transition: all 0.3s ease;
    }

    &::before {
      top: 5%;
    }

    span {
      top: 50%;
      transform: translateY(-50%);
    }

    &::after {
      bottom: 5%;
    }
  `}
`;

const BurgerLine = styled.span`
  display: none;
  ${props => props.$isMenuOpen && `
    display: block;
  `}
`;

const Eyes = ({ isMenuOpen, onLeftEyeClick, onRightEyeClick }) => {
  return (
    <EyesContainer>
      <Eye onClick={onLeftEyeClick} />
      <RightEye 
        $isMenuOpen={isMenuOpen} 
        onClick={onRightEyeClick}
        aria-label={isMenuOpen ? "Close menu" : "Start breathing exercise"}
      >
        <BurgerLine $isMenuOpen={isMenuOpen} />
      </RightEye>
    </EyesContainer>
  );
};

export default Eyes;