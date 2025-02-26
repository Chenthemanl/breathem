import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { ErrorBoundary } from 'react-error-boundary';
import Happy from './components/Happy/Happy';
import AdminPanel from './components/Admin/AdminPanel';
import { HappyProvider } from './context/HappyContext';
import { MessageProvider } from './context/MessageContext';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: min(40px, 5vw);
  text-align: center;
  font-family: 'Kode Mono', monospace;
  color: #8F8F8F;
`;

const ErrorMessage = styled.div`
  background: white;
  border: 2px solid #FFE4E1;
  border-radius: 13px;
  padding: min(20px, 5vw);
  max-width: min(600px, 90vw);
  margin: min(20px, 5vw);
`;

const RetryButton = styled.button`
  background: #8F8F8F;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-family: 'Kode Mono', monospace;
  cursor: pointer;
  margin-top: min(20px, 5vw);
  
  &:hover {
    opacity: 0.9;
  }
`;

const AppContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  max-height: 100vh;
  margin: 0;
  background-color: #FFFFFF;
  padding: min(20px, 5vw);
  overflow: hidden;
  
  @media (max-width: 600px) {
    padding: 10px;
  }
`;

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <ErrorContainer role="alert">
      <ErrorMessage>
        <h2>Oops! Something went wrong</h2>
        <p>Don't worry, Happy just needs a quick reset!</p>
        <p>Error details:</p>
        <pre style={{ color: '#FF6B6B' }}>{error.message}</pre>
        <RetryButton onClick={resetErrorBoundary}>
          Try Again
        </RetryButton>
      </ErrorMessage>
    </ErrorContainer>
  );
}

function App() {
  const handleReset = () => {
    console.log('Resetting application state...');
  };

  return (
    <HashRouter>
      <ErrorBoundary 
        FallbackComponent={ErrorFallback}
        onReset={handleReset}
        onError={(error, errorInfo) => {
          console.error('Error caught by boundary:', error, errorInfo);
        }}
      >
        <HappyProvider>
          <MessageProvider>
            <Routes>
              <Route path="/" element={
                <AppContainer>
                  <Happy />
                </AppContainer>
              } />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </MessageProvider>
        </HappyProvider>
      </ErrorBoundary>
    </HashRouter>
  );
}

export default App;