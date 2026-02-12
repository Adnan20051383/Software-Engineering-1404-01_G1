import React, { useState, useEffect, useContext, useRef } from 'react';
import { survivalGameService } from '../../services/game-service';
import { SettingsContext } from '../../context/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { messageService } from "../../services/message-service";
import './Game.css';

const Game = () => {
    const { strings, lang, theme } = useContext(SettingsContext);
    const navigate = useNavigate();
    
    // --- Core States ---
    const [game, setGame] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null); 
    const [selectedId, setSelectedId] = useState(null);
    const [gameOver, setGameOver] = useState(false);

    // --- Stats & UI ---
    const [rankings, setRankings] = useState([]);
    const [correctAnswerText, setCorrectAnswerText] = useState("");
    const [timeLeft, setTimeLeft] = useState(15);
    const timerRef = useRef(null);

    // Load Rankings on mount
    useEffect(() => {
        survivalGameService.getTopSurvivalGameRanking()
            .then(data => setRankings(data || []))
            .catch(err => console.error("Leaderboard error:", err));
    }, []);

    // Timer Logic
    useEffect(() => {
        if (game && currentQuestion && !feedback && !gameOver) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleAnswer(-1); 
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [currentQuestion, feedback, gameOver, game]);

    // This handles both the first start and the "Try Again"
    const startGame = async () => {
        // --- HARD RESET ---
        setGameOver(false);
        setGame(null); 
        setFeedback(null);
        setSelectedId(null);
        setCorrectAnswerText("");
        setLoading(true);

        try {
            const newGame = await survivalGameService.createSurvivalGame(0, 3);
            const q = await survivalGameService.getNextQuestion(newGame.survival_game_id);
            setGame(newGame);
            setCurrentQuestion(q);
            setTimeLeft(15);
        } catch (err) {
            messageService.error(lang === 'fa' ? 'خطا در شروع بازی' : 'Error starting game');
        } finally {
            setLoading(false);
        }
    };

    const fetchNextQuestion = async (gameId) => {
        try {
            const question = await survivalGameService.getNextQuestion(gameId);
            setSelectedId(null);
            setFeedback(null);
            setCorrectAnswerText("");
            setCurrentQuestion(question);
            setTimeLeft(15);
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    const handleAnswer = async (optionId) => {
        if (feedback || gameOver) return;
        clearInterval(timerRef.current);
        setSelectedId(optionId);

        try {
            const result = await survivalGameService.submitSingleAnswer(game.survival_game_id, optionId);
            setFeedback(result.is_correct ? 'correct' : 'wrong');
            setCorrectAnswerText(result.correct_answer_text); 
            setGame(prev => ({ ...prev, score: result.score, lives: result.lives }));

            if (result.game_over) {
                setTimeout(() => setGameOver(true), 1200);
            } else {
                setTimeout(() => fetchNextQuestion(game.survival_game_id), 1000);
            }
        } catch (err) {
            console.error("Submission error:", err);
        }
    };

    const themeClass = theme === 'dark' ? 'dark-mode-active' : '';

    return (
        <div className={`survival-master-container ${themeClass}`} dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            <div className="game-inner-wrapper">
                
                {/* 1. START SCREEN & RANKINGS (Only show if NO game is active AND not in Game Over) */}
                {!game && !gameOver && (
                    <div className="start-screen-container">
                        <div className="hero-card">
                            <div className="survival-badge">SURVIVAL</div>
                            <h1 className="game-title">{lang === 'fa' ? 'چالش بقا' : 'Survival Challenge'}</h1>
                            <button className="start-game-btn" onClick={startGame} disabled={loading}>
                                {loading ? "..." : (lang === 'fa' ? "شروع بازی" : "Start Game")}
                            </button>
                        </div>

                        {/* RANKINGS SECTION */}
                        <div className="ranking-container">
                            <h3 className="rank-title">🏆 {lang === 'fa' ? 'برترین‌ها' : 'Leaderboard'}</h3>
                            <div className="rank-list">
                                {rankings.length > 0 ? rankings.map((r, idx) => (
                                    <div key={idx} className={`rank-item ${idx === 0 ? 'top-player' : ''}`}>
                                        <span className="rank-pos">#{idx + 1}</span>
                                        <span className="rank-user">{r.first_name || 'Player'}</span>
                                        <span className="rank-pts">{r.max_score}</span>
                                    </div>
                                )) : <p>No rankings yet</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. GAME OVER SCREEN */}
                {gameOver && (
                    <div className="hero-card game-over-state">
                        <div className="skull-icon">💀</div>
                        <h2>{lang === 'fa' ? 'بازی تمام شد' : 'GAME OVER'}</h2>
                        <div className="score-box">
                            <span>{lang === 'fa' ? 'امتیاز نهایی' : 'FINAL SCORE'}</span>
                            <strong>{game?.score || 0}</strong>
                        </div>
                        <div className="end-actions">
                            <button className="start-game-btn" onClick={startGame}>
                                {lang === 'fa' ? 'تلاش مجدد' : 'Try Again'}
                            </button>
                            <button className="btn-exit-menu" onClick={() => navigate('/dashboard')}>
                                {lang === 'fa' ? 'خروج' : 'Exit'}
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. ACTIVE GAMEPLAY */}
                {game && !gameOver && (
                    <div className="active-game-layout">
                        <div className="game-hud">
                            <div className="ui-pill">{strings.score}: {game.score}</div>
                            <div className={`timer-circle ${timeLeft < 5 ? 'critical' : ''}`}>{timeLeft}</div>
                            <div className="ui-pill">
                                {strings.lives}: {Array(game.lives).fill('❤️').map((h, i) => <span key={i}>{h}</span>)}
                            </div>
                        </div>

                        <div className="question-zone">
                            <h2 className="word-prompt">{currentQuestion?.prompt}</h2>
                            <div className="options-stack">
                                {currentQuestion?.options?.map(opt => (
                                    <button 
                                        key={opt.word_id}
                                        className={`game-opt-btn 
                                            ${selectedId === opt.word_id ? feedback : ''} 
                                            ${feedback && opt.text === correctAnswerText ? 'is-correct' : ''}
                                        `}
                                        onClick={() => handleAnswer(opt.word_id)}
                                        disabled={!!feedback}
                                    >
                                        {opt.text}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="game-footer">
                            <button className="btn-exit-menu" onClick={() => navigate('/dashboard')}>
                                {lang === 'fa' ? 'انصراف' : 'Abort'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Game;