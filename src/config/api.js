// api.js
const API_BASE_URL = 'https://happy-face-recognition.onrender.com';

/**
 * Helper function to handle API responses and errors consistently
 * @param {Response} response - The fetch response object
 * @returns {Promise} - Resolves with the response data or rejects with an error
 */
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    // If the server sent an error message, use it, otherwise use the status text
    const errorMessage = (isJson && data.detail) ? data.detail : response.statusText;
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
  }

  return data;
};

/**
 * API class to handle all server communications
 */
export const api = {
  /**
   * Add a new known face to the system
   * @param {File} file - The image file containing the face
   * @param {string} name - The name of the person
   * @returns {Promise} - Resolves with the server response
   */
  async addKnownFace(file, name) {
    try {
      if (!file || !name) {
        throw new Error('Both file and name are required');
      }
  
      // Create and verify form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
  
      // Log the request details
      console.log('Sending request to add known face:', {
        name,
        fileSize: file.size,
        fileType: file.type
      });
  
      // Make the request with proper headers
      const response = await fetch(`${API_BASE_URL}/add-known-face`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
  
      // Log the response status
      console.log('Server response status:', response.status);
  
      // Enhanced error handling
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        let errorMessage;
        if (isJson) {
          const errorData = await response.json();
          errorMessage = errorData.detail || 'Server error';
        } else {
          errorMessage = await response.text();
        }
        
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
      }
  
      return handleResponse(response);
    } catch (error) {
      console.error('Error in addKnownFace:', error);
      throw error;
    }
  },

  /**
   * Get a list of all known faces
   * @returns {Promise<Array>} - Resolves with an array of known face names
   */
  async getKnownFaces() {
    try {
      const response = await fetch(`${API_BASE_URL}/known-faces`);
      return handleResponse(response);
    } catch (error) {
      console.error('Error getting known faces:', error);
      throw error;
    }
  },

  /**
   * Analyze a face image
   * @param {File} file - The image file to analyze
   * @returns {Promise} - Resolves with the analysis results
   */
  async analyzeFace(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/analyze-face`, {
        method: 'POST',
        body: formData,
      });

      return handleResponse(response);
    } catch (error) {
      console.error('Error analyzing face:', error);
      throw error;
    }
  }
};