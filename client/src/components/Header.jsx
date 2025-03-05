import { Link } from "react-router-dom";

export default function Header() {
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
        </header>
    );
}

// Add hover effect to the links in the header
// add top margin to pages