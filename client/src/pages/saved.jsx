import SavedGameCard from "../components/card/savedGameCard";
import { useQuery } from "@apollo/client";
import { GET_ME } from "../utils/queries";
import { Link } from "react-router-dom";
import { ConsistentPageLoader } from "../utils/LoadingSkeletons";

export default function Saved() {
    // Use Apollo's useQuery hook to fetch saved games
    const { loading, error, data } = useQuery(GET_ME);

    // Handle loading and error states
    if (loading) {
        return (
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-surface-900 border-2 border-tonal-800 shadow-lg overflow-hidden mb-6">
                        <div className="px-5 py-3 border-b border-tonal-800 z-10 relative">
                            <div className="h-8 bg-surface-700 w-40 animate-pulse rounded"></div>
                        </div>
                        <div className="w-full p-4 min-h-[200px]">
                            <div className="w-full flex justify-center">
                                {/* Skeleton rectangles for empty state text */}
                                <div className="text-center py-8 animate-pulse space-y-4">
                                    {/* "No Saved Games Found" skeleton */}
                                    <div className="h-5 bg-surface-700 rounded w-44 mx-auto"></div>
                                    {/* "Search New Games" link skeleton */}
                                    <div className="h-4 bg-surface-700 rounded w-32 mx-auto"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="text-center text-red-500 mt-20 md:ml-64">Failed to load saved games. Please try again later.</div>;
    }

    // Extract saved games from the query result
    const savedGames = data?.me?.savedGames || [];

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-surface-900 border-2 border-tonal-800 shadow-lg overflow-hidden mb-6">
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