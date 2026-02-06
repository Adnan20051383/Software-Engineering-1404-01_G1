import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WordList from './components/WordList/WordList';

function App() {
  return (
    <Router>
      <Routes>
        {/* This matches localhost:9101/words */}
        <Route path="/words" element={<WordList />} />

        {/* Default Dashboard */}
        <Route path="/" element={<h1>Welcome to Team1 Dashboard</h1>} />
      </Routes>
    </Router>
  );
}

export default App;