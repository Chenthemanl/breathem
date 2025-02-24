// src/components/Admin/AdminPanel.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ReferenceManager from './ReferenceManager';

const AdminPanel = () => {
  // State to manage active section
  const [activeSection, setActiveSection] = useState('references');

  // Navigation items
  const navItems = [
    { id: 'references', label: 'Reference Faces' },
    // Add more sections here as needed
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Happy Admin Panel
              </h1>
            </div>
            <Link
              to="/"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              Return to Happy
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="mb-8">
          <ul className="flex space-x-4 border-b">
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
                    activeSection === item.id
                      ? 'bg-white border-t border-l border-r text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content sections */}
        <div className="bg-white rounded-lg shadow">
          {activeSection === 'references' && <ReferenceManager />}
          {/* Add more sections here as needed */}
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>Happy Admin Panel - Manage reference faces and settings</p>
        </footer>
      </main>
    </div>
  );
};

export default AdminPanel;