import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const MenuContainer = styled.div`
  position: absolute;
  left: 50%;
  top: 65%; /* Slightly higher than center to avoid bottom border */
  transform: translate(-50%, -50%); /* This ensures perfect centering */
  width: 60%;
  height: 60%;
  z-index: 1; /* This ensures the menu appears above Happy's border */
  background: white;
  border-radius: 13px;
  border: 1px solid #8F8F8F;
  padding: 0px;
  font-family: 'Kode Mono', monospace;
  color: #8F8F8F;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
  min-height: 100px;

  
  /* Ensure minimum font size */
  font-size: max(12px, 1vw);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #8F8F8F;
    border-radius: 3px;
  }
`;

const MenuOption = styled.div`
  padding: 7px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SettingsContainer = styled.div`
  padding: 15px 0;
`;

const SettingsTitle = styled.div`
  font-size: max(12px, 1.2em);
  margin-bottom: 20px;
  text-align: center;
`;

const SettingRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
  flex-wrap: wrap;
  gap: 10px;
`;

const ToggleGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ModeButton = styled.button`
  padding: 6px 12px;
  border: 1px solid #8F8F8F;
  border-radius: 8px;
  background: ${props => props.$isActive ? '#8F8F8F' : 'white'};
  color: ${props => props.$isActive ? 'white' : '#8F8F8F'};
  font-family: 'Kode Mono', monospace;
  font-size: max(12px, 0.9em);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    opacity: 0.8;
  }
`;

const ConsentToggle = styled.button`
  width: 24px;
  height: 24px;
  border: 1px solid #8F8F8F;
  border-radius: 6px;
  background: ${props => props.$isActive ? '#8F8F8F' : 'white'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.8;
  }
`;

const Menu = ({ type = 'main', onNavigate, onClose }) => {
  const [mode, setMode] = React.useState('static');
  const [consents, setConsents] = React.useState([false, false, false]);
  const menuRef = useRef(null);

  const toggleConsent = (index) => {
    const newConsents = [...consents];
    newConsents[index] = !newConsents[index];
    setConsents(newConsents);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const menuContent = type === 'main' ? (
    <>
      <MenuOption onClick={() => onNavigate('meditation')}>
        Next meditation
      </MenuOption>
      <MenuOption onClick={() => onNavigate('breathing')}>
        Breath with Happy
      </MenuOption>
      <MenuOption onClick={() => onNavigate('settings')}>
        Settings
      </MenuOption>
    </>
  ) : (
    <SettingsContainer>
      <SettingsTitle>Settings</SettingsTitle>
      <SettingRow>
        <span>Mode:</span>
        <ToggleGroup>
          <ModeButton 
            $isActive={mode === 'static'} 
            onClick={() => setMode('static')}
          >
            Static
          </ModeButton>
          <ModeButton 
            $isActive={mode === 'active'} 
            onClick={() => setMode('active')}
          >
            Active
          </ModeButton>
        </ToggleGroup>
      </SettingRow>
      <SettingRow>
        <span>Consent:</span>
        <ToggleGroup>
          {consents.map((isActive, index) => (
            <ConsentToggle
              key={index}
              $isActive={isActive}
              onClick={() => toggleConsent(index)}
            />
          ))}
        </ToggleGroup>
      </SettingRow>
    </SettingsContainer>
  );

  return (
    <MenuContainer ref={menuRef}>
      {menuContent}
    </MenuContainer>
  );
};

export default Menu;