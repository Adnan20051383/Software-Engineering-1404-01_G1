import React, { useState } from 'react';
import { quizService } from '../../services/quiz-service';

const CreateQuiz = () => {
    const [score, setScore] = useState('');
    const [quizType, setQuizType] = useState(1); // Default: Daily quiz

    const handleCreate = async () => {
        try {
            const data = await quizService.createQuiz(score, quizType);
            console.log('Quiz created:', data);
        } catch (error) {
            console.error('Error creating quiz:', error);
        }
    };
// await quizService.submitAnswers(quizId, [
//   { word_id: question.word_id, selected_word_id: chosenOption.word_id },
//   ...
// ])
    return (
        <div>
            <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter score"
            />
            <select
                value={quizType}
                onChange={(e) => setQuizType(parseInt(e.target.value))}
            >
                <option value={1}>Daily</option>
                <option value={2}>Weekly</option>
                <option value={3}>Monthly</option>
            </select>
            <button onClick={handleCreate}>Create Quiz</button>
        </div>
    );
};

export default CreateQuiz;
