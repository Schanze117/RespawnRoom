import { MenuOptions, DiscoverButton } from "./subComponents/index.jsx";
import genres from "./data/genres.json";
import perspective from "./data/perspectives.json";
import { useState } from "react";


export default function DiscoverWrapper({ discoverForm, handleChange }) {
    
    const [currentMenu, setCurrentMenu] = useState(null);

    const openMenu = (menuName) => {
        setCurrentMenu(menuName);
    }
    
    return (
        <div >
            <div className="flex">
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='Genre' />
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='Player Perspective' />
            </div>
            <div >
                <MenuOptions selected={discoverForm.genre} handleChange={handleChange} options={genres} isHidden={currentMenu !== 'Genre'} name='genre' />
                <MenuOptions selected={discoverForm.playerPerspective} handleChange={handleChange} options={perspective} isHidden={currentMenu !== 'Player Perspective'} name='playerPerspective'/>
            </div>
        </div>
    )
}