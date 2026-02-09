import React, { useState } from 'react';
import { survivalGameService } from './services/game-service';

const SurvivalTest = () => {
  const [game, setGame] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong' | null
  const [correctAnswerText, setCorrectAnswerText] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);

  const startGame = async () => {
    try {
      setLoading(true);
      const newGame = await survivalGameService.createSurvivalGame(0, 3);
      setGame(newGame);
      fetchQuestion(newGame.survival_game_id);
    } catch (err) {
      alert("Error starting game: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuestion = async (gameId) => {
    setFeedback(null);
    setSelectedId(null);
    setCorrectAnswerText("");
    try {
      const q = await survivalGameService.getNextQuestion(gameId);
      setCurrentQuestion(q);
    } catch (err) {
      // If 404 or error, game might be over or no questions left
      console.error(err);
    }
  };

  const handleChoice = async (selectedWordId) => {
    if (feedback || game.lives <= 0) return;

    setSelectedId(selectedWordId);
    try {
      const result = await survivalGameService.submitSingleAnswer(game.survival_game_id, selectedWordId);

      setFeedback(result.is_correct ? "correct" : "wrong");
      setCorrectAnswerText(result.correct_answer_text);

      // Update score and lives
      setGame(prev => ({ ...prev, score: result.score, lives: result.lives }));

      if (result.game_over) {
        setTimeout(() => alert("Game Over! Final Score: " + result.score), 500);
      } else {
        // Wait 2 seconds so user sees the feedback, then fetch next
        setTimeout(() => fetchQuestion(game.survival_game_id), 2000);
      }
    } catch (err) {
      alert("Error submitting answer: " + err.message);
    }
  };

  if (!game) return <button onClick={startGame} disabled={loading}>{loading ? "Loading..." : "Start Survival Game"}</button>;

  return (
    <div style={{
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '10px',
        maxWidth: '400px',
        margin: '20px auto',
        fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span><strong>Score:</strong> {game.score}</span>
        <span style={{ color: game.lives === 1 ? 'red' : 'black' }}>
            <strong>Lives:</strong> {Array(game.lives).fill('❤️').join('') || '💀'}
        </span>
      </div>

      {currentQuestion ? (
        <div>
          <h2 style={{ textAlign: 'center' }}>{currentQuestion.prompt}</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {currentQuestion.options.map(opt => {
              // Styling logic like QuizTester
              let bgColor = '#f8f9fa';
              if (feedback && opt.word_id === selectedId) {
                bgColor = feedback === 'correct' ? '#d4edda' : '#f8d7da';
              }

              return (
                <button
                  key={opt.word_id}
                  onClick={() => handleChoice(opt.word_id)}
                  disabled={!!feedback}
                  style={{
                    padding: '12px',
                    backgroundColor: bgColor,
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    cursor: feedback ? 'default' : 'pointer',
                    fontSize: '16px',
                    transition: '0.3s'
                  }}
                >
                  {opt.text}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <p>Loading next challenge...</p>
      )}

      {feedback === "wrong" && (
        <div style={{ marginTop: '15px', textAlign: 'center', color: '#721c24' }}>
          <p>Oops! The correct answer was: <strong>{correctAnswerText}</strong></p>
        </div>
      )}

      {game.lives <= 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
           <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}
    </div>
  );
};

export default SurvivalTest;