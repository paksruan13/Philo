import React from 'react';
import Register from './Register';

const SignUpOverlay = ({ isOpen, onClose, onSwitchToSignIn, onSuccess }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ease-in-out"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-100 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sign Up</h2>
              <p className="text-gray-600 text-sm mt-1">Join Project Phi today</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 text-2xl font-bold hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          <Register 
            onSwitchToLogin={onSwitchToSignIn}
            onSuccess={onSuccess}
            isModal={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SignUpOverlay;
