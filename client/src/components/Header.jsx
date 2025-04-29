import { Link } from "react-router-dom";
import Aside from './headerComponents/Aside';
import { LuMenu, LuX } from "react-icons/lu";
import React, { useEffect, useState } from "react";
import Auth from '../utils/auth';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [asideOpen, setAsideOpen] = useState(false); // State to manage the aside menu
    const [isLoggedIn, setIsLoggedIn] = useState(Auth.loggedIn()); // State to manage login status

    useEffect(() => {
        const token = Auth.getToken();
        if (!token) {
            setError(new Error('No token found'));
            return;
        }
        fetch('/api/users/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(userData => setData(userData))
        .catch(error => {
            setError(error);
            console.error('Profile fetch error:', error);
        });
    }, []);

    const toggleAside = () => {
        setAsideOpen(!asideOpen);
    };

    const handleLogout = () => {
        Auth.logout();
        setIsLoggedIn(false);
    };

    return (
        <div>
            <header>
                <div className="fixed top-0 z-20 w-full bg-surface-900 border-b border-surface-600 py-2">
                    <div className="px-3 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex md:hidden items-center space-x-4">
                                <button onClick={toggleAside} className="text-3xl text-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-900">
                                    {!asideOpen ? <LuMenu /> : <LuX />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link to="/" className="text-xl font-bold text-primary-600">RespawnRoom</Link>
                            </div>
                            <div className="flex items-center space-x-4"> 
                                {isLoggedIn && data ?
                                    <ProfileDropdown user={data} onLogout={handleLogout} />
                                    :
                                    <button>
                                        <Link to="/login" className="text-lg font-medium text-light py-0.5 px-1 rounded-lg bg-primary-600 hover:bg-primary-700">Log in</Link>
                                    </button>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <Aside asideOpen={asideOpen}/> 
        </div>
    );
}