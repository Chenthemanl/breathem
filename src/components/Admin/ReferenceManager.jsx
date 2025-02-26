import React, { useRef, useState, useEffect } from 'react';
import { api } from '../../config/api';

const ReferenceManager = () => {
  // State management
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  
  // Refs for form inputs
  const fileInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Styles
  const styles = {
    container: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      padding: '24px',
      maxWidth: '600px',
      margin: '0 auto'
    },
    title: {
      fontSize: '24px',
      color: '#333',
      marginBottom: '24px',
      fontWeight: '600',
      borderBottom: '1px solid #eee',
      paddingBottom: '12px'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      marginBottom: '20px'
    },
    label: {
      fontWeight: '500',
      color: '#555',
      fontSize: '14px',
      marginBottom: '8px'
    },
    input: {
      padding: '10px 14px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '16px',
      transition: 'border-color 0.2s ease'
    },
    fileContainer: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '10px'
    },
    fileButton: {
      display: 'inline-block',
      backgroundColor: '#f1f1f1',
      color: '#555',
      padding: '10px 16px',
      borderRadius: '8px',
      cursor: 'pointer',
      fontSize: '14px',
      border: 'none'
    },
    fileText: {
      fontSize: '14px',
      color: '#777'
    },
    previewContainer: {
      marginTop: '16px',
      marginBottom: '16px'
    },
    previewLabel: {
      fontSize: '14px',
      color: '#555',
      marginBottom: '8px',
      fontWeight: '500'
    },
    previewImage: {
      maxWidth: '100%',
      maxHeight: '200px',
      borderRadius: '8px',
      border: '1px solid #eee'
    },
    submitButton: {
      backgroundColor: '#8F8F8F',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 20px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      marginTop: '8px',
      alignSelf: 'flex-start'
    },
    disabledButton: {
      backgroundColor: '#ccc',
      cursor: 'not-allowed'
    },
    errorMessage: {
      marginTop: '16px',
      padding: '12px 16px',
      backgroundColor: '#ffeeee',
      borderLeft: '4px solid #ff5555',
      color: '#cc0000',
      borderRadius: '4px'
    },
    successMessage: {
      marginTop: '16px',
      padding: '12px 16px',
      backgroundColor: '#eeffee',
      borderLeft: '4px solid #55aa55',
      color: '#007700',
      borderRadius: '4px'
    }
  };

  /**
   * Validates the file type and size
   * @param {File} file - The file to validate
   * @returns {boolean} - Whether the file is valid
   */
  const validateFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG or PNG image');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Image size should be less than 10MB');
      return false;
    }

    return true;
  };

  /**
   * Handles file selection and creates preview
   * @param {Event} event - The file input change event
   */
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setError('');
    
    if (file) {
      if (!validateFile(file)) {
        fileInputRef.current.value = '';
        setPreview('');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }
  };

  /**
   * Handles form submission
   * @param {Event} event - The form submit event
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const file = fileInputRef.current?.files[0];
    const name = nameInputRef.current?.value?.trim();

    // Enhanced validation
    if (!file) {
      setError('Please select a photo');
      return;
    }

    if (!name) {
      setError('Please enter a name');
      return;
    }

    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    try {
      // Log the form data for debugging
      console.log('Submitting form with:', {
        name: name,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });

      const result = await api.addKnownFace(file, name);
      setMessage(result.message || 'Reference face added successfully!');
      
      // Clear the form
      fileInputRef.current.value = '';
      nameInputRef.current.value = '';
      setPreview('');
    } catch (error) {
      const errorMessage = error.message || 'Error adding reference face';
      console.error('Form submission error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Add Reference Face</h2>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Person's Name:
          </label>
          <input
            type="text"
            ref={nameInputRef}
            style={styles.input}
            placeholder="Enter person's name"
            required
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>
            Reference Photo:
          </label>
          <div style={styles.fileContainer}>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="file-upload"
              required
            />
            <label htmlFor="file-upload" style={styles.fileButton}>
              Choose file
            </label>
            <span style={styles.fileText}>
              {fileInputRef.current?.files[0]?.name || "No file chosen"}
            </span>
          </div>
        </div>

        {preview && (
          <div style={styles.previewContainer}>
            <label style={styles.previewLabel}>Preview:</label>
            <img
              src={preview}
              alt="Preview"
              style={styles.previewImage}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading}
          style={{
            ...styles.submitButton,
            ...(isUploading ? styles.disabledButton : {})
          }}
        >
          {isUploading ? 'Uploading...' : 'Add Reference Face'}
        </button>
      </form>

      {error && (
        <div style={styles.errorMessage}>
          {error}
        </div>
      )}

      {message && (
        <div style={styles.successMessage}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ReferenceManager;