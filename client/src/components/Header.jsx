import { Link } from "react-router-dom";
import Aside from './headerComponents/Aside';
import { LuMenu, LuX, LuSearch } from "react-icons/lu";
import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import Auth from '../utils/auth';
import ProfileDropdown from './ProfileDropdown';

export default function Header() {
    const [asideOpen, setAsideOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(Auth.loggedIn());

    // Use Apollo's useQuery hook to fetch user data
    const { loading, error, data } = useQuery(GET_ME, {
        skip: !isLoggedIn, // Skip query if the user is not logged in
    });

    // Check login status whenever the component renders
    useEffect(() => {
        setIsLoggedIn(Auth.loggedIn());
    }, []);

    const toggleAside = () => {
        setAsideOpen(!asideOpen);
    };

    const handleLogout = () => {
        Auth.logout();
    };

    if (loading) {
        return <div className="text-center text-light mt-20">Loading...</div>;
    }

    if (error) {
        console.error("Error fetching user data:", error);
    }

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
                                <Link to="/search" className="text-2xl text-light hover:text-primary-600">
                                    <LuSearch />
                                </Link>
                                {isLoggedIn && data?.me ? (
                                    <ProfileDropdown user={data.me} onLogout={handleLogout} />
                                ) : (
                                    <button>
                                        <Link to="/login" className="text-lg font-medium text-light py-0.5 px-1 rounded-lg bg-primary-600 hover:bg-primary-700">Log in</Link>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <Aside asideOpen={asideOpen}/> 
        </div>
    );
}