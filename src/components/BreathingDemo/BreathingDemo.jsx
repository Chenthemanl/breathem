import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Normal - Very Subtle
const normalBreathing = keyframes`
  0% { transform: scale(1); }
  30% { transform: scale(1.01); }     // Gentle inhale
  40% { transform: scale(1.01); }     // Hold breath
  85% { transform: scale(0.99); }     // Gentle exhale
  100% { transform: scale(1); }
`;

// Dimensional - Subtle but Noticeable
const dimensionalBreathing = keyframes`
  0% { transform: scale(1) translateY(0); }
  30% { transform: scale(1.03) translateY(-3px); }    // Inhale up
  40% { transform: scale(1.03) translateY(-3px); }    // Hold
  85% { transform: scale(0.98) translateY(2px); }     // Exhale down
  100% { transform: scale(1) translateY(0); }
`;

// Balloon - More Pronounced
const balloonBreathing = keyframes`
  0% { transform: scale(1); border-radius: 16px; }
  30% { transform: scale(1.05); border-radius: 24px; }   // Fuller inhale
  40% { transform: scale(1.05); border-radius: 24px; }   // Hold expanded
  85% { transform: scale(0.97); border-radius: 16px; }   // Deeper exhale
  100% { transform: scale(1); border-radius: 16px; }
`;

// Dynamic - Most Noticeable
const dynamicBreathing = keyframes`
  0% { 
    transform: scale(1); 
    box-shadow: none;
    border-radius: 16px;
  }
  30% { 
    transform: scale(1.06); 
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    border-radius: 24px;
  }
  40% { 
    transform: scale(1.06); 
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    border-radius: 24px;
  }
  85% { 
    transform: scale(0.96); 
    box-shadow: none;
    border-radius: 16px;
  }
  100% { 
    transform: scale(1); 
    box-shadow: none;
    border-radius: 16px;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 24px;
  max-width: 900px;
  margin: 0 auto;
  font-family: 'Kode Mono', monospace;
`;

const Title = styled.h2`
  color: #8F8F8F;
  text-align: center;
  margin-bottom: 24px;
`;

const Description = styled.div`
  color: #8F8F8F;
  font-size: 14px;
  margin-bottom: 8px;
`;

const DemoContainer = styled.div`
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
`;

const Label = styled.div`
  width: 150px;
  color: #8F8F8F;
  font-size: 14px;
`;

const PhaseLabel = styled.div`
  width: 100px;
  color: #8F8F8F;
  font-size: 12px;
  text-align: center;
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s;
`;

const Frame = styled.div`
  position: relative;
  width: 200px;
  height: 113px; // Maintains original aspect ratio
  border: 2px solid #8F8F8F;
  border-radius: 16px;
  background: white;
  animation: ${props => {
    switch(props.$pattern) {
      case 'normal': return normalBreathing;
      case 'dimensional': return dimensionalBreathing;
      case 'balloon': return balloonBreathing;
      case 'dynamic': return dynamicBreathing;
      default: return normalBreathing;
    }
  }} 8s ease-in-out infinite;
`;

const Eyes = styled.div`
  position: absolute;
  top: 25%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
`;

const Eye = styled.div`
  width: 10px;
  height: 10px;
  background: #8F8F8F;
  border-radius: 50%;
`;

const Mouth = styled.div`
  position: absolute;
  top: 60%;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: #8F8F8F;
`;

const BreathingDemo = () => {
  const [currentPhase, setCurrentPhase] = useState('inhale');

  useEffect(() => {
    const interval = setInterval(() => {
      const time = (Date.now() / 8000) % 1;
      if (time < 0.3) setCurrentPhase('inhale');
      else if (time < 0.4) setCurrentPhase('hold');
      else if (time < 0.85) setCurrentPhase('exhale');
      else setCurrentPhase('reset');
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const patterns = [
    { name: 'Normal (Very Subtle)', id: 'normal', description: 'Just a hint of movement' },
    { name: 'Dimensional (Subtle)', id: 'dimensional', description: 'Gentle expansion with slight lift' },
    { name: 'Balloon (Medium)', id: 'balloon', description: 'More noticeable expansion' },
    { name: 'Dynamic (Pronounced)', id: 'dynamic', description: 'Most noticeable changes' },
  ];

  return (
    <Container>
      <Title>Breathing Pattern Intensities</Title>
      <Description>Each pattern shows a different intensity level while maintaining Happy's character</Description>
      <Description>Cycle: 2.4s inhale → 0.8s hold → 3.6s exhale → 1.2s reset</Description>
      
      {patterns.map(pattern => (
        <DemoContainer key={pattern.id}>
          <Label>
            {pattern.name}
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              {pattern.description}
            </div>
          </Label>
          <Frame $pattern={pattern.id}>
            <PhaseLabel $visible={true}>{currentPhase.toUpperCase()}</PhaseLabel>
            <Eyes>
              <Eye />
              <Eye />
            </Eyes>
            <Mouth />
          </Frame>
        </DemoContainer>
      ))}
    </Container>
  );
};

export default BreathingDemo;