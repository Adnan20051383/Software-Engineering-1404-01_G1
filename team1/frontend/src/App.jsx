import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import WordList from './components/WordList/WordList';
import Game from './components/Game/Game';
import Quiz from './components/Quiz/Quiz';
import CreateUserWord  from './components/UserWord/user-word';
function App() {
  return (
    <Router>
      <Routes>
        {/* This matches localhost:9101/words */}
        <Route path="/words" element={<WordList />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/game" element={<Game />} />
        <Route path="/userwords" element={<CreateUserWord />} />

        {/* Default Dashboard */}
        <Route path="/" element={<h1>Welcome to Team1 Dashboard</h1>} />
      </Routes>
    </Router>
  );
}

export default App;