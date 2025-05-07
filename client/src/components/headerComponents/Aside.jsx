import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { LuSave, LuLayoutGrid, LuUsers, LuDoorOpen, LuCompass } from "react-icons/lu";
import Auth from "../../utils/auth";

export default function Aside({ asideOpen }) {
    const [isOpen, setisOpen] = useState(false);
    
    // Only check login status
    const isLoggedIn = Auth.loggedIn();

    useEffect(() => {
        if (asideOpen === true){
            setisOpen(true);
        }else {
            setisOpen(false);
        }
    }
    , [asideOpen])

    return (
        <aside className={`${isOpen ? "" : "hidden"}
        md:flex fixed top-0 left-0 z-10 w-50 pt-20 h-full bg-surface-900 border-r border-surface-600`} aria-label="Sidebar">
            <div className="h-full px-4 bp-5 overflow-y-auto nav-links no-underline">
                <u className="space-y-4 font-medium text-lg text-light no-underline list-none">
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
                        <Link to="/friends" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> 
                            <span className="px-2"><LuUsers /></span>Friends
                        </Link>
                    </li>
                </u>
            </div>
        </aside>
    )
}