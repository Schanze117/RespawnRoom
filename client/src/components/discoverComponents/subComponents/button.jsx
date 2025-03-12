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
        }else {
            openMenu(null);
        }
        
        setisOpenMenu(!isOpenMenu);
    }

    return (
      
        <div className="block">
            <button type="button" className="mx-2 sm:mx-3 rounded-lg py-1 px-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 relative" onClick={toggleOpen}>
                <h2 className="text-light text- sm:text-lg font-bold flex pr-3 sm:pr-5">{menuName}
                    {!isOpenMenu ? <LuChevronUp className={`absolute end-0.5 bottom-2`} /> :
                    <LuChevronDown className={`absolute end-0.5 bottom-2`}/> }
                </h2>
            </button>
        </div>
      
        
    )
}
