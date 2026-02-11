import {BASE_URL} from '../config';
import {getCookie} from "../utils/csrf";

// 1. Improved Error Handling to tell us EXACTLY what the server says
const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    
    // 1. Read the body as text ONCE
    const rawBody = await response.text();
    
    try {
      // 2. Try to parse it as JSON if possible
      const errorData = JSON.parse(rawBody);
      errorMessage = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      // 3. If it's not JSON (like a Django 500 HTML page), search the text
      if (rawBody.includes("AssertionError")) errorMessage = "Backend Date Error (AssertionError)";
      else if (response.status === 405) errorMessage = "405: Method Not Allowed";
      else if (rawBody.includes("FieldError")) errorMessage = "Backend FieldError: Check id vs user_word_id";
      else errorMessage = `Server Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) return { success: true };
  
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
};



export const userWordService = {
  // CREATE
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
        'Accept': 'application/json',
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include',
    });
    return await handleResponse(response);
  },

  // UPDATE (Review Logic)
  updateUserWord: async (userWordId, data) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/edit/`, {
      method: "PATCH",
      body: JSON.stringify({ 
        description: data.description, 
        image_url: data.image_url, 
        move_to_next_box: data.move_to_next_box, 
        reset_to_day_1: data.reset_to_day_1 
      }),
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: "include",
    });
    return await handleResponse(response);
  },

  // DELETE
  deleteUserWord: async (userWordId) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/delete/`, {
      method: 'DELETE',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include',
    });
    return await handleResponse(response);
  },

  // GET BOX CONTENTS
  getUserWordsByLeitner: async (leitnerType) => {
    const response = await fetch(`${BASE_URL}/userwords/leitner/${leitnerType}/`, {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: 'include',
    });
    return await handleResponse(response);
  },
  
  // GET BY ID
  getUserWordById: async (userWordId) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/`, {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      credentials: "include",
    });
    return await handleResponse(response);
  },

  // SEARCH
  searchUserWords: async (searchTerm) => {
    const response = await fetch(`${BASE_URL}/userwords/search/?search=${searchTerm}`, {
      method: 'GET',
      headers: { 
        "Content-Type": "application/json", 
        "Accept": "application/json" 
      },
      credentials: 'include',
    });
    return await handleResponse(response);
  },
};