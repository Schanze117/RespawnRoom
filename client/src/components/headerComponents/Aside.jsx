import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LuSave, LuLayoutGrid, LuUsers, LuDoorOpen, LuCompass } from 'react-icons/lu';
import Auth from '../../utils/auth';
import { useQuery } from '@apollo/client';
import { GET_UNREAD_MESSAGE_COUNT } from '../../utils/queries';

export default function Aside({ asideOpen }) {
    const [isOpen, setIsOpen] = useState(false);
    const [username, setUsername] = useState('');
    const location = useLocation();
    
    const isLoggedIn = Auth.loggedIn();

    // Get unread message count with more frequent polling
    const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
        fetchPolicy: 'network-only',
        pollInterval: 5000 // Poll every 5 seconds instead of 30 seconds
    });

    const unreadCount = unreadCountData?.getUnreadMessageCount || 0;
    
    // Add an effect to refetch message count when visiting the Friends page
    useEffect(() => {
        if (location.pathname === '/friends') {
            refetchUnreadCount();
        }
    }, [location.pathname, refetchUnreadCount]);

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
                            <Link to="/" className={`flex items-center p-2 rounded-lg ${location.pathname === '/' ? 'bg-surface-600' : 'hover:bg-surface-600'} transition-colors duration-200`}>
                                <span className="flex items-center justify-center w-8 h-8"><LuLayoutGrid className="w-5 h-5" /></span>
                                <span className="ml-2">Home</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/discover" className={`flex items-center p-2 rounded-lg ${location.pathname === '/discover' ? 'bg-surface-600' : 'hover:bg-surface-600'} transition-colors duration-200`}>
                                <span className="flex items-center justify-center w-8 h-8"><LuCompass className="w-5 h-5" /></span>
                                <span className="ml-2">Discover</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/saved" className={`flex items-center p-2 rounded-lg ${location.pathname === '/saved' ? 'bg-surface-600' : 'hover:bg-surface-600'} transition-colors duration-200`}>
                                <span className="flex items-center justify-center w-8 h-8"><LuSave className="w-5 h-5" /></span>
                                <span className="ml-2">Saved</span>
                            </Link>
                        </li>
                        <li>
                            <Link to="/rooms" className={`flex items-center p-2 rounded-lg ${location.pathname === '/rooms' ? 'bg-surface-600' : 'hover:bg-surface-600'} transition-colors duration-200`}>
                                <span className="flex items-center justify-center w-8 h-8"><LuDoorOpen className="w-5 h-5" /></span>
                                <span className="ml-2">Rooms</span>
                            </Link>
                        </li>
                        <li>
                            <Link 
                                to="/friends" 
                                className={`flex items-center p-2 rounded-lg ${location.pathname === '/friends' ? 'bg-surface-600' : 'hover:bg-surface-600'} transition-colors duration-200`}
                                onClick={refetchUnreadCount} // Refetch unread count when clicking on Friends link
                            >
                                <span className="flex items-center justify-center w-8 h-8"><LuUsers className="w-5 h-5" /></span>
                                <span className="ml-2">Friends</span>
                                {/* Unread message counter - only show when count is greater than 0 */}
                                {unreadCount > 0 && (
                                    <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </aside>
    );
}