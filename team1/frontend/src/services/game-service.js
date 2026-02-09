import {BASE_URL} from "../config";
import {getCookie} from "../utils/csrf";

export const survivalGameService = {
  // Create a new Survival Game
  createSurvivalGame: async (score, lives) => {
    const response = await fetch(`${BASE_URL}/survival_games/create/`, {
      method: "POST",
      body: JSON.stringify({ score, lives }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get all survival games for the user
  getUserSurvivalGames: async () => {
    const response = await fetch(`${BASE_URL}/survival_games/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get a specific survival game by gameId
  getSurvivalGameById: async (gameId) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Update the survival game (score, lives)
  updateSurvivalGame: async (gameId, score, lives) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/`, {
      method: "PATCH",
      body: JSON.stringify({ score, lives }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get questions for the survival game
  getGameQuestions: async (gameId, count = 1) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/questions/?count=${count}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Submit answers for the survival game
  submitGameAnswers: async (gameId, answers) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/answers/`, {
      method: "POST",
      body: JSON.stringify({ answers }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Delete a survival game by gameId
  deleteSurvivalGame: async (gameId) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get top rankings for survival games
  getTopSurvivalGameRanking: async () => {
    const response = await fetch(`${BASE_URL}/survival_games/ranking/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get user's ranking in survival games
  getUserSurvivalGameRanking: async () => {
    const response = await fetch(`${BASE_URL}/survival_games/ranking/user/`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },


  getNextQuestion: async (gameId) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/questions/`, {
      headers: { "Accept": "application/json" },
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Could not fetch question");
    return await response.json();
  },

  // Submit only one answer
  submitSingleAnswer: async (gameId, selectedWordId) => {
    const response = await fetch(`${BASE_URL}/survival_games/${gameId}/answers/`, {
      method: "POST",
      body: JSON.stringify({ selected_word_id: selectedWordId }),
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error("Failed to submit answer");
    return await response.json();
  },
};
