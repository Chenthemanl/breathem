// src/components/Admin/ReferenceManager.jsx

import React, { useState, useEffect } from 'react';
import { api } from '../../config/api';

const ReferenceManager = () => {
  // State management for the component
  const [references, setReferences] = useState({});
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load existing references when component mounts
  useEffect(() => {
    loadReferences();
  }, []);

  // Function to load all known faces
  const loadReferences = async () => {
    try {
      setLoading(true);
      const data = await api.listKnownFaces();
      setReferences(data);
      setError(null);
    } catch (err) {
      setError('Failed to load references: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission for adding a new person
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate inputs
    if (!newPersonName.trim()) {
      setMessage('Please enter a name');
      return;
    }

    if (!selectedFiles.length) {
      setMessage('Please select at least one photo');
      return;
    }

    try {
      setLoading(true);
      // Add the new reference face
      const result = await api.addKnownFace(newPersonName, selectedFiles);
      
      if (result.status === 'success') {
        setMessage('Successfully added reference photos!');
        // Reset form
        setNewPersonName('');
        setSelectedFiles([]);
        // Reload the references list
        await loadReferences();
      } else {
        setMessage('Error: ' + result.message);
      }
    } catch (err) {
      setMessage('Error adding reference: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  return (
    <div className="space-y-8">
      {/* Add new person form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Reference Face</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Person's Name
            </label>
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
              placeholder="Enter name"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Photos
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border rounded-md shadow-sm"
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Select multiple clear photos for better recognition
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 rounded-md text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Add Reference Face'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>

      {/* Display existing references */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Known Faces</h2>
        
        {error ? (
          <div className="text-red-600 p-3 bg-red-100 rounded-md">
            {error}
          </div>
        ) : loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : Object.keys(references).length === 0 ? (
          <div className="text-center text-gray-500">
            No reference faces added yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(references).map(([name, photos]) => (
              <div 
                key={name}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-lg">{name}</h3>
                <p className="text-sm text-gray-500">
                  {photos.length} reference photo{photos.length !== 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferenceManager;