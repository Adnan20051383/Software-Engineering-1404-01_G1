import React, { useEffect, useState } from 'react';
import { wordService } from '../../services/apiService';
import './WordList.css';

const WordList = () => {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        wordService.getAllWords()
            .then(data => {
                setWords(data.results); // DRF pagination puts data in 'results'
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="word-container">
            <h1>Vocabulary List</h1>
            <ul className="word-grid">
                {words.map(word => (
                    <li key={word.id} className="word-card">
                        <strong>{word.english}</strong>
                        <span>{word.persian}</span>
                        <small>{word.category}</small>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WordList;