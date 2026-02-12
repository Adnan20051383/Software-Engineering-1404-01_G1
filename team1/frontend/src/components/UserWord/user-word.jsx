import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { wordService } from '../../services/word-service';
import { userWordService } from '../../services/user-word-service';
import { SettingsContext } from '../../context/SettingsContext';
import './user-word.css';
import SERVER_URL from "../../config";

// --- Sub-Component: Flashcard (Double-Sided) ---
const Flashcard = ({ uw, onReview, onDelete, onUpdate, strings }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(uw.description || "");
  const [editImage, setEditImage] = useState(null);

  const handleFlip = () => {
    if (!isEditing) setIsFlipped(!isFlipped);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    const formData = new FormData();
    formData.append('description', editDesc);
    if (editImage) formData.append('image', editImage);

    await onUpdate(uw.user_word_id, formData);
    setIsEditing(false);
    setEditImage(null);
  };

  return (
    <div className={`flashcard-container ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
      <div className="flashcard-inner">
        {/* --- FACE 1: English, Image & Mnemonic --- */}
        <div className="card-face card-front">
          <button
            className="delete-mini-btn"
            onClick={(e) => { e.stopPropagation(); onDelete(uw.user_word_id); }}
          >
            ×
          </button>

          <div className="uw-card-header">
            <span>#{uw.user_word_id}</span>
            <span className={uw.is_due ? "due-badge" : "wait-badge"}>
              {uw.is_due ? (strings.ready || "READY") : (strings.wait || "WAIT")}
            </span>
          </div>

          <div className="uw-main-content">
            <h4 className="en-val">{uw.word?.english}</h4>
            {uw.image && !isEditing && (
              <div className="flashcard-image-container">
                <img src={`${SERVER_URL}${uw.image}`} alt="mnemonic" className="flashcard-img" />
              </div>
            )}
          </div>

          {/* Mnemonic Section */}
          <div className="mnemonic-section" onClick={(e) => e.stopPropagation()}>
            <button className="mnemonic-toggle-btn" onClick={() => setShowMnemonic(!showMnemonic)}>
              {strings.mnemonic_label || "Mnemonic"} {showMnemonic ? '▲' : '▼'}
            </button>

            {showMnemonic && (
              <div className="mnemonic-content">
                {isEditing ? (
                  <div className="edit-mode-container">
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditImage(e.target.files[0])}
                      className="file-input-mini"
                    />
                    <button className="save-btn" onClick={handleSave}>
                      {strings.save || "Save"}
                    </button>
                  </div>
                ) : (
                  <div className="desc-display">
                    <p>{uw.description || "..."}</p>
                    <button className="edit-icon-btn" onClick={() => setIsEditing(true)}>✏️</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <small className="flip-hint">{strings.click_to_flip || "Click to flip ↻"}</small>
        </div>

        {/* --- FACE 2: Persian & Review Actions --- */}
        <div className="card-face card-back">
          <div className="uw-main-content">
            <p className="fa-val">{uw.word?.persian}</p>
          </div>

          <div className="review-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="btn-forgot"
              onClick={() => onReview(uw.user_word_id, false)}
              disabled={!uw.is_due}
            >
              {strings.forgot} ❌
            </button>
            <button
              className="btn-remember"
              onClick={() => onReview(uw.user_word_id, true)}
              disabled={!uw.is_due}
            >
              {strings.remembered} ✅
            </button>
          </div>

          {!uw.is_due && (
            <p className="reason-text-mini">{strings.not_due_msg}</p>
          )}

          <small className="flip-hint">{strings.click_to_flip_back || "Click to flip ↺"}</small>
        </div>
      </div>
    </div>
  );
};

// --- Main Manager Component ---
const UserWordManager = () => {
  const { strings, lang } = useContext(SettingsContext);
  const fileInputRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [wordId, setWordId] = useState('');
  const [selectedEnglish, setSelectedEnglish] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [myWords, setMyWords] = useState([]);
  const [selectedBox, setSelectedBox] = useState('new');
  const [isFetchingBox, setIsFetchingBox] = useState(false);
  const [isExact, setIsExact] = useState(false);

  const isStartBox = selectedBox === 'new';

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

  useEffect(() => {
    fetchMyWords();
  }, [fetchMyWords]);

  // ✅ Only search when Start Box is active
  useEffect(() => {
    if (!isStartBox) {
      setSearchTerm('');
      setSearchResults([]);
      setIsSearching(false);
      setIsExact(false);
      setWordId('');
      setSelectedEnglish('');
      setDescription('');
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true);
        try {
          const data = await wordService.getAllWords(searchTerm, 1, isExact);
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
  }, [searchTerm, isExact, isStartBox]);

  const getBoxLabel = (boxKey) => {
    const mapping = {
      new: strings.box_new,
      '1day': strings.box_1day,
      '3days': strings.box_3days,
      '7days': strings.box_7days,
      mastered: strings.box_mastered
    };
    return mapping[boxKey] || boxKey;
  };

  // --- Actions ---
  const handleUpdateUserWord = async (userWordId, formData) => {
    try {
      await userWordService.updateUserWord(userWordId, formData);
      await fetchMyWords();
    } catch (err) {
      console.error("Update Error:", err);
    }
  };

  const handleCreateUserWord = async () => {
    if (!wordId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('word_id', wordId);
      formData.append('description', description);
      if (imageFile) formData.append('image', imageFile);

      await userWordService.createUserWord(formData);

      setWordId('');
      setSelectedEnglish('');
      setDescription('');
      setSearchTerm('');
      setImageFile(null);
      setSearchResults([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

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
      const formData = new FormData();
      formData.append('move_to_next_box', remembered);
      formData.append('reset_to_day_1', !remembered);

      await userWordService.updateUserWord(userWordId, formData);
      await fetchMyWords();
    } catch (err) {
      console.error("Review Error:", err);
    }
  };

  const handleDelete = async (userWordId) => {
    if (!window.confirm(strings.confirm_delete || "Are you sure?")) return;
    try {
      await userWordService.deleteUserWord(userWordId);
      await fetchMyWords();
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  return (
    <div className="leitner-page" dir={lang === 'fa' ? 'rtl' : 'ltr'}>
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

      {/* ✅ SHOW ONLY WHEN Start Box is selected */}
      {isStartBox && (
        <div className="top-layout">
          <div className="section-container browse-section">
            <h3 className="section-title">{strings.search_title}</h3>

            <div className="search-controls">
              <input
                className="search-bar"
                type="text"
                placeholder={strings.search_placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <label className="exact-search-label">
                <input
                  type="checkbox"
                  checked={isExact}
                  onChange={(e) => setIsExact(e.target.checked)}
                />
                {strings.exact_search || "Exact Search"}
              </label>
            </div>

            <div className="results-list">
              {isSearching ? (
                <p className="status-msg">...</p>
              ) : (
                searchResults.map((word) => (
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
                ))
              )}
            </div>
          </div>

          <div className="section-container form-section">
            <h3 className="section-title">{strings.add_title}</h3>

            <div className="form-group">
              <label>{strings.selected_word}</label>
              <div className="active-word-display">{selectedEnglish || "---"}</div>
            </div>

            <div className="form-group">
              <label htmlFor="mnemonic">{strings.mnemonic_label}</label>
              <textarea
                id="mnemonic"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>{strings.flashcardImage}</label>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={(e) => setImageFile(e.target.files[0])}
                className="file-input-main"
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
      )}

      <div className="section-container box-section">
        <div className="box-header">
          <h3>
            {strings.current_box}:{' '}
            <span className="current-box-name">{getBoxLabel(selectedBox)}</span>
          </h3>

          <button className="refresh-btn" onClick={fetchMyWords}>
            🔄 {strings.sync}
          </button>
        </div>

        <div className="my-words-grid">
          {isFetchingBox ? (
            <div className="status-msg">...</div>
          ) : (
            myWords.map((uw) => (
              <Flashcard
                key={uw.user_word_id}
                uw={uw}
                strings={strings}
                onReview={handleReview}
                onDelete={handleDelete}
                onUpdate={handleUpdateUserWord}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserWordManager;
