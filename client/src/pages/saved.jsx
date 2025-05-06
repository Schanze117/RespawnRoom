import SavedGameCard from "../components/card/savedGameCard";
import { useQuery } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import { Link } from "react-router-dom";

export default function Saved() {
    // Use Apollo's useQuery hook to fetch saved games
    const { loading, error, data } = useQuery(GET_ME);

    // Handle loading and error states
    if (loading) {
        return <div className="text-center text-light mt-20">Loading saved games...</div>;
    }

    if (error) {
        console.error("Error fetching saved games:", error);
        return <div className="text-center text-red-500 mt-20">Failed to load saved games. Please try again later.</div>;
    }

    // Extract saved games from the query result
    const savedGames = data?.me?.savedGames || [];

    return (
        <div className="mt-20 md:ml-55 mx-4 bg-surface-900 border-2 rounded-lg border-tonal-800 h-full">
            <h1 className="text-3xl font-bold text-light px-5 pt-3 text-center">Saved Games</h1>
            <div className="flex flex-wrap justify-center">
                {savedGames.length > 0 ? (
                    <SavedGameCard games={savedGames} />
                ) : (
                    <div className="text-sm font-medium text-gray-300">
                        No Saved Games Found{" "}
                        <Link to="/search" className="text-primary-800 hover:underline">
                            Search New Games
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}