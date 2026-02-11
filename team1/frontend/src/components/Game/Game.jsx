import React, { useState, useEffect } from 'react';
import { survivalGameService } from '../../services/game-service';
import './Game.css';

const Game = () => {
    const [game, setGame] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
    const [selectedId, setSelectedId] = useState(null);
    const [gameOver, setGameOver] = useState(false);

    // Start a new session
    const startGame = async () => {
        setLoading(true);
        setGameOver(false);
        try {
            // Initializing with 0 score and 3 lives
            const newGame = await survivalGameService.createSurvivalGame(0, 3);
            setGame(newGame);
            fetchNextQuestion(newGame.survival_game_id);
        } catch (err) {
            console.error("Failed to start game:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchNextQuestion = async (gameId) => {
        setFeedback(null);
        setSelectedId(null);
        try {
            const question = await survivalGameService.getNextQuestion(gameId);
            setCurrentQuestion(question);
        } catch (err) {
            console.error("Error fetching question:", err);
        }
    };

    const handleAnswer = async (optionId) => {
        if (feedback || gameOver) return;
        setSelectedId(optionId);

        try {
            const result = await survivalGameService.submitSingleAnswer(game.survival_game_id, optionId);
            
            setFeedback(result.is_correct ? 'correct' : 'wrong');
            setGame(prev => ({ ...prev, score: result.score, lives: result.lives }));

            if (result.game_over) {
                setGameOver(true);
            } else {
                // Short delay so user sees feedback before next question
                setTimeout(() => fetchNextQuestion(game.survival_game_id), 1500);
            }
        } catch (err) {
            console.error("Submission error:", err);
        }
    };

    if (!game) {
        return (
            <div className="game-container">
                <button className="start-btn" onClick={startGame} disabled={loading}>
                    {loading ? "Loading..." : "Start Survival Challenge"}
                </button>
            </div>
        );
    }

    return (
        <div className="game-container">
            <div className="stats-bar">
                <div className="stat">Score: <span>{game.score}</span></div>
                <div className="stat">Lives: <span>{Array(game.lives).fill('❤️').join('')}</span></div>
            </div>

            {gameOver ? (
                <div className="game-over-screen">
                    <h1>Game Over!</h1>
                    <p>Your Final Score: {game.score}</p>
                    <button className="start-btn" onClick={startGame}>Try Again</button>
                </div>
            ) : currentQuestion ? (
                <div className="question-card">
                    <h2>{currentQuestion.prompt}</h2>
                    <div className="options-grid">
                        {currentQuestion.options.map(opt => (
                            <button
                                key={opt.word_id}
                                className={`option-btn ${selectedId === opt.word_id ? feedback : ''}`}
                                onClick={() => handleAnswer(opt.word_id)}
                                disabled={!!feedback}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <p>Loading question...</p>
            )}
        </div>
    );
};

export default Game;