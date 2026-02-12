import React, { useState, useEffect, useContext, useRef } from 'react';
import { quizService } from '../../services/quiz-service';
import { SettingsContext } from '../../context/SettingsContext';
import './Quiz.css';
import { messageService } from "../../services/message-service";

const Quiz = () => {
    const { strings, lang } = useContext(SettingsContext);

    const [phase, setPhase] = useState('selection');
    const [loading, setLoading] = useState(false);

    const [activeQuiz, setActiveQuiz] = useState(null);
    const [question, setQuestion] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const [result, setResult] = useState(null);
    const [correctAnswerText, setCorrectAnswerText] = useState("");

    const [progress, setProgress] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [finalScore, setFinalScore] = useState(0);

    const [timeLeft, setTimeLeft] = useState(15);
    const timerRef = useRef(null);

    // FIX: Start timer immediately when a new question is set
    useEffect(() => {
        if (phase === 'active' && question && !result) {
            startTimer();
        }
        return () => clearInterval(timerRef.current);
    }, [question, phase]);

    const startTimer = () => {
        setTimeLeft(15);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // UPDATE: Now accepts 'count' to ensure the backend knows exactly how many questions to generate
    const handleStartQuiz = async (type, count) => {
      setLoading(true)
      setCorrectCount(0)
      setFinalScore(0)
      setProgress(0)

      try {
        // Pass 'count' (e.g., 15) to the service
        const newQuiz = await quizService.createQuiz(0, type, count)
        setActiveQuiz(newQuiz)
        setPhase("active")
        messageService.success(strings.quiz_started);
        await fetchNextQuestion(newQuiz.quiz_id, 0)
      } catch (err) {
        messageService.error(err?.message || strings.error_generic);
      } finally {
        setLoading(false)
      }
    }

   const fetchNextQuestion = async (id, currentCorrects) => {
      setResult(null)
      setSelectedId(null)
      setCorrectAnswerText("")

      try {
        const data = await quizService.getQuizQuestions(id, 1)

        if (data.finished) {
          // Use the actual total from the backend, or fallback to the count of the last question seen
          const total = data.total_questions || question?.total_questions || 15
          const scorePercentage = Math.round((currentCorrects / total) * 100)
          setFinalScore(scorePercentage)
          messageService.info(strings.quiz_finished);
          setPhase("results")
          return
        }

        setQuestion(data)
        // Calculate progress based on total_questions returned by backend
        const total = data.total_questions || 15
        setProgress(((data.current_number - 1) / total) * 100)
      } catch (err) {
        messageService.error(err?.message || strings.quiz_failed_load_question);        setPhase("results")
      }
    }


    const handleAnswer = async (wordId) => {
      if (result) return
      clearInterval(timerRef.current)
      setSelectedId(wordId)

      try {
        const res = await quizService.submitAnswers(activeQuiz.quiz_id, wordId)
        let updatedCount = correctCount

        if (res.is_correct) {
          setResult("correct")
          updatedCount = correctCount + 1
          setCorrectCount(updatedCount)
        } else {
          setResult("wrong")
          setCorrectAnswerText(res.correct_answer_text)
        }

        setTimeout(() => fetchNextQuestion(activeQuiz.quiz_id, updatedCount), 1500)
      } catch (err) {
        messageService.error(err?.message || strings.quiz_failed_load_question);
      }
    }


    const handleAutoSubmit = () => {
        if (question?.question?.options?.length > 0) {
            handleAnswer(question.question.options[0].word_id);
        }
    };

    const handleLeave = () => {
        if (window.confirm(strings.exit_quiz_confirm)) {
            clearInterval(timerRef.current);
            setPhase('selection');
            setActiveQuiz(null);
        }
    };

    // --- RENDERING ---

    if (phase === 'selection') {
        return (
            <div className="quiz-wrapper" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                <header className="quiz-header-main">
                    <h1>{strings.quiz_categories}</h1>
                </header>
                <div className="quiz-cards-container">
                    {[
                        { id: 1, label: strings.daily, color: '#3182ce', count: 5 },
                        { id: 2, label: strings.weekly, color: '#805ad5', count: 10 },
                        { id: 3, label: strings.monthly, color: '#38a169', count: 15 } // 15 Questions
                    ].map(item => (
                        <button
                            key={item.id}
                            className="mode-card"
                            // UPDATE: Pass item.count (15) to the handler
                            onClick={() => handleStartQuiz(item.id, item.count)}
                        >
                            <div className="mode-icon" style={{backgroundColor: item.color}}>{item.count}</div>
                            <h3>{item.label}</h3>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    if (phase === 'active' && question) {
        return (
            <div className="quiz-wrapper" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                <div className="stats-top-bar">
                   <div className="stat-pill correct">
                       <span>{strings.correct_label}:</span>
                       <strong>{correctCount}</strong>
                   </div>
                   <div className="progress-mini-text">
                        {question.current_number} / {question.total_questions}
                   </div>
                </div>

                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="quiz-top-nav">
                    <button className="quiz-exit-btn" onClick={handleLeave}>
                        {strings.leave}
                    </button>
                    <div className="quiz-timer-box"
                         style={{borderColor: timeLeft < 5 ? 'var(--color-wrong)' : 'var(--color-daily)'}}>
                        <span>{timeLeft}</span>
                    </div>
                </div>

                <div className="question-card-main">
                    <h2 className="display-word">{question.question.prompt}</h2>
                    <div className="options-list">
                        {question.question.options.map(opt => (
                            <button
                                key={opt.word_id}
                                className={`option-btn ${selectedId === opt.word_id ? result : ''} ${result && opt.text === correctAnswerText ? 'correct-hint' : ''}`}
                                onClick={() => handleAnswer(opt.word_id)}
                                disabled={!!result}
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'results') {
        return (
            <div className="quiz-wrapper" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
                <div className="quiz-result-card">
                    <div className="result-check">🏁</div>
                    <h2>{strings.quiz_result_title}</h2>
                    <div className="final-score-box">
                        <label>{strings.score}</label>
                        <strong>{finalScore}%</strong>
                        <p>
                          {correctCount} / {question?.total_questions || correctCount} {strings.correct_answers}
                        </p></div>
                    <button className="quiz-restart-btn" onClick={() => setPhase('selection')}>
                        {strings.back}
                    </button>
                </div>
            </div>
        );
    }
};

export default Quiz;