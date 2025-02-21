import styled from 'styled-components';
import { slideUp, fadeIn } from '../../utils/animations';

export const MenuContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-menu);
  background-color: rgba(0, 0, 0, 0);
  animation: ${fadeIn} var(--transition-normal) ease-out;
`;

export const MenuContent = styled.div`
  background-color: var(--color-background);
  border-top-left-radius: var(--radius-large);
  border-top-right-radius: var(--radius-large);
  padding: var(--spacing-lg);
  animation: ${slideUp} var(--transition-normal) ease-out;
  max-height: 80vh;
  overflow-y: auto;
`;

export const MenuHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
`;

export const MenuTitle = styled.h2`
  font-size: var(--font-size-large);
  font-weight: 600;
  color: var(--color-text);
`;

export const MenuDescription = styled.p`
  color: var(--color-text);
  margin-bottom: var(--spacing-lg);
`;

export const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text);
  padding: var(--spacing-xs);
  
  &:hover {
    opacity: 0.8;
  }
`;

export const MenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--radius-medium);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

export const MenuItemIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-md);
  background-color: var(--color-primary);
  border-radius: var(--radius-small);
  opacity: 0.1;
`;

export const MenuItemContent = styled.div`
  flex: 1;
`;

export const MenuItemTitle = styled.h3`
  font-size: var(--font-size-base);
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
`;

export const StatsSection = styled.div`
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
`;

export const StatItem = styled.div`
  text-align: center;
  
  h3 {
    font-size: var(--font-size-small);
    color: var(--color-text);
    opacity: 0.7;
    margin-bottom: var(--spacing-xs);
  }
  
  p {
    font-size: var(--font-size-large);
    font-weight: 500;
  }
`;