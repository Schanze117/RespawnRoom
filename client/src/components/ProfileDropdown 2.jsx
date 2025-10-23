import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaKey, FaSignOutAlt } from 'react-icons/fa';

/**
 * ProfileDropdown - Shows a profile/account icon with a dropdown menu for user actions.
 * @param {Object} props
 * @param {Object} props.user - The user object (should contain at least email)
 * @param {Function} props.onLogout - Function to call when logging out
 */
export default function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debug modal positioning when it opens
  useEffect(() => {
    if (showPasswordModal) {
      console.log('DEBUG: Password modal opened - useEffect triggered');
      console.log('DEBUG: Current window dimensions:', window.innerWidth, 'x', window.innerHeight);
      console.log('DEBUG: Current scroll position:', window.scrollY);
      
      // Log modal position after a short delay to ensure it's rendered
      setTimeout(() => {
        const modalElement = document.querySelector('[data-modal="password"]');
        if (modalElement) {
          console.log('DEBUG: Found modal element by data attribute');
          const rect = modalElement.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(modalElement);
          console.log('DEBUG: Modal position after useEffect:');
          console.log('  - getBoundingClientRect():', rect);
          console.log('  - computed position:', computedStyle.position);
          console.log('  - computed top:', computedStyle.top);
          console.log('  - computed left:', computedStyle.left);
        } else {
          console.log('DEBUG: Modal element not found by data attribute');
        }
      }, 200);
    }
  }, [showPasswordModal]);

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    setLoading(true);
    try {
      const token = localStorage.getItem('jwtToken');
      const res = await fetch('/api/users/me/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.message || 'Failed to change password.');
      } else {
        setPasswordSuccess('Password updated successfully!');
        setOldPassword('');
        setNewPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 1200);
      }
    } catch (err) {
      setPasswordError('Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Icon Button */}
      <button
        className="flex items-center text-2xl text-primary-400 focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
      >
        <FaUserCircle />
      </button>
      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-800 border-2 border-surface-600 rounded-md shadow-lg z-30">
          <div className="px-3 py-2 border-b border-surface-700">
            <p className="text-xs text-gray-400 mb-0.5">Signed in as</p>
            <div 
              className="text-xs text-light font-medium truncate" 
              title={user?.email || 'No email available'}
            >
              {user?.email || 'No email available'}
            </div>
          </div>
          <ul className="py-1">
            <li>
              <button 
                className="w-full flex items-center px-3 py-2 text-xs text-light hover:bg-red-600 hover:text-white transition-colors duration-200 group"
                onClick={() => {
                  console.log('DEBUG: Change Password button clicked - opening modal');
                  setShowPasswordModal(true);
                }}
              >
                <FaKey className="mr-2 text-gray-400 group-hover:text-white" />
                Change Password
              </button>
            </li>
            <li>
              <button
                onClick={onLogout}
                className="w-full flex items-center px-3 py-2 text-xs text-light hover:bg-red-600 hover:text-white transition-colors duration-200 group"
              >
                <FaSignOutAlt className="mr-2 text-gray-400 group-hover:text-white" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
      {showPasswordModal && (() => {
        console.log('DEBUG: Rendering password modal, showPasswordModal:', showPasswordModal);
        console.log('DEBUG: Modal styles will be - backdrop: rgba(0,0,0,0.6) with blur(15px), modal bg: white linear-gradient');
        console.log('DEBUG: Window dimensions:', window.innerWidth, 'x', window.innerHeight);
        console.log('DEBUG: Document scroll position:', window.scrollY);
        console.log('DEBUG: Viewport height:', window.visualViewport?.height || 'N/A');
        
        // Debug function to log modal position
        const logModalPosition = (element) => {
          if (element) {
            const rect = element.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(element);
            console.log('DEBUG: Modal position details:');
            console.log('  - getBoundingClientRect():', rect);
            console.log('  - computed position:', computedStyle.position);
            console.log('  - computed top:', computedStyle.top);
            console.log('  - computed left:', computedStyle.left);
            console.log('  - computed transform:', computedStyle.transform);
            console.log('  - computed z-index:', computedStyle.zIndex);
            console.log('  - offsetTop:', element.offsetTop);
            console.log('  - offsetLeft:', element.offsetLeft);
            console.log('  - clientTop:', element.clientTop);
            console.log('  - clientLeft:', element.clientLeft);
            
            // Check parent container positioning
            const parent = element.parentElement;
            if (parent) {
              const parentRect = parent.getBoundingClientRect();
              const parentStyle = window.getComputedStyle(parent);
              console.log('DEBUG: Parent container details:');
              console.log('  - parent position:', parentStyle.position);
              console.log('  - parent display:', parentStyle.display);
              console.log('  - parent alignItems:', parentStyle.alignItems);
              console.log('  - parent justifyContent:', parentStyle.justifyContent);
              console.log('  - parent getBoundingClientRect():', parentRect);
            }
            
            // Check for any conflicting CSS classes
            console.log('DEBUG: Modal element classes:', element.className);
            console.log('DEBUG: Modal element styles:', element.style.cssText);
          }
        };
        
        return (
        <div 
          onClick={(e) => {
            console.log('DEBUG: Backdrop clicked - closing modal');
            setShowPasswordModal(false);
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 animate-fadeIn flex items-center justify-center"
          style={{
            minHeight: '100vh',
            height: '100vh'
          }}
          ref={(el) => {
            if (el) {
              console.log('DEBUG: Backdrop element created');
              console.log('  - backdrop position:', window.getComputedStyle(el).position);
              console.log('  - backdrop display:', window.getComputedStyle(el).display);
              console.log('  - backdrop alignItems:', window.getComputedStyle(el).alignItems);
              console.log('  - backdrop justifyContent:', window.getComputedStyle(el).justifyContent);
            }
          }}
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              console.log('DEBUG: Modal content clicked - preventing close');
            }}
            className="bg-gradient-to-br from-surface-800 to-surface-700 rounded-2xl shadow-2xl w-full max-w-sm p-0 animate-slideIn"
            data-modal="password"
            style={{
              position: 'relative',
              zIndex: 9999
            }}
            ref={(el) => {
              if (el) {
                console.log('DEBUG: Modal element created');
                setTimeout(() => logModalPosition(el), 100); // Log position after render
              }
            }}
          >
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-primary-400/20 relative rounded-t-2xl">
              <h2 className="text-lg font-semibold text-light text-center m-0 tracking-tight">
                Change Password
              </h2>
            </div>
            
            {/* Form Section */}
            <div className="px-6 py-4">
              <form onSubmit={handlePasswordChange}>
                <div className="mb-4">
                  <input
                    className="w-full px-3 py-2.5 bg-surface-600 border border-primary-400/50 rounded-2xl text-light text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 placeholder-primary-300"
                    type="password"
                    placeholder="Current Password"
                    value={oldPassword}
                    onChange={e => {
                      setOldPassword(e.target.value);
                      console.log('DEBUG: Current password changed:', e.target.value.length, 'chars');
                    }}
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    className="w-full px-3 py-2.5 bg-surface-600 border border-primary-400/50 rounded-2xl text-light text-sm outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 placeholder-primary-300"
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      console.log('DEBUG: New password changed:', e.target.value.length, 'chars');
                    }}
                    required
                  />
                </div>
              
                {passwordError && (
                  <div className="mb-3 p-2.5 bg-red-900/30 border border-red-500/50 rounded-xl">
                    <p className="text-red-300 text-xs m-0">{passwordError}</p>
                  </div>
                )}
                
                {passwordSuccess && (
                  <div className="mb-3 p-2.5 bg-primary-900/30 border border-primary-500/50 rounded-xl">
                    <p className="text-primary-300 text-xs m-0">{passwordSuccess}</p>
                  </div>
                )}
              </form>
            </div>
            
            {/* Footer Section */}
            <div className="px-6 py-3 border-t border-primary-400/20 bg-surface-700/30 rounded-b-xl">
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-surface-600 border border-primary-400/50 rounded-xl text-primary-300 font-medium text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  type="button"
                  onClick={() => {
                    console.log('DEBUG: Cancel button clicked');
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setOldPassword('');
                    setNewPassword('');
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                
                <button
                  className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-light font-medium text-xs rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  onClick={handlePasswordChange}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )})()}
    </div>
  );
} 