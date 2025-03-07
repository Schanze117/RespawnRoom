import { useState } from 'react';
import DiscoverWrapper from './discoverComponents/discoverWrapper';


export default function DiscoverForm() {
    const [discoverForm, setDiscoverForm] = useState({
        genre: [],
        playerPerspective: [],
        themes: [],
        modes: []
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
        <form className="flex flex-col space-y-4 px-2 pt-2 mb-3" onSubmit={handleSubmit}>
            <DiscoverWrapper discoverForm={discoverForm} handleChange={handleChange} />
            <button type="submit" className="py-2 mx-2.5 bg-primary-500 text-light rounded-lg">Search</button>
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