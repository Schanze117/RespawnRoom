import { useState } from 'react';
import { LuSearch } from "react-icons/lu";

export default function SearchForm() {
    
    const [searchForm, setSearchForm] = useState({
            search: ''
        });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSearchForm((prev) => ({ ...prev, [name]: value }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form submitted:", searchForm);
        setSearchForm({ search: '' });
    }

    return (
        <form className="flex  mx-auto space-y-4 px-4 pt-4" onSubmit={handleSubmit}>
            <label className="mb-2 text-sm font-medium sr-only">Search</label>
                <div className='relative text-light w-full'>
                    <div className='absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none'>
                        <LuSearch />
                    </div>
                    <input
                        type="text"
                        name="search"
                        value={searchForm.search}
                        onChange={handleChange}
                        placeholder="Search by name" 
                        className="block w-full ps-10 px-3 py-1.5 rounded-lg bg-surface-500 text-light outline-1 outline-tonal-600 focus:outline-primary-400 -outline-offset-1 focus-within:outline-2 focus-within:-outline-offset-2"
                    />
                    <button type="submit" className="absolute end-1.5 bottom-0.5 text-light text-sm font-medium px-3 py-1.5 bg-primary-500 hover:bg-primary-700 focus:ring-3 focus:outline-none focus:ring-primary-800 rounded-lg">Search</button>
                </div>
                
            
            
        </form>
    )
}

