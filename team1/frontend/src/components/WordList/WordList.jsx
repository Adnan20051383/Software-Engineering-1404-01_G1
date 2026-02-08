import React, { useEffect, useState } from 'react';
import { wordService } from '../../services/word-service';
import './WordList.css';

const WordList = () => {
    const [words, setWords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');  // State to manage search query
    const [page, setPage] = useState(1);  // State for pagination
    const [totalPages, setTotalPages] = useState(1);  // To manage total pages from pagination

    useEffect(() => {
        // Fetch words based on search query and page
        wordService.getAllWords(search, page)
            .then(data => {
                setWords(data.results);
                setTotalPages(data.total_pages);  // Assuming the response includes total pages
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, [search, page]);  // Re-fetch when search or page changes

    const handleSearchChange = (event) => {
        setSearch(event.target.value);
        setPage(1);  // Reset to first page when search term changes
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="word-container">
            <h1>Vocabulary List</h1>

            {/* Search bar */}
            <input
                type="text"
                value={search}
                onChange={handleSearchChange}
                placeholder="Search for a word (English or Persian)"
            />

            <ul className="word-grid">
                {words.map(word => (
                    <li key={word.id} className="word-card">
                        <strong>{word.english}</strong>
                        <span>{word.persian}</span>
                        <small>{word.category?.name}</small>
                    </li>
                ))}
            </ul>

            {/* Pagination Controls */}
            <div className="pagination">
                <button onClick={() => handlePageChange(page - 1)} disabled={page <= 1}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>Next</button>
            </div>
        </div>
    );
};

export default WordList;
