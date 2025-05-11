import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LuSave, LuLayoutGrid, LuUsers, LuDoorOpen, LuCompass } from 'react-icons/lu';
import Auth from '../../utils/auth';

export default function Aside({ asideOpen }) {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    
    const isLoggedIn = Auth.loggedIn();

    useEffect(() => {
        setIsOpen(asideOpen);
        // Get username from localStorage
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, [asideOpen]);

    return (
        <aside
            className={`
                fixed top-0 left-0 h-screen
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0
                w-64 bg-surface-900 border-r border-surface-600 
                transition-transform duration-300 ease-in-out
                z-30 pt-20
            `}
            aria-label="Sidebar"
        >
            <div className="h-full px-4 py-5 overflow-y-auto flex flex-col">
                {/* Username display */}
                {isLoggedIn && username && (
                    <div className="mb-6 px-2">
                        <h2 className="text-xl font-semibold text-white">{username}</h2>
                    </div>
                )}

                <nav className="flex-1">
                    <ul className="space-y-4 font-medium text-lg text-light">
                        <li>
                            <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-surface-600 transition-colors duration-200">
                                <span className="flex items-center justify-center w-8 h-8"><LuLayoutGrid className="w-5 h-5" /></span>
                                <span className="ml-2">Home</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/discover" className="flex items-center p-2 rounded-lg hover:bg-surface-600 transition-colors duration-200">
                                <span className="flex items-center justify-center w-8 h-8"><LuCompass className="w-5 h-5" /></span>
                                <span className="ml-2">Discover</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/saved" className="flex items-center p-2 rounded-lg hover:bg-surface-600 transition-colors duration-200">
                                <span className="flex items-center justify-center w-8 h-8"><LuSave className="w-5 h-5" /></span>
                                <span className="ml-2">Saved</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/rooms" className="flex items-center p-2 rounded-lg hover:bg-surface-600 transition-colors duration-200">
                                <span className="flex items-center justify-center w-8 h-8"><LuDoorOpen className="w-5 h-5" /></span>
                                <span className="ml-2">Rooms</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/friends" className="flex items-center p-2 rounded-lg hover:bg-surface-600 transition-colors duration-200">
                                <span className="flex items-center justify-center w-8 h-8"><LuUsers className="w-5 h-5" /></span>
                                <span className="ml-2">Friends</span>
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}