import { useState } from 'react';
import { LuChevronDown, LuChevronUp } from "react-icons/lu";

export default function Perspectives({ discoverForm, handleChange }) {
    
    const [openMenu, setOpenMenu] = useState("block");
    const [closeMenu, setCloseMenu] = useState("hidden");
    
    function toggleOpen() {
        const perspectives = document.querySelector('.perspective');
        perspectives.classList.toggle('hidden');
        checkOpen();
    }

    function checkOpen(){
        const perspectives = document.querySelector('.perspective');
        if (perspectives.classList.contains('hidden')) {
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
                <button type="button" onClick={toggleOpen} className='mx-3 rounded-lg py-1 px-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 relative'>
                    <h2 className="text-light text-lg font-bold pr-5">Player Perspective
                        <LuChevronUp className={`${openMenu} absolute end-0.5 bottom-2`} />
                        <LuChevronDown className={`${closeMenu} absolute end-0.5 bottom-2`}/>
                    </h2>
                </button>
            </div>
            <div className='flex items-center ps-2 col-span-1 col-start-1 perspective hidden mt-5'>
                <ul className="block">
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="First-Person"
                                checked={discoverForm.playerPerspective.includes("First-Person")}
                                onChange={handleChange}
                                id='first-person'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='first-person'>First-Person</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Third-Person"
                                checked={discoverForm.playerPerspective.includes("Third-Person")}
                                onChange={handleChange}
                                id='third-person'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='third-person'>Third-Person</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Bird view / Isometric"
                                checked={discoverForm.playerPerspective.includes("Bird view / Isometric")}
                                onChange={handleChange}
                                id='bird-view'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='bird-view'>Bird view / Isometric</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Side view"
                                checked={discoverForm.playerPerspective.includes("Side view")}
                                onChange={handleChange}
                                id='side-view'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='side-view'>Side view</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Text"
                                checked={discoverForm.playerPerspective.includes("Text")}
                                onChange={handleChange}
                                id='Text'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='Text'>Text</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Auditory"
                                checked={discoverForm.playerPerspective.includes("Auditory")}
                                onChange={handleChange}
                                id='Auditory'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer mb-2" htmlFor='Auditory'>Auditory</label>
                        </div>
                    </li>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="playerPerspective"
                                value="Virtual Reality"
                                checked={discoverForm.playerPerspective.includes("Virtual Reality")}
                                onChange={handleChange}
                                id='virtual-reality'
                                className='hidden peer'
                            />
                            <label className="text-light peer-checked:bg-primary-500 py-1 px-2 rounded-md bg-surface-500 select-none cursor-pointer" htmlFor='virtual-reality'>Virtual Reality</label>
                        </div>
                    </li>
                </ul>
            </div>   
        </div>
        
    )
}
/*
<LuChevronUp />
<LuChevronDown />
*/