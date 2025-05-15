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
        className="flex items-center text-2xl text-primary-400 hover:text-primary-200 focus:outline-none"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Account menu"
      >
        <FaUserCircle />
      </button>
      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-surface-800 border border-surface-700 rounded-md shadow-lg z-30">
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
                className="w-full flex items-center px-3 py-2 text-xs text-light hover:bg-surface-700 transition-colors duration-150 ease-in-out"
                onClick={() => setShowPasswordModal(true)}
              >
                <FaKey className="mr-2 text-gray-400" />
                Change Password
              </button>
            </li>
            <li>
              <button
                onClick={onLogout}
                className="w-full flex items-center px-3 py-2 text-xs text-light hover:bg-red-700 hover:text-white transition-colors duration-150 ease-in-out"
              >
                <FaSignOutAlt className="mr-2 text-gray-400" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
      {/* Change Password Modal - Consider making this smaller too if desired */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface-900 p-5 rounded-lg shadow-lg w-full max-w-xs">
            <h3 className="text-base font-bold mb-3 text-light">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-2.5">
              <input
                type="password"
                placeholder="Old Password"
                className="w-full p-1.5 text-sm rounded bg-surface-700 text-light border border-surface-600 focus:ring-primary-500 focus:border-primary-500"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-1.5 text-sm rounded bg-surface-700 text-light border border-surface-600 focus:ring-primary-500 focus:border-primary-500"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              {passwordError && <div className="text-red-500 text-xs">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-500 text-xs">{passwordSuccess}</div>}
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs rounded bg-gray-600 text-light hover:bg-gray-700"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordSuccess('');
                    setOldPassword('');
                    setNewPassword('');
                  }}
                  disabled={loading}
                >Cancel</button>
                <button
                  type="submit"
                  className="px-2.5 py-1 text-xs rounded bg-primary-600 text-light hover:bg-primary-700"
                  disabled={loading}
                >{loading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 