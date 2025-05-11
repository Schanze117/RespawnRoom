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
        <>
            <aside
                className={`
                    fixed top-0 left-0 h-screen
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0
                    w-64 bg-surface-900 border-r border-surface-600 
                    transition-transform duration-300 ease-in-out
                    z-50
                `} 
                style={{ marginTop: '80px' }}
                aria-label="Sidebar"
            >
                <div className="h-full px-4 py-5 overflow-y-auto">
                    {/* Username display */}
                    {isLoggedIn && username && (
                        <div className="mb-6 px-2">
                            <h2 className="text-xl font-semibold text-white">{username}</h2>
                        </div>
                    )}

                    <ul className="space-y-4 font-medium text-lg text-light">
                        <li>
                            <Link to="/" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuLayoutGrid /></span>Home</Link>
                        </li>
                        <li>
                            <Link to="/discover" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuCompass /></span>Discover</Link>
                        </li>
                        <li>
                            <Link to="/saved" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuSave /></span>Saved</Link>
                        </li>
                        <li>
                            <Link to="/rooms" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuDoorOpen /></span>Rooms</Link>
                        </li>
                        <li>
                            <Link to="/friends" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuUsers /></span>Friends</Link>
                        </li>
                    </ul>
                </div>
            </aside>
        </>
    );
}