import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";

export default function Header() {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const token = localStorage.getItem('jwtToken'); // Retrieve the token from local storage

        if (!token) {
            setError(new Error('No token found'));
            return;
        }

        fetch('.\api\videogame-routes.js', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(data => setData(data))
        .catch(error => setError(error));
    }, []);

    return (
        <header>
            <div className="fixed top-0 z-20 w-full bg-surface-900 border-b border-surface-600 py-2">
                <div className="px-3 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-xl font-bold text-primary-600">RespawnRoom</Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <a href="/login" className="text-sm font-medium text-primary-500 rounded-lg hover:bg-tonal-700">Login</a>
                            <a href="/register" className="text-sm font-medium text-primary-500">Register</a>
                        </div>
                    </div>
                </div>
            </div>
            {error && <div>Error: {error.message}</div>}
            {!data && !error && <div>Loading...</div>}
            {data && (
                <div>
                    <h1>Data from API</h1>
                    <pre>{JSON.stringify(data, null, 2)}</pre>
                </div>
            )}
        </header>
    );
}


// Add hover effect to the links in the header
// add top margin to pages