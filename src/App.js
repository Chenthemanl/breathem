import React, { useRef, useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { ErrorBoundary } from 'react-error-boundary';
import Happy from './components/Happy/Happy';
import AdminPanel from './components/Admin/AdminPanel';
import { HappyProvider } from './context/HappyContext';
import { MessageProvider } from './context/MessageContext';

// All your styled components remain the same

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