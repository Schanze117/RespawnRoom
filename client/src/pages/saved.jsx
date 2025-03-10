import GameCard from "../components/card/gameCard"

export default function Saved() {

    return(
        <div className="mt-20 sm:ml-55 mr-4 bg-surface-700 border-2 rounded-lg border-tonal-800 height-full">
            <h1 className="text-4xl font-bold text-center">Saved Games</h1>
            <div className="flex flex-wrap justify-center">
                { /* <GameCard games={results} /> */ } 
            </div>
        </div>
    )
}