import React, { useState } from 'react';
import { survivalGameService } from '../../services/game-service';

const CreateSurvivalGame = () => {
    const [score, setScore] = useState('');
    const [lives, setLives] = useState(3); // Default 3 lives

    const handleCreate = async () => {
        try {
            const data = await survivalGameService.createSurvivalGame(score, lives);
            console.log('Game created:', data);
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    return (
        <div>
            <input
                type="number"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter score"
            />
            <input
                type="number"
                value={lives}
                onChange={(e) => setLives(e.target.value)}
                placeholder="Enter number of lives"
            />
            <button onClick={handleCreate}>Create Game</button>
        </div>
    );
};

export default CreateSurvivalGame;
