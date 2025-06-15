import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import AuthPage from './components/AuthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element= {<HomePage />} />
        <Route path="/auth" element= {<AuthPage />} />
      </Routes>
    </Router>
  );
}

export default App; 