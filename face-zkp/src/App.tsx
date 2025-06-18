import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './components/HomePage';
import AuthPage from './components/AuthPage';
import './config/appkit'; // Import the AppKit configuration

// Create a query client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element= {<HomePage />} />
          <Route path="/auth" element= {<AuthPage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 