import {BASE_URL} from "../config";
import {getCookie} from "../utils/csrf";

const readError = async (response) => {
  let data = null
  try {
    data = await response.json()
  } catch (e) {}

  const msg =
    data?.detail ||
    data?.message ||
    (typeof data === "string" ? data : null) ||
    `Request failed (${response.status})`

  return new Error(msg)
}


export const quizService = {
  // Create a new Quiz
  createQuiz: async (score, type) => {
    const response = await fetch(`${BASE_URL}/quizzes/create/`, {
      method: "POST",
      body: JSON.stringify({ score, type }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: "include", // important if you use session / cookies
    });
    if (!response.ok) throw await readError(response)
    return await response.json();
  },

  // Get all quizzes for the user with optional date filters
  getUserQuizzes: async (startDate = null, endDate = null) => {
    let url = `${BASE_URL}/quizzes/`;
    if (startDate || endDate) {
      url += `?start_date=${startDate || ""}&end_date=${endDate || ""}`;
    }
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw new Error("Network response was not ok");
    return await response.json();
  },

  // Get quiz questions by quizId
  getQuizQuestions: async (quizId, count = 10) => {
    const response = await fetch(`${BASE_URL}/quizzes/${quizId}/questions/?count=${count}`, {
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw await readError(response)
    return await response.json();
  },

  // Submit answers for a quiz
  submitAnswers: async (quizId, selectedWordId) => { // Change parameter to selectedWordId
    const response = await fetch(`${BASE_URL}/quizzes/${quizId}/answers/`, {
      method: "POST",
      body: JSON.stringify({ selected_word_id: selectedWordId }), // Send the ID directly
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include',
    });
    if (!response.ok) throw await readError(response)
    return await response.json()
  },


  // Delete a quiz by its ID
  deleteQuiz: async (quizId) => {
    const response = await fetch(`${BASE_URL}/quizzes/${quizId}/`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw await readError(response)
    return await response.json();
  },
   // Update quiz score and correct answer count
  updateQuiz: async (quizId, score, correctCount) => {
    const response = await fetch(`${BASE_URL}/quizzes/${quizId}/`, {
      method: "PATCH",
      body: JSON.stringify({ score, correct_count: correctCount }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include', // important if you use session / cookies
    });
    if (!response.ok) throw await readError(response)
    return await response.json();
  },

};
