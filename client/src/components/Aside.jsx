import { Link } from "react-router-dom";
import { LuSearch, LuSave } from "react-icons/lu";

export default function Aside() {

    return (
        <aside className="fixed top-0 left-0 z-10 w-50 pt-20 h-full bg-surface-900 border-r border-surface-600" aria-label="Sidebar">
            <div className="h-full px-4 bp-5 overflow-y-auto nav-links no-underline">
                <u className="space-y-4 font-medium text-lg text-light no-underline list-none">
                    <li>
                        <Link to="/search" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuSearch /></span>Search</Link>
                    </li>
                    <li>
                        <Link to ="/saved" className="flex items-center p-2 rounded-lg hover:bg-surface-600"> <span className="px-2"><LuSave /></span>Saved</Link>
                    </li>
                </u>
            </div>
        </aside>
    )
}