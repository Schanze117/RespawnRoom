import { Link } from "react-router-dom";
import { useState } from "react";
import Aside from './headerComponents/Aside';
import { LuMenu, LuX } from "react-icons/lu";

export default function Header() {

    const [asideOpen, setasideOpen] = useState(false);

    function toggleAside() {
        setasideOpen(!asideOpen);
    }
    // State to hold the user
    const [user, setUser] = useState(null);

    // Function to check if user is logged in
    const isLoggedIn = () => {
        if (localStorage.getItem("token") !== null){
            return true;
        }else {
            return false;
        }
    }

    // Function to handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/";
    }
    return (
        <div>
            <header>
                <div className="fixed top-0 z-20 w-full bg-surface-900 border-b border-surface-600 py-2">
                    <div className="px-3 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex md:hidden items-center space-x-4">
                                <button onClick={toggleAside} className="text-3xl text-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-900">
                                    {!asideOpen ?
                                    <LuMenu /> :
                                    <LuX />}
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link to="/" className="text-xl font-bold text-primary-600">RespawnRoom</Link>
                            </div>
                            <div className="flex items-center space-x-4"> 
                                {!isLoggedIn() ? 
                                <button>
                                <Link to="/login" className="text-lg font-medium text-light py-0.5 px-1 rounded-lg bg-primary-600 hover:bg-primary-700">Log in</Link> 
                                </button> 
                                :
                                <button onClick={handleLogout}>
                                <Link to="/login" className="text-lg font-medium text-light py-0.5 px-1 rounded-lg bg-primary-600 hover:bg-primary-700">Log out</Link> 
                                </button>}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            <Aside asideOpen={asideOpen}/> 
        </div>
        
        
    )
}

// Add hover effect to the links in the header
// add top margin to pages