import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SettingsProvider, SettingsContext } from './context/SettingsContext';
import { AuthProvider } from './context/AuthContext';
import { useContext } from 'react';
import Navbar from './components/NavBar/Navbar';
import WordList from './components/WordList/WordList';
import Game from './components/Game/Game';
import Quiz from './components/Quiz/Quiz';
import CreateUserWord from './components/UserWord/user-word';
import SurvivalTest from "./SurvivalTest";
import QuizTester from "./QuizTester";

function AppContent() {
  const { strings } = useContext(SettingsContext);

  return (
    <Router>
      <Navbar />
      <div className="container" style={{ padding: '20px' }}>
        <Routes>
          <Route path="/words" element={<WordList />} />
          <Route path="/quiz" element={<QuizTester />} />
          <Route path="/game" element={<SurvivalTest />} />
          <Route path="/userwords" element={<CreateUserWord />} />

          <Route path="/" element={<h1>{strings.welcome}</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (

    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;