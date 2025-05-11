import { useState, useEffect } from 'react';
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function DiscoverButton({ openMenu, menuName, currentMenu }) {
    const [isOpenMenu, setisOpenMenu] = useState(false);

    useEffect(() => {
        if (currentMenu !== menuName){
            setisOpenMenu(false);
        }
    }, [currentMenu, menuName])

    function toggleOpen() {
        if (!isOpenMenu){
            openMenu(menuName);
        } else {
            openMenu(null);
        }
        setisOpenMenu(!isOpenMenu);
    }

    return (
        <button 
            type="button" 
            className={`flex items-center justify-between rounded-lg py-2 px-4 transition-colors duration-200 font-medium ${
                isOpenMenu 
                    ? 'bg-primary-600 text-white shadow-md' 
                    : 'bg-surface-800 text-light hover:bg-surface-700'
            }`} 
            onClick={toggleOpen}
        >
            <span className="mr-2">{menuName}</span>
            {isOpenMenu ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
        </button>
    )
}
