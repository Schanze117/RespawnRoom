import { useState } from 'react';


export default function DiscoverForm() {
    const [discoverForm, setDiscoverForm] = useState({
        genre: [],
        playerPerspective: [],
    });


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setDiscoverForm((prev) => {
                if (checked) {
                    return { ...prev, [name]: [...prev[name], value] };
                } else {
                    return { ...prev, [name]: prev[name].filter((item) => item !== value) };
                }
            });
        } else {
            setDiscoverForm((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted:", discoverForm);
        setDiscoverForm({ genre: [], playerPerspective: [] });
    };

    return (
        <form className="flex flex-col space-y-4 p-4" onSubmit={handleSubmit}>
            <div className='grid grid-cols-4 gap-4'>
                {/* Genre */}
                <div className='flex items-center ps-2 col-span-3 grid grid-cols-3 gap-4'>
                    <ul className='flex flex-col col-span-1'>
                    <li>
                        <div className='flex items-center ps-2'>
                            <input
                                type="checkbox"
                                name="genre"
                                value="Adventure"
                                checked={discoverForm.genre.includes("Adventure")}
                                onChange={handleChange}
                            />
                            <label className="text-light">Adventure</label>
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
                            />
                            <label className="text-light">Arcade</label>
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
                            />
                            <label className="text-light">Card & Board Game</label>
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
                            />
                            <label className="text-light">Fighting</label>
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
                            />
                            <label className="text-light">Hack and slash/Beat 'em up</label>
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
                            />
                            <label className="text-light">Indie</label>
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
                            />
                            <label className="text-light">Music</label>
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
                            />
                            <label className="text-light">Pinball</label>
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
                            />
                            <label className="text-light">Platform</label>
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
                            />
                            <label className="text-light">Point-and-click</label>
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
                            />
                            <label className="text-light">Puzzle</label>
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
                            />
                            <label className="text-light">Racing</label>
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
                            />
                            <label className="text-light">Real Time Strategy (RTS)</label>
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
                            />
                            <label className="text-light">Role-playing (RPG)</label>
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
                            />
                            <label className="text-light">Shooter</label>
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
                            />
                            <label className="text-light">Simulator</label>
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
                            />
                            <label className="text-light">Sport</label>
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
                            />
                            <label className="text-light">Strategy</label>
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
                            />
                            <label className="text-light">Tactical</label>
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
                            />
                            <label className="text-light">Turn-based strategy (TBS)</label>
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
                            />
                            <label className="text-light">MOBA</label>
                        </div>
                    </li>
                    </ul> 
                </div>
                {/* Player Perspective */}
                <div className='flex items-center ps-2 col-span-1 col-start-4'>
                    <ul>
                        <li>
                            <div className='flex items-center ps-2'>
                                <input
                                    type="checkbox"
                                    name="playerPerspective"
                                    value="First-Person"
                                    checked={discoverForm.playerPerspective.includes("First-Person")}
                                    onChange={handleChange}
                                />
                                <label className="text-light">First-Person</label>
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
                                />
                                <label className="text-light">Third-Person</label>
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
                                />
                                <label className="text-light">Bird view / Isometric</label>
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
                                />
                                <label className="text-light">Side view</label>
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
                                />
                                <label className="text-light">Text</label>
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
                                />
                                <label className="text-light">Auditory</label>
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
            
            <button type="submit" className="p-2 bg-primary-500 text-light rounded-lg">Search</button>
        </form>
    )

}


// Use Virtual Reality as an example to show how to add a hidden checkbox and a label to the form

// Add a clear button to reset the form

// Add themes
/* 
{
		"id": 31,
		"name": "Drama",
		"slug": "drama"
	},
	{
		"id": 32,
		"name": "Non-fiction",
		"slug": "non-fiction"
	},
	{
		"id": 33,
		"name": "Sandbox",
		"slug": "sandbox"
	},
	{
		"id": 34,
		"name": "Educational",
		"slug": "educational"
	},
	{
		"id": 35,
		"name": "Kids",
		"slug": "kids"
	},
	{
		"id": 38,
		"name": "Open world",
		"slug": "open-world"
	},
	{
		"id": 39,
		"name": "Warfare",
		"slug": "warfare"
	},
	{
		"id": 40,
		"name": "Party",
		"slug": "party"
	},
	{
		"id": 41,
		"name": "4X (explore, expand, exploit, and exterminate)",
		"slug": "4x-explore-expand-exploit-and-exterminate"
	},
	{
		"id": 42,
		"name": "Erotic",
		"slug": "erotic"
	},
	{
		"id": 43,
		"name": "Mystery",
		"slug": "mystery"
	},
	{
		"id": 1,
		"name": "Action",
		"slug": "action"
	},
	{
		"id": 17,
		"name": "Fantasy",
		"slug": "fantasy"
	},
	{
		"id": 18,
		"name": "Science fiction",
		"slug": "science-fiction"
	},
	{
		"id": 19,
		"name": "Horror",
		"slug": "horror"
	},
	{
		"id": 20,
		"name": "Thriller",
		"slug": "thriller"
	},
	{
		"id": 21,
		"name": "Survival",
		"slug": "survival"
	},
	{
		"id": 22,
		"name": "Historical",
		"slug": "historical"
	},
	{
		"id": 23,
		"name": "Stealth",
		"slug": "stealth"
	},
	{
		"id": 27,
		"name": "Comedy",
		"slug": "comedy"
	},
	{
		"id": 28,
		"name": "Business",
		"slug": "business"
	},
	{
		"id": 44,
		"name": "Romance",
		"slug": "romance"
	}
*/

// Add modes

/*
{
		"id": 1,
		"name": "Single player",
		"slug": "single-player"
	},
	{
		"id": 2,
		"name": "Multiplayer",
		"slug": "multiplayer"
	},
	{
		"id": 3,
		"name": "Co-operative",
		"slug": "co-operative"
	},
	{
		"id": 4,
		"name": "Split screen",
		"slug": "split-screen"
	},
	{
		"id": 5,
		"name": "Massively Multiplayer Online (MMO)",
		"slug": "massively-multiplayer-online-mmo"
	},
	{
		"id": 6,
		"name": "Battle Royale",
		"slug": "battle-royale"
	} 
*/