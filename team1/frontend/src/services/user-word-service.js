import BASE_URL from '../config';

export const userWordService = {
  // Create a new UserWord
  createUserWord: async (wordId, description, imageUrl = null) => {
    const response = await fetch(`${BASE_URL}/userwords/`, {
      method: 'POST',
      body: JSON.stringify({
        word_id: wordId,
        description,
        image_url: imageUrl
      }),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Edit a UserWord (Add Mnemonics and change its Leitner box)
  editUserWord: async (userWordId, description, imageUrl, moveToNextBox = false, resetToDay1 = false) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/edit/`, {
      method: "PATCH",
      body: JSON.stringify({ description, image_url: imageUrl, move_to_next_box: moveToNextBox, reset_to_day_1: resetToDay1 }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include", // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get UserWord by ID
  getUserWordById: async (userWordId) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "include", // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Delete a UserWord by its ID
  deleteUserWord: async (userWordId) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/delete/`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Search UserWords by word or description
  searchUserWords: async (searchTerm) => {
    const response = await fetch(`${BASE_URL}/userwords/search/?search=${searchTerm}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get UserWords by Leitner box type (NEW, 1_day, etc.)
  getUserWordsByLeitner: async (leitnerType) => {
    const response = await fetch(`${BASE_URL}/userwords/leitner/${leitnerType}/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },
};
