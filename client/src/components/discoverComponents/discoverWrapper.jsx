import { MenuOptions, DiscoverButton } from "./subComponents/index.jsx";
import genres from "./data/genres.json";
import perspective from "./data/perspectives.json";
import themes from "./data/themes.json";
import modes from "./data/modes.json";
import { useState } from "react";

export default function DiscoverWrapper({ discoverForm, handleChange }) {
    
    const [currentMenu, setCurrentMenu] = useState(null);

    const openMenu = (menuName) => {
        setCurrentMenu(menuName);
    }
    
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='Genre' />
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='POV' />
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='Themes' />
                <DiscoverButton openMenu={openMenu} currentMenu={currentMenu} menuName='Modes' />
            </div>
            <div className="w-full bg-surface-800/50 rounded-lg overflow-hidden">
                <MenuOptions selected={discoverForm.genre} handleChange={handleChange} options={genres} isHidden={currentMenu !== 'Genre'} name='genre' />
                <MenuOptions selected={discoverForm.playerPerspective} handleChange={handleChange} options={perspective} isHidden={currentMenu !== 'POV'} name='playerPerspective'/>
                <MenuOptions selected={discoverForm.themes} handleChange={handleChange} options={themes} isHidden={currentMenu !== 'Themes'} name='themes'/>
                <MenuOptions selected={discoverForm.modes} handleChange={handleChange} options={modes} isHidden={currentMenu !== 'Modes'} name='modes'/>
            </div>
        </div>
    )
}