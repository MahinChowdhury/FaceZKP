import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './components/HomePage';
import AuthPages from './components/AuthPages';
import './config/appkit'; // Import the AppKit configuration
import VotingPage from './components/VotingPage';

// Create a query client for React Query
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element= {<HomePage />} />
          <Route path="/auth" element= {<AuthPages />} />
          <Route path="/vote" element={<VotingPage />}/>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App; 