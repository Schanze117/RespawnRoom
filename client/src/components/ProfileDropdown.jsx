import React, { useState, useRef, useEffect } from 'react';
import { FaUserCircle, FaMedal, FaKey, FaSignOutAlt } from 'react-icons/fa';
import BadgeMenu from './BadgeMenu';


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

  // Example badge data; replace with user.badges if available
  // const badges = user?.badges;
  const badges = [
    { src: '/assets/save1Game.png', name: 'First Saved Game' },
    { src: '/assets/save10Games.png', name: 'Save Enthusiast' },
    { src: '/assets/save100Games.png', name: 'Save Master' }, 
    { src: '/assets/firstGameSearch.png', name: 'First Searched Game' },
    { src: '/assets/tenGameSearch.png', name: 'Search Enthusiast' },
    { src: '/assets/hundredGameSearch.png', name: 'Search Master' },
  ];

  
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
        <div className="absolute right-0 mt-2 w-56 bg-surface-800 border border-surface-600 rounded-lg shadow-lg z-30">
          <div className="px-4 py-3 border-b border-surface-600">
            <div className="text-sm text-light font-semibold">{user?.email || 'No email'}</div>
          </div>
          <ul className="py-1">
            <li>
              <button className="w-full flex items-center px-4 py-2 text-light hover:bg-surface-700 rounded transition-colors"
                onClick={() => setShowPasswordModal(true)}
              >
                <FaKey className="mr-2" />
                Change Password
              </button>
            </li>
            <li>
              <div className="flex items-center justify-start px-4 py-2 text-light">
                <BadgeMenu badges={badges}/>
              </div>
            </li>
            <li>
              <button
                onClick={onLogout}
                className="w-full flex items-center px-4 py-2 text-light hover:bg-red-600 rounded transition-colors"
              >
                <FaSignOutAlt className="mr-2" />
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface-900 p-6 rounded-lg shadow-lg w-full max-w-xs">
            <h3 className="text-lg font-bold mb-4 text-light">Change Password</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <input
                type="password"
                placeholder="Old Password"
                className="w-full p-2 rounded bg-surface-700 text-light border border-surface-600"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="New Password"
                className="w-full p-2 rounded bg-surface-700 text-light border border-surface-600"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              {passwordError && <div className="text-red-500 text-sm">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-500 text-sm">{passwordSuccess}</div>}
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded bg-gray-600 text-light hover:bg-gray-700"
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
                  className="px-3 py-1 rounded bg-primary-600 text-light hover:bg-primary-700"
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