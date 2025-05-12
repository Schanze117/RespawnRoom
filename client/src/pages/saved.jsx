import SavedGameCard from "../components/card/savedGameCard";
import { useQuery } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import { Link } from "react-router-dom";

export default function Saved() {
    // Use Apollo's useQuery hook to fetch saved games
    const { loading, error, data } = useQuery(GET_ME);

    // Handle loading and error states
    if (loading) {
        return <div className="text-center text-light mt-20 md:ml-64">Loading saved games...</div>;
    }

    if (error) {
        console.error("Error fetching saved games:", error);
        return <div className="text-center text-red-500 mt-20 md:ml-64">Failed to load saved games. Please try again later.</div>;
    }

    // Extract saved games from the query result
    const savedGames = data?.me?.savedGames || [];

    return (
        <div className="flex-1 pt-20 md:pl-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-surface-900 border-2 rounded-lg border-tonal-800 shadow-lg overflow-hidden mb-6">
                    <h1 className="text-3xl font-bold text-light px-5 py-3 border-b border-tonal-800 z-10 relative">Saved Games</h1>
                    <div className="w-full p-4 min-h-[200px]">
                        {savedGames.length > 0 ? (
                            <div className="w-full flex justify-center">
                                <SavedGameCard games={savedGames} />
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-300">
                                No Saved Games Found{" "}
                                <Link to="/search" className="text-primary-800 hover:underline">
                                    Search New Games
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}