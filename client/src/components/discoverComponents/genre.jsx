import { useState } from 'react';
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function Genres({ discoverForm, handleChange }) {

    const [openMenu, setOpenMenu] = useState("block");
    const [closeMenu, setCloseMenu] = useState("hidden");
    
    function toggleOpen() {
        const genres = document.querySelector('.genres');
        genres.classList.toggle('hidden');
        checkOpen();
    }

    function checkOpen(){
        const genres = document.querySelector('.genres');
        if (genres.classList.contains('hidden')) {
            setOpenMenu("block");
            setCloseMenu("hidden");
        } else {
            setOpenMenu("hidden");
            setCloseMenu("block");
        }    
    }

    return (
        <div>
            <div className="block">
                <button type="button" className="mx-3 rounded-lg py-1 px-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 relative" onClick={toggleOpen}>
                    <h2 className="text-light text-lg font-bold flex pr-5">Genres
                        <LuChevronUp className={`${openMenu} absolute end-0.5 bottom-2`} />
                        <LuChevronDown className={`${closeMenu} absolute end-0.5 bottom-2`}/>
                    </h2>
                </button>
            </div>
            <div className='flex items-center w-full ps-2 col-span-3 grid grid-cols-3 gap-4 genres hidden mt-5'>
                <ul className='flex flex-col col-span-1'>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Adventure"
                            checked={discoverForm.genre.includes("Adventure")}
                            onChange={handleChange}
                            id='adventure'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='adventure'>Adventure</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Arcade"
                            checked={discoverForm.genre.includes("Arcade")}
                            onChange={handleChange}
                            id='arcade'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='arcade'>Arcade</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Card & Board Game"
                            checked={discoverForm.genre.includes("Card & Board Game")}
                            onChange={handleChange}
                            id='card-board-game'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='card-board-game'>Card & Board Game</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Fighting"
                            checked={discoverForm.genre.includes("Fighting")}
                            onChange={handleChange}
                            id='fighting'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='fighting'>Fighting</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Hack and slash/Beat 'em up"
                            checked={discoverForm.genre.includes("Hack and slash/Beat 'em up")}
                            onChange={handleChange}
                            id='hack-and-slash'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='hack-and-slash'>Hack and slash/Beat 'em up</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Indie"
                            checked={discoverForm.genre.includes("Indie")}
                            onChange={handleChange}
                            id='indie'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='indie'>Indie</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Music"
                            checked={discoverForm.genre.includes("Music")}
                            onChange={handleChange}
                            id='music'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='music'>Music</label>
                    </div>
                </li>
                </ul>
                <ul className='flex flex-col col-span-1'>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Pinball"
                            checked={discoverForm.genre.includes("Pinball")}
                            onChange={handleChange}
                            id='pinball'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='pinball'>Pinball</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Platform"
                            checked={discoverForm.genre.includes("Platform")}
                            onChange={handleChange}
                            id='platform'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='platform'>Platform</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Point-and-click"
                            checked={discoverForm.genre.includes("Point-and-click")}
                            onChange={handleChange}
                            id='point-and-click'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='point-and-click'>Point-and-click</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Puzzle"
                            checked={discoverForm.genre.includes("Puzzle")}
                            onChange={handleChange}
                            id='puzzle'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='puzzle'>Puzzle</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Racing"
                            checked={discoverForm.genre.includes("Racing")}
                            onChange={handleChange}
                            id='racing'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='racing'>Racing</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Real Time Strategy (RTS)"
                            checked={discoverForm.genre.includes("Real Time Strategy (RTS)")}
                            onChange={handleChange}
                            id='real-time-strategy'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='real-time-strategy'>Real Time Strategy (RTS)</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Role-playing (RPG)"
                            checked={discoverForm.genre.includes("Role-playing (RPG)")}
                            onChange={handleChange}
                            id='role-playing'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='role-playing'>Role-playing (RPG)</label>
                    </div>
                </li>
                </ul>
                <ul className='flex flex-col col-span-1'>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Shooter"
                            checked={discoverForm.genre.includes("Shooter")}
                            onChange={handleChange}
                            id='shooter'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='shooter'>Shooter</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Simulator"
                            checked={discoverForm.genre.includes("Simulator")}
                            onChange={handleChange}
                            id='simulator'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='simulator'>Simulator</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Sport"
                            checked={discoverForm.genre.includes("Sport")}
                            onChange={handleChange}
                            id='sport'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='sport'>Sport</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Strategy"
                            checked={discoverForm.genre.includes("Strategy")}
                            onChange={handleChange}
                            id='strategy'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='strategy'>Strategy</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Tactical"
                            checked={discoverForm.genre.includes("Tactical")}
                            onChange={handleChange}
                            id='tactical'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='tactical'>Tactical</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="Turn-based strategy (TBS)"
                            checked={discoverForm.genre.includes("Turn-based strategy (TBS)")}
                            onChange={handleChange}
                            id='turn-based-strategy'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='turn-based-strategy'>Turn-based strategy (TBS)</label>
                    </div>
                </li>
                <li>
                    <div className='flex items-center ps-2'>
                        <input
                            type="checkbox"
                            name="genre"
                            value="MOBA"
                            checked={discoverForm.genre.includes("MOBA")}
                            onChange={handleChange}
                            id='MOBA'
                            className='hidden peer'
                        />
                        <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='MOBA'>MOBA</label>
                    </div>
                </li>
                </ul> 
            </div> 
        </div>
        
    )
}
