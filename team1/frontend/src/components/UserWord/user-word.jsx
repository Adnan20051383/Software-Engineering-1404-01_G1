import React, { useState } from 'react';
import { userWordService } from '../../services/user-word-service';

const CreateUserWord = () => {
    const [wordId, setWordId] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
// برای انتقال به جعبه بعد
// await userWordService.editUserWord(userWordId, "New description", "new-image-url.jpg", true, false);

// برای برگشت به جعبه `1_day`
// await userWordService.editUserWord(userWordId, "New description", "new-image-url.jpg", false, true);
    const handleCreate = async () => {
        try {
            const data = await userWordService.createUserWord(wordId, description, imageUrl);
            console.log('UserWord created:', data);
        } catch (error) {
            console.error('Error creating UserWord:', error);
        }
    };

    return (
        <div>
            <input
                type="text"
                value={wordId}
                onChange={(e) => setWordId(e.target.value)}
                placeholder="Enter Word ID"
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
            />
            <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter Image URL"
            />
            <button onClick={handleCreate}>Create UserWord</button>
        </div>
    );
};

export default CreateUserWord;
