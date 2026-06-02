
import React from 'react';
import Home from './pages/Home';
import { HistoryProvider } from './context/HistoryContext';

const App: React.FC = () => {
  return (
    <HistoryProvider>
      <Home />
    </HistoryProvider>
  );
};

export default App;
