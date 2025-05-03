import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { LuSearch, LuSave, LuLayoutGrid, LuUsers, LuDoorOpen } from "react-icons/lu";
import { useQuery } from "@apollo/client";
import { GET_UNREAD_MESSAGE_COUNT } from "../../utils/queries";
import Auth from "../../utils/auth";

export default function Aside({ asideOpen }) {
    const [isOpen, setisOpen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    
    // Only query for unread messages if logged in
    const isLoggedIn = Auth.loggedIn();
    const { data: unreadData, refetch } = useQuery(GET_UNREAD_MESSAGE_COUNT, {
        skip: !isLoggedIn,
        fetchPolicy: 'network-only'
    });
    
    // Poll for new messages every 30 seconds
    useEffect(() => {
        if (isLoggedIn) {
            const interval = setInterval(() => {
                refetch();
            }, 30000);
            
            return () => clearInterval(interval);
        }
    }, [isLoggedIn, refetch]);
    
    // Update unread count when data changes
    useEffect(() => {
        if (unreadData?.getUnreadMessageCount) {
            setTotalUnread(unreadData.getUnreadMessageCount);
        }
    }, [unreadData]);

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
                        <Link to="/search" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuSearch /></span>Search</Link>
                    </li>
                    <li>
                        <Link to="/saved" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuSave /></span>Saved</Link>
                    </li>
                    <li>
                        <Link to="/rooms" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuDoorOpen /></span>Rooms</Link>
                    </li>
                    <li>
                        <Link to="/friends" className="flex items-center p-2 rounded-lg hover:bg-surface-600 relative"> 
                            <span className="px-2"><LuUsers /></span>Friends
                            {totalUnread > 0 && (
                                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            )}
                        </Link>
                    </li>
                </u>
            </div>
        </aside>
    )
}