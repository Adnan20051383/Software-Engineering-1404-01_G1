import React, { useState } from 'react';
import { quizService } from './services/quiz-service';

const QuizTester = () => {
    const [quiz, setQuiz] = useState(null);
    const [question, setQuestion] = useState(null);
    const [result, setResult] = useState(null); // 'correct' | 'wrong' | null
    const [correctAnswerText, setCorrectAnswerText] = useState("");
    const [isFinished, setIsFinished] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    const startQuiz = async (type) => {
        try {
            const newQuiz = await quizService.createQuiz(0, type);
            setQuiz(newQuiz);
            fetchNextQuestion(newQuiz.quiz_id);
        } catch (err) {
            alert(err.message);
        }
    };

    const fetchNextQuestion = async (id) => {
        setResult(null);
        setSelectedId(null);
        setCorrectAnswerText("");
        try {
            const data = await quizService.getQuizQuestions(id, 1);
            if (data.finished) {
                setIsFinished(true);
            } else {
                setQuestion(data);
            }
        } catch (err) {
            setIsFinished(true);
        }
    };

    const handleAnswer = async (wordId) => {
        setSelectedId(wordId);
        try {
            const res = await quizService.submitAnswers(quiz.quiz_id, wordId);

            if (res.is_correct) {
                setResult("correct");
            } else {
                setResult("wrong");
                setCorrectAnswerText(res.correct_answer_text);
            }

            setTimeout(() => fetchNextQuestion(quiz.quiz_id), 2000);
        } catch (err) {
            alert("خطا در ثبت پاسخ: " + err.message);
        }
    };

    if (isFinished) return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h1>Quiz Complete! 🏁</h1>
            <p>Your Final Score: {quiz?.score}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
    );

    if (!quiz) return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Select Quiz Type</h2>
            <button onClick={() => startQuiz(1)}>Daily (5 Qs)</button>
            <button onClick={() => startQuiz(2)}>Weekly (10 Qs)</button>
            <button onClick={() => startQuiz(3)}>Monthly (15 Qs)</button>
        </div>
    );

    return (
        <div style={{
            border: '2px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            maxWidth: '400px',
            margin: '50px auto',
            fontFamily: 'sans-serif'
        }}>
            <p style={{ color: '#666' }}>Question {question?.current_number} / {question?.total_questions}</p>
            <h2 style={{ textAlign: 'center' }}>{question?.question.prompt}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {question?.question.options.map(opt => {
                    // منطق رنگی کردن دکمه‌ها
                    let bgColor = '#f0f0f0';
                    if (result && opt.word_id === selectedId) {
                        bgColor = result === 'correct' ? '#d4edda' : '#f8d7da';
                    }

                    return (
                        <button
                            key={opt.word_id}
                            onClick={() => handleAnswer(opt.word_id)}
                            disabled={!!result}
                            style={{
                                padding: '12px',
                                cursor: !!result ? 'not-allowed' : 'pointer',
                                backgroundColor: bgColor,
                                border: '1px solid #ccc',
                                borderRadius: '5px',
                                fontSize: '16px',
                                transition: '0.3s'
                            }}
                        >
                            {opt.text}
                        </button>
                    );
                })}
            </div>

            {result && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    {result === "correct" ? (
                        <h2 style={{ color: 'green' }}>CORRECT! 🎉</h2>
                    ) : (
                        <div>
                            <h2 style={{ color: 'red' }}>WRONG! 😢</h2>
                            <p style={{ fontWeight: 'bold' }}>
                                Correct Answer: <span style={{ color: 'green' }}>{correctAnswerText}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizTester;