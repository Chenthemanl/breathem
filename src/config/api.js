// src/config/api.js

// Get the API URL from environment variables, fallback to localhost for development
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Utility function to handle all API requests
export const fetchFromAPI = async (endpoint, options = {}) => {
  try {
    // Construct the full URL by combining the base API URL with the endpoint
    const url = `${API_URL}${endpoint}`;
    
    // Merge default headers with any custom headers
    const headers = {
      ...options.headers,
      'Access-Control-Allow-Origin': '*',
    };

    // Make the API request
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if the response was successful
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    // Parse and return the JSON response
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Convenience functions for common API operations
export const api = {
  // List all known faces
  listKnownFaces: () => 
    fetchFromAPI('/list-known-faces'),

  // Add a new reference face
  addKnownFace: (name, files) => {
    const formData = new FormData();
    formData.append('name', name);
    files.forEach(file => formData.append('files', file));

    return fetchFromAPI('/add-known-face', {
      method: 'POST',
      body: formData,
    });
  },

  // Analyze a face
  analyzeFace: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return fetchFromAPI('/analyze-face', {
      method: 'POST',
      body: formData,
    });
  }
};