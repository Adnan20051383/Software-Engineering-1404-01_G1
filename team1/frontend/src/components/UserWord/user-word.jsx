import React, { useState, useEffect, useCallback, useContext } from 'react';
import { wordService } from '../../services/word-service';
import { userWordService } from '../../services/user-word-service';
import { SettingsContext } from '../../context/SettingsContext';
import './user-word.css';

const UserWordManager = () => {
    // --- Context & State Management ---
    const { strings, lang } = useContext(SettingsContext);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    
    // Selection state for adding new words
    const [wordId, setWordId] = useState('');
    const [selectedEnglish, setSelectedEnglish] = useState(''); 

    // Form inputs
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Grid state for Leitner boxes
    const [myWords, setMyWords] = useState([]);
    const [selectedBox, setSelectedBox] = useState('new'); 
    const [isFetchingBox, setIsFetchingBox] = useState(false);

    // --- Data Fetching ---

    const fetchMyWords = useCallback(async () => {
        setIsFetchingBox(true);
        try {
            const data = await userWordService.getUserWordsByLeitner(selectedBox);
            setMyWords(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Fetch Box Error:", err);
        } finally {
            setIsFetchingBox(false);
        }
    }, [selectedBox]);

    // Search Logic with Debounce
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim()) {
                setIsSearching(true);
                try {
                    const data = await wordService.getAllWords(searchTerm);
                    setSearchResults(data.results || data || []); 
                } catch (err) {
                    console.error("Search Error:", err);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    useEffect(() => {
        fetchMyWords();
    }, [fetchMyWords]);

    // --- Helper for Box Labels ---
    const getBoxLabel = (boxKey) => {
        const mapping = {
            'new': strings.box_new,
            '1day': strings.box_1day,
            '3days': strings.box_3days,
            '7days': strings.box_7days,
            'mastered': strings.box_mastered
        };
        return mapping[boxKey] || boxKey;
    };

    // --- Actions ---

    const handleCreateUserWord = async () => {
        if (!wordId) return;
        setLoading(true);
        try {
            await userWordService.createUserWord(wordId, description);
            // Reset form
            setWordId(''); 
            setSelectedEnglish(''); 
            setDescription(''); 
            setSearchTerm('');
            setSelectedBox('new');
            await fetchMyWords(); 
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (userWordId, remembered) => {
        try {
            const currentWord = myWords.find(w => w.user_word_id === userWordId);
            await userWordService.updateUserWord(userWordId, {
                description: currentWord?.description || "",
                move_to_next_box: remembered,
                reset_to_day_1: !remembered
            });
            await fetchMyWords(); 
        } catch (err) {
            console.error("Review Error:", err);
        }
    };

    const handleDelete = async (userWordId) => {
        if (!window.confirm("?")) return;
        try {
            await userWordService.deleteUserWord(userWordId);
            await fetchMyWords();
        } catch (err) {
            console.error("Delete Error:", err);
        }
    };

    return (
        <div className="leitner-page" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
            {/* Box Tabs Summary */}
            <div className="progress-summary">
                {['new', '1day', '3days', '7days', 'mastered'].map((box) => (
                    <div 
                        key={box}
                        className={`summary-card ${selectedBox === box ? 'active' : ''}`} 
                        onClick={() => setSelectedBox(box)}
                    >
                        <span>{box === 'new' ? strings.box_new : strings.leitner}</span>
                        <strong>{getBoxLabel(box)}</strong>
                    </div>
                ))}
            </div>

            <div className="top-layout">
                {/* 1. Dictionary Search */}
                <div className="section-container browse-section">
                    <h3 className="section-title">{strings.search_title}</h3>
                    <input
                        className="search-bar"
                        type="text"
                        placeholder="..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <div className="results-list">
                        {isSearching ? <p className="status-msg">...</p> : 
                        searchResults.map(word => (
                            <div 
                                key={word.id} 
                                className={`word-card ${wordId === word.id ? 'selected' : ''}`} 
                                onClick={() => { 
                                    setWordId(word.id); 
                                    setSelectedEnglish(word.english); 
                                }}
                            >
                                <span className="en-text">{word.english}</span>
                                <span className="fa-text">{word.persian}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Add Form */}
                <div className="section-container form-section">
                    <h3 className="section-title">{strings.add_title}</h3>
                    <div className="form-group">
                        <label>{strings.selected_word}</label>
                        <div className="active-word-display">
                            {selectedEnglish || "---"}
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="mnemonic">{strings.mnemonic_label}</label>
                        <textarea 
                            id="mnemonic"
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="submit-btn" 
                        onClick={handleCreateUserWord} 
                        disabled={loading || !wordId}
                    >
                        {loading ? "..." : strings.add_button}
                    </button>
                </div>
            </div>

            {/* 3. Word List Grid */}
            <div className="section-container box-section">
                <div className="box-header">
                    <h3>{strings.current_box}: <span className="current-box-name">{getBoxLabel(selectedBox)}</span></h3>
                    <button className="refresh-btn" onClick={fetchMyWords}>🔄 {strings.sync}</button>
                </div>

                <div className="my-words-grid">
                    {isFetchingBox ? <div className="status-msg">...</div> : 
                    myWords.map(uw => (
                        <div key={uw.user_word_id} className="user-word-item">
                            <button className="delete-mini-btn" onClick={() => handleDelete(uw.user_word_id)}>×</button>
                            
                            <div className="uw-card-header">
                                <span>#{uw.user_word_id}</span>
                                <span className={uw.is_due ? "due-badge" : "wait-badge"}>
                                    {uw.is_due ? "READY" : "WAIT"}
                                </span>
                            </div>

                            <div className="uw-main-content">
                                <h4 className="en-val">{uw.word?.english}</h4>
                                <p className="fa-val">{uw.word?.persian}</p>
                            </div>

                            {!uw.is_due && (
                                <div className="lock-explanation">
                                    <p className="status-text">
                                        {strings.last_check}: <strong>{uw.last_check_date || "Never"}</strong>
                                    </p>
                                    <p className="reason-text">{strings.not_due_msg}</p>
                                </div>
                            )}

                            <div className="uw-note-area">
                                <p>{uw.description || "..."}</p>
                            </div>

                            <div className="review-actions">
                                <button 
                                    className="btn-forgot" 
                                    onClick={() => handleReview(uw.user_word_id, false)}
                                    disabled={!uw.is_due}
                                >
                                    {strings.forgot} ❌
                                </button>
                                <button 
                                    className="btn-remember" 
                                    onClick={() => handleReview(uw.user_word_id, true)}
                                    disabled={!uw.is_due}
                                >
                                    {strings.remembered} ✅
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserWordManager;