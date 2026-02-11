import {BASE_URL} from '../config';
import {getCookie} from "../utils/csrf";

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    const rawBody = await response.text();
    try {
      const errorData = JSON.parse(rawBody);
      errorMessage = errorData.detail || JSON.stringify(errorData);
    } catch (e) {
      errorMessage = `Server Error: ${response.status}`;
    }
    throw new Error(errorMessage);
  }
  if (response.status === 204) return { success: true };
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
};

export const userWordService = {
  // CREATE - Now accepts the formData object directly
  createUserWord: async (formData) => {
    const response = await fetch(`${BASE_URL}/userwords/`, {
      method: 'POST',
      body: formData, // Send formData directly, NO JSON.stringify
      headers: {
        // IMPORTANT: Do NOT set 'Content-Type' here.
        // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
        'Accept': 'application/json',
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: 'include',
    });
    return await handleResponse(response);
  },

  // UPDATE - Now accepts the formData object directly
  updateUserWord: async (userWordId, formData) => {
    const response = await fetch(`${BASE_URL}/userwords/${userWordId}/edit/`, {
      method: "PATCH",
      body: formData, // Send formData directly
      headers: {
        // IMPORTANT: Do NOT set 'Content-Type' here.
        "Accept": "application/json",
        "X-CSRFToken": getCookie('csrftoken'),
      },
      credentials: "include",
    });
    return await handleResponse(response);
  },

  // DELETE - Stays the same as it doesn't use files
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